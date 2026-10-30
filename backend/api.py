"""Local FastAPI adapter for the existing YOLO26n / OpenCV traffic project.

Run from the repository root:
    py -m uvicorn backend.api:app --reload

This adds a browser-friendly MJPEG stream and per-frame detection statistics.
It does not replace backend/object_detection.py.
"""
from collections import Counter
from pathlib import Path
from threading import Event, Lock
from time import monotonic, sleep
from typing import Literal

import cv2
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, StreamingResponse

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
VIDEO_PATH = BACKEND / "videos" / "traffic.mp4"
WEIGHTS_PATH = ROOT / "yolo26n.pt"
VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck (COCO)
CONFIDENCE = 0.25

app = FastAPI(title="Traffic Vision API", version="0.3.0")

state_lock = Lock()
stop_signal = Event()
current_state = {
    "status": "idle",
    "active": False,
    "source": None,
    "frame": 0,
    "count": 0,
    "counts": {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0},
    "detections": [],
    "error": None,
}
_model = None
_model_lock = Lock()
_last_jpeg = None


def load_model():
    """Load YOLO only when somebody requests a stream."""
    global _model
    with _model_lock:
        if _model is None:
            from ultralytics import YOLO
            # A local file is preferred. Ultralytics can download an official
            # model by name if one has not been saved in the project yet.
            _model = YOLO(str(WEIGHTS_PATH) if WEIGHTS_PATH.exists() else "yolo26n.pt")
        return _model


def update_state(**changes):
    with state_lock:
        current_state.update(changes)


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "model": "YOLO26n",
        "video_available": VIDEO_PATH.is_file(),
        "video_path": "backend/videos/traffic.mp4",
    }


@app.get("/api/stats")
def stats():
    with state_lock:
        # Copy nested values to avoid mutating data while JSON is serialized.
        return {
            **current_state,
            "counts": current_state["counts"].copy(),
            "detections": [d.copy() for d in current_state["detections"]],
        }


@app.get("/api/last-frame")
def last_frame():
    with state_lock:
        data = _last_jpeg
    if data is None:
        raise HTTPException(status_code=404, detail="No frame has been processed yet.")
    return Response(content=data, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@app.post("/api/stop")
def stop():
    stop_signal.set()
    return {"ok": True}


def frames(cap):
    """Generate JPEGs for <img src='/api/stream'>, updating shared stats."""
    global _last_jpeg
    had_error = False
    try:
        model = load_model()
        while not stop_signal.is_set():
            start = monotonic()
            ok, frame = cap.read()
            if not ok:
                break

            # Downsize large source video to reduce CPU cost.
            height, width = frame.shape[:2]
            if width > 960:
                frame = cv2.resize(frame, (960, round(height * 960 / width)))

            result = model.predict(
                frame,
                classes=VEHICLE_CLASSES,
                conf=CONFIDENCE,
                imgsz=640,
                verbose=False,
            )[0]
            items = []
            for box in result.boxes:
                class_id = int(box.cls[0])
                items.append({
                    "label": result.names[class_id].capitalize(),
                    "confidence": round(float(box.conf[0]) * 100),
                })

            counts = Counter(item["label"].lower() for item in items)
            with state_lock:
                current_state["frame"] += 1
                current_state["count"] = len(items)
                current_state["counts"] = {
                    name: counts[name] for name in ("car", "truck", "bus", "motorcycle")
                }
                current_state["detections"] = items
                current_state["status"] = "processing"

            annotated = result.plot()
            success, encoded = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if success:
                jpeg = encoded.tobytes()
                with state_lock:
                    _last_jpeg = jpeg
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
                )

            # Avoid playing video files faster than ~15 frames per second.
            elapsed = monotonic() - start
            if elapsed < 1 / 15:
                sleep(1 / 15 - elapsed)
    except Exception as exc:
        had_error = True
        update_state(status="error", error=str(exc))
    finally:
        cap.release()
        with state_lock:
            current_state["active"] = False
            if not had_error:
                current_state["status"] = "stopped" if stop_signal.is_set() else "finished"


@app.get("/api/stream")
def stream(source: Literal["video", "webcam"] = "video"):
    if source == "video" and not VIDEO_PATH.is_file():
        raise HTTPException(
            status_code=404,
            detail="Missing backend/videos/traffic.mp4; place your video there first.",
        )

    with state_lock:
        if current_state["active"]:
            raise HTTPException(status_code=409, detail="A stream is already running. Stop it first.")
        current_state.update({
            "active": True,
            "status": "starting",
            "source": source,
            "frame": 0,
            "count": 0,
            "counts": {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0},
            "detections": [],
            "error": None,
        })
        stop_signal.clear()

    cap = cv2.VideoCapture(str(VIDEO_PATH) if source == "video" else 0)
    if not cap.isOpened():
        cap.release()
        update_state(active=False, status="error", error=f"Could not open {source} source")
        raise HTTPException(status_code=503, detail=f"Could not open {source} source")

    return StreamingResponse(
        frames(cap),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store", "X-Content-Type-Options": "nosniff"},
    )
