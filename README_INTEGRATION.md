# Traffic Vision — React + FastAPI + YOLO26n integration

This is an **overlay for your existing GitHub repository**, not a replacement for the entire project.
Keep your working `backend/object_detection.py` and `yolo26n.pt` in place. The browser API uses a hosted Pixabay traffic sample by default; an optional `backend/videos/traffic.mp4` overrides it.

## Files to copy

Copy all contents of this folder into the root of your cloned `real-time-object-detection-for-traffic-cameras-demo` repository. When asked, replace the matching React/Vite files. This adds `backend/api.py` without changing your working `backend/object_detection.py`.

If the repo has an existing `backend/requirements.txt` with more dependencies, **merge** the four lines below rather than deleting its other entries.

## Backend — VS Code terminal #1 (from the repository root)

```bash
python3 -m pip install -r backend/requirements.txt
python3 -m uvicorn backend.api:app --reload
```

Check `http://127.0.0.1:8000/api/health`. **Pixabay sample clip (online)** streams from Pixabay when no local video is present. To use your own clip instead, put it at `backend/videos/traffic.mp4`. **Computer webcam** uses the camera attached to the computer running FastAPI. Model weights may be placed at the repository root as `yolo26n.pt`; if they are absent, Ultralytics attempts to download them the first time detection starts.

## Frontend — VS Code terminal #2 (also from repository root)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), select a source, and click **Start detection**. Wait for the first inference; it can take longer on the first run. Traffic video loops until you click **Stop detection**. The preview uses the FastAPI MJPEG stream, and the sidebar fetches `/api/stats` every 800 ms. The demo clip is a Pixabay video; [view the source and license information](https://pixabay.com/videos/traffic-bus-car-transportation-28293/) and credit the creator in presentation materials.

The Vite proxy in `vite.config.js` routes `/api` to `127.0.0.1:8000`, so both servers must be running for the preview to work. The stream supports one viewer at a time and is intended for local development.

## API endpoints

- `GET /api/health` — checks backend and reports whether the local or hosted sample clip is selected
- `GET /api/stream?source=video` — live annotated MJPEG stream of the local video, or the hosted Pixabay sample when no local video exists
- `GET /api/stream?source=webcam` — annotated local webcam stream
- `GET /api/stats` — per-frame vehicle categories and confidences
- `GET /api/last-frame` — the last annotated frame as a JPEG once the video ends
- `POST /api/stop` — request stream stop

The counter describes **detections in the current frame**, not the cumulative number of unique vehicles. For unique vehicle counting, implement tracking and line-crossing logic in a later version.

## GitHub

Check `.gitignore` includes:

```gitignore
node_modules/
.venv/
venv/
__pycache__/
*.pt
backend/videos/
backend/output/
```

Then stage only code and text files, review your changes, and use your team's Git workflow to commit. Avoid pushing model weights or sample videos to GitHub.
