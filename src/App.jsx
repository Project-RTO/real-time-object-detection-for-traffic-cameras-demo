import { useEffect, useState } from 'react'

const EMPTY_STATS = {
  count: 0,
  counts: { car: 0, truck: 0, bus: 0, motorcycle: 0 },
  detections: [],
  frame: 0,
  status: 'idle',
  active: false,
  error: null,
}

function TrafficPreview() {
  return (
    <div className="video-placeholder">
      <div className="placeholder-icon">▶</div>
      <strong>Camera preview</strong>
      <p>Choose a source and press Start detection to see live YOLO26n output.</p>
    </div>
  )
}

export default function App() {
  const [online, setOnline] = useState(false)
  const [videoAvailable, setVideoAvailable] = useState(false)
  const [source, setSource] = useState('video')
  const [running, setRunning] = useState(false)
  const [streamKey, setStreamKey] = useState(0)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [error, setError] = useState('')

  // Check whether FastAPI is reachable via Vite's /api proxy.
  useEffect(() => {
    let cancelled = false
    async function checkHealth() {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) throw new Error('Backend health check failed')
        const info = await response.json()
        if (!cancelled) {
          setOnline(true)
          setVideoAvailable(info.video_available)
        }
      } catch {
        if (!cancelled) setOnline(false)
      }
    }
    checkHealth()
    const timer = setInterval(checkHealth, 5000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  // Poll the backend for per-frame metadata. The video itself is an MJPEG stream.
  useEffect(() => {
    if (!running) return undefined
    let cancelled = false
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) throw new Error('Detection statistics unavailable')
        const next = await response.json()
        if (cancelled) return
        setStats(next)
        if (next.status === 'error') {
          setError(next.error || 'The detector reported an error.')
          setRunning(false)
        } else if (next.status === 'finished' || next.status === 'stopped') {
          setRunning(false)
        }
      } catch {
        if (!cancelled) setError('Could not retrieve detection statistics.')
      }
    }
    fetchStats()
    const timer = setInterval(fetchStats, 800)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [running])

  function startDetection() {
    if (!online) {
      setError('Start the FastAPI backend before launching detection.')
      return
    }
    if (source === 'video' && !videoAvailable) {
      setError('Put traffic.mp4 in backend/videos/ and try again.')
      return
    }
    setError('')
    setStats(EMPTY_STATS)
    setStreamKey(key => key + 1)
    setRunning(true)
  }

  async function stopDetection() {
    try {
      await fetch('/api/stop', { method: 'POST' })
    } catch {
      setError('Could not notify the backend to stop. Check the terminal.')
    }
    setRunning(false)
  }

  const statusText = !online ? 'BACKEND OFFLINE' : running ? 'DETECTING' : 'READY'
  const statusColor = !online ? 'offline' : running ? 'live' : 'ready'
  const detected = stats.detections || []
  const counts = stats.counts || EMPTY_STATS.counts

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Traffic Vision home">
          <span className="brand-icon">TV</span>
          <span>Traffic Vision</span>
        </a>
        <span className="project-label">COLLEGE PROJECT · OBJECT DETECTION</span>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">REAL-TIME TRAFFIC MONITORING</p>
          <h1>Traffic camera object detection</h1>
          <p className="intro-copy">Live vehicle detection powered by OpenCV, FastAPI and YOLO26n.</p>
        </div>
        <span className={`status ${statusColor}`}><span className="status-dot" />{statusText}</span>
      </section>

      <section className="content-grid">
        <article className="card preview-card">
          <div className="card-heading">
            <div>
              <h2>Detection preview</h2>
              <p>Real bounding boxes around detected road users</p>
            </div>
            <span className="preview-tag">{running ? 'LIVE STREAM' : stats.frame > 0 ? 'LAST FRAME' : 'IDLE'}</span>
          </div>
          <div className="preview-frame">
            {running ? (
              <img
                key={streamKey}
                className="stream-frame"
                src={`/api/stream?source=${source}&v=${streamKey}`}
                alt="YOLO26n annotated traffic video stream"
                onError={() => {
                  setError('Could not open the video stream. Check the backend terminal and video path.')
                  setRunning(false)
                }}
              />
            ) : stats.frame > 0 ? (
              <img
                className="stream-frame"
                src={`/api/last-frame?frame=${stats.frame}`}
                alt="Most recently processed traffic frame with bounding boxes"
              />
            ) : <TrafficPreview />}
          </div>
          <div className="legend">
            <span><i className="green" /> Car {counts.car}</span>
            <span><i className="blue" /> Bus {counts.bus}</span>
            <span><i className="amber" /> Truck {counts.truck}</span>
            <span><i className="green" /> Motorcycle {counts.motorcycle}</span>
          </div>
          <p className="preview-note">Counts and confidence values reflect the latest processed frame, not unique vehicles.</p>
        </article>

        <aside className="card details-card">
          <div className="card-heading">
            <div>
              <h2>Detection summary</h2>
              <p>Actual YOLO26n predictions</p>
            </div>
          </div>
          <div className="summary-count">
            <strong>{String(stats.count).padStart(2, '0')}</strong>
            <span>vehicles in current frame</span>
          </div>
          <div className="detection-list">
            {detected.length ? detected.slice(0, 10).map((detection, index) => (
              <div className="detection-row" key={`${stats.frame}-${index}`}>
                <span className={`object-icon ${detection.label === 'Bus' ? 'blue' : detection.label === 'Truck' ? 'amber' : 'green'}`}>▰</span>
                <span className="object-name">
                  {detection.label}
                  <small>Object {String(index + 1).padStart(2, '0')}</small>
                </span>
                <strong className="confidence">{detection.confidence}%</strong>
              </div>
            )) : <p className="no-detections">No vehicle detections yet. Start a stream to begin.</p>}
            {detected.length > 10 && <p className="no-detections">+{detected.length - 10} additional detections</p>}
          </div>
          <div className="model-card">
            <div className="model-heading"><span className="model-mark">YOLO</span><strong>YOLO26n</strong></div>
            <dl>
              <div><dt>Input</dt><dd>{source === 'video' ? 'Traffic MP4' : 'Computer webcam'}</dd></div>
              <div><dt>Confidence threshold</dt><dd>25%</dd></div>
              <div><dt>Output</dt><dd>FastAPI MJPEG stream</dd></div>
              <div><dt>Frames processed</dt><dd>{stats.frame}</dd></div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="setup">
        <div>
          <h2>Run the detector</h2>
          <p>Choose a local source and control the Python detection backend.</p>
        </div>
        <div className="controls">
          <label className="source-label" htmlFor="source-select">Video source</label>
          <select
            id="source-select"
            value={source}
            disabled={running}
            onChange={event => setSource(event.target.value)}
          >
            <option value="video">Traffic video (traffic.mp4)</option>
            <option value="webcam">Computer webcam</option>
          </select>
          {running ? (
            <button type="button" className="stop-button" onClick={stopDetection}>Stop detection</button>
          ) : (
            <button type="button" onClick={startDetection}>Start detection</button>
          )}
        </div>
      </section>
      {error && <p className="app-error" role="alert">{error}</p>}
      {!online && <p className="backend-hint">Backend unavailable. Run <code>py -m uvicorn backend.api:app --reload</code> in a separate terminal.</p>}

      <footer>Traffic Vision <span>·</span> React frontend connected to the local YOLO26n API</footer>
    </main>
  )
}
