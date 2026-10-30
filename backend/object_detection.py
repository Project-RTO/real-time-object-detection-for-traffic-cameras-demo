
import cv2
import argparse
from pathlib import Path
from collections import Counter
from ultralytics import YOLO

# Project paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

# Model settings
MODEL_PATH = PROJECT_DIR / "yolo26n.pt"
VEHICLE_CLASSES = [2, 3, 5, 7]
CONFIDENCE = 0.4


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        default="0",
        help="Camera index or video file path"
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save annotated video"
    )
    args = parser.parse_args()

    # Load YOLO26n
    model = YOLO(str(MODEL_PATH))

    # Select webcam or video
    source = (
        int(args.source)
        if args.source.isdigit()
        else args.source
    )

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        raise RuntimeError(f"Cannot open source: {source}")

    writer = None
    output_dir = BACKEND_DIR / "output"
    output_file = output_dir / "detected_traffic.mp4"

    try:
        if args.save:
            output_dir.mkdir(exist_ok=True)

            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)

            if fps <= 0:
                fps = 30

            writer = cv2.VideoWriter(
                str(output_file),
                cv2.VideoWriter_fourcc(*"mp4v"),
                fps,
                (width, height)
            )

            if not writer.isOpened():
                raise RuntimeError("Cannot create output video")

        while True:
            success, frame = cap.read()

            if not success:
                break

            # Only detect vehicle categories
            result = model.predict(
                frame,
                classes=VEHICLE_CLASSES,
                conf=CONFIDENCE,
                verbose=False
            )[0]

            # Count vehicles in current frame
            counts = Counter()

            for box in result.boxes:
                class_id = int(box.cls[0])
                name = result.names[class_id]
                counts[name] += 1

            total = sum(counts.values())

            # Draw YOLO bounding boxes
            annotated = result.plot()

            # Display vehicle counts
            labels = [
                f"Total vehicles: {total}",
                f"Cars: {counts['car']}",
                f"Trucks: {counts['truck']}",
                f"Buses: {counts['bus']}",
                f"Motorcycles: {counts['motorcycle']}"
            ]

            for index, label in enumerate(labels):
                cv2.putText(
                    annotated,
                    label,
                    (15, 35 + index * 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

            cv2.imshow("Traffic Detection v0.2", annotated)

            if writer is not None:
                writer.write(annotated)

            # Press Q to close
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        cap.release()

        if writer is not None:
            writer.release()
            print(f"Video saved: {output_file}")

        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
