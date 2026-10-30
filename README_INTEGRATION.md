# Traffic Vision — React + FastAPI + YOLO26n integration

This is an **overlay for your existing GitHub repository**, not a replacement for the entire project.
Keep your working `backend/object_detection.py`, `backend/videos/traffic.mp4`, and `yolo26n.pt` in place.

## Files to copy

Copy all contents of this folder into the root of your cloned `real-time-object-detection-for-traffic-cameras-demo` repository. When asked, replace the matching React/Vite files. This adds `backend/api.py` without changing your working `backend/object_detection.py`.

If the repo has an existing `backend/requirements.txt` with more dependencies, **merge** the four lines below rather than deleting its other entries.

## Backend — VS Code terminal #1 (PowerShell, from repository root)

```powershell
py -m pip install -r backend/requirements.txt
py -m uvicorn backend.api:app --reload
```

Check `http://127.0.0.1:8000/api/health`. Expect `video_available: true` when `backend/videos/traffic.mp4` exists. Model weights should be at the repository root (`yolo26n.pt`), or Ultralytics will try to download them on first use.

## Frontend — VS Code terminal #2 (also from repository root)

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`, select **Traffic video**, and click **Start detection**. Wait for the first inference; it can take longer on the first run. The preview uses the FastAPI MJPEG stream, and the sidebar fetches `/api/stats` every 800 ms. You can also select **Computer webcam** (the camera attached to the computer running FastAPI).

The Vite proxy in `vite.config.js` routes `/api` to `127.0.0.1:8000`, so both servers must be running for the preview to work. The stream supports one viewer at a time and is intended for local development.

## API endpoints

- `GET /api/health` — checks backend and video file presence
- `GET /api/stream?source=video` — live annotated MJPEG stream of `backend/videos/traffic.mp4`
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
