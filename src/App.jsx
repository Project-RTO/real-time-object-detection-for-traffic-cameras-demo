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
    <svg
      className="traffic-scene"
      viewBox="0 0 1000 560"
      role="img"
      aria-label="Illustration of traffic with object detection boxes around vehicles"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dcebe5" />
          <stop offset="1" stopColor="#a8c6b8" />
        </linearGradient>
        <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#525b5a" />
          <stop offset="1" stopColor="#303a3a" />
        </linearGradient>
        <pattern id="windows" width="34" height="37" patternUnits="userSpaceOnUse">
          <rect x="6" y="7" width="16" height="20" rx="2" fill="#d3d8c8" opacity=".58" />
        </pattern>
      </defs>
      <rect width="1000" height="560" fill="url(#sky)" />
      <circle cx="806" cy="95" r="53" fill="#f3e7bd" opacity=".72" />
      <path d="M0 245h1000v315H0z" fill="#bac5b5" />
      <path d="M0 150h145v170H0z" fill="#81978c" />
      <path d="M10 166h126v144H10z" fill="url(#windows)" />
      <path d="M117 102h178v218H117z" fill="#a2ad9e" />
      <path d="M129 117h154v190H129z" fill="url(#windows)" />
      <path d="M712 125h131v195H712z" fill="#8c9c8e" />
      <path d="M723 139h109v169H723z" fill="url(#windows)" />
      <path d="M839 75h161v245H839z" fill="#a6b0a1" />
      <path d="M851 90h137v218H851z" fill="url(#windows)" />
      <path d="M0 285h1000v275H0z" fill="url(#road)" />
      <path d="M0 276h1000v13H0z" fill="#d4d1b3" opacity=".8" />
      <path d="M0 355h1000M0 454h1000" stroke="#66706c" strokeWidth="2" opacity=".65" />
      <path d="M485 301h24v44h-24zm0 91h24v45h-24zm0 94h24v55h-24z" fill="#e7dfbd" opacity=".83" />
      <path d="M38 365h156v58H38z" fill="#557d73" />
      <path d="M53 349h90v16H53z" fill="#435b55" />
      <rect x="60" y="377" width="44" height="29" rx="5" fill="#c6d3c8" />
      <rect x="111" y="377" width="44" height="29" rx="5" fill="#c6d3c8" />
      <circle cx="76" cy="425" r="11" fill="#26302f" />
      <circle cx="159" cy="425" r="11" fill="#26302f" />
      <path d="M667 386h204v68H667z" fill="#d6b46d" />
      <path d="M699 365h109v21H699z" fill="#bf9d5a" />
      <rect x="689" y="398" width="47" height="37" rx="4" fill="#d9e3da" />
      <rect x="745" y="398" width="47" height="37" rx="4" fill="#d9e3da" />
      <rect x="801" y="398" width="47" height="37" rx="4" fill="#d9e3da" />
      <circle cx="712" cy="457" r="13" fill="#26302f" />
      <circle cx="828" cy="457" r="13" fill="#26302f" />
      <path d="M316 470h142v49H316z" fill="#5b7f91" />
      <path d="M342 453h81v17h-81z" fill="#4a6876" />
      <rect x="332" y="480" width="42" height="27" rx="4" fill="#cadbd9" />
      <rect x="381" y="480" width="42" height="27" rx="4" fill="#cadbd9" />
      <circle cx="343" cy="520" r="10" fill="#26302f" />
      <circle cx="432" cy="520" r="10" fill="#26302f" />
      <g fill="none" strokeWidth="2.5">
        <rect x="31" y="340" width="170" height="100" rx="5" stroke="#baf4d1" />
        <rect x="659" y="356" width="218" height="117" rx="5" stroke="#b8d9ff" />
        <rect x="308" y="444" width="157" height="91" rx="5" stroke="#baf4d1" />
      </g>
      <g fontFamily="Arial, sans-serif" fontSize="13" fontWeight="600">
        <rect x="31" y="320" width="105" height="20" rx="4" fill="#baf4d1" />
        <text x="40" y="334" fill="#20362e">car · 98%</text>
        <rect x="659" y="336" width="105" height="20" rx="4" fill="#b8d9ff" />
        <text x="668" y="350" fill="#203149">bus · 96%</text>
        <rect x="308" y="424" width="105" height="20" rx="4" fill="#baf4d1" />
        <text x="317" y="438" fill="#20362e">car · 93%</text>
      </g>
    </svg>
  )
}

export default function App() {
  const [online, setOnline] = useState(false)
  const [videoAvailable, setVideoAvailable] = useState(false)
  const [videoLabel, setVideoLabel] = useState('Pixabay sample clip (online)')
  const [source, setSource] = useState('video')
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
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
          setVideoLabel(info.video_source === 'local' ? 'Local traffic video' : 'Pixabay sample clip (online)')
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
          setFinished(true)
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
    setFinished(false)
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

  async function handleStreamError() {
    try {
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Could not check detection status')
      const latest = await response.json()
      setStats(latest)
      setRunning(false)
      if (latest.status === 'finished' || latest.status === 'stopped') {
        setFinished(latest.status === 'finished')
        return
      }
      if (latest.status === 'error') {
        setError(latest.error || 'The detector reported an error.')
        return
      }
      setError(latest.active
        ? 'A detection stream is already running. Stop it before replaying.'
        : 'The detection stream could not start. Check the backend terminal for details.')
    } catch {
      setRunning(false)
      setError('The detection stream ended unexpectedly. Check the backend terminal.')
    }
  }

  const statusText = !online ? 'BACKEND OFFLINE' : running ? 'DETECTING' : finished ? 'FINISHED' : 'READY'
  const statusColor = !online ? 'offline' : running ? 'live' : 'ready'
  const detected = stats.detections || []
  const counts = stats.counts || EMPTY_STATS.counts
  const streamUrl = `/api/stream?source=${source}&key=${streamKey}`
  const frameUrl = `/api/last-frame?key=${stats.frame}`

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Traffic Vision home">
          <span className="brand-icon">TV</span>
          <span>Traffic Vision</span>
        </a>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">REAL-TIME TRAFFIC MONITORING</p>
          <h1>Traffic camera object detection</h1>
          <p className="intro-copy">Live vehicle detection powered by OpenCV, FastAPI and YOLO26n.</p>
        </div>
        <span className={`status ${statusColor}`}>{!finished && <span className="status-dot" />}{statusText}</span>
      </section>

      <section className="content-grid">
        <article className="card preview-card">
          <div className="card-heading">
            <div>
              <h2>Detection preview</h2>
              <p>{running ? `Live ${source === 'video' ? 'traffic video' : 'webcam'} detection` : 'Start detection to see the annotated camera feed'}</p>
            </div>
            <span className={`preview-tag ${running ? 'preview-tag-live' : ''}`}>{running ? 'LIVE' : finished ? 'LAST FRAME' : 'IDLE'}</span>
          </div>
          <div className="preview-frame">
            {running ? (
              <img
                key={streamKey}
                className="live-stream"
                src={streamUrl}
                alt="Live traffic detection stream with annotated vehicles"
                onError={handleStreamError}
              />
            ) : finished ? (
              <img className="live-stream" src={frameUrl} alt="Last annotated traffic detection frame" />
            ) : (
              <TrafficPreview />
            )}
          </div>
          <div className="stream-controls">
            <label htmlFor="source">Input source</label>
            <select id="source" value={source} onChange={event => setSource(event.target.value)} disabled={running}>
              <option value="video">{videoLabel}</option>
              <option value="webcam">Computer webcam</option>
            </select>
            {running ? (
              <button className="stop-button" type="button" onClick={stopDetection}>Stop detection</button>
            ) : (
              <button className="start-button" type="button" onClick={startDetection} disabled={!online || (source === 'video' && !videoAvailable)}>
                Start detection
              </button>
            )}
          </div>
          {!online && <p className="preview-note">Start the FastAPI backend to enable live detection.</p>}
          {online && source === 'video' && videoAvailable && <p className="preview-note">Using {videoLabel.toLowerCase()}. A local backend/videos/traffic.mp4 takes priority.</p>}
          {online && source === 'video' && !videoAvailable && <p className="preview-note">Traffic video is not configured; select Computer webcam.</p>}
          {error && <p className="stream-error" role="alert">{error}</p>}
        </article>

        <aside className="card details-card">
          <div className="card-heading">
            <div>
              <h2>Detection summary</h2>
              <p>Vehicles detected in the current frame</p>
            </div>
          </div>
          <div className="summary-count"><strong>{stats.count}</strong><span>vehicles in frame</span></div>
          <div className="vehicle-counts" aria-label="Vehicle counts">
            <span>Cars <strong>{counts.car}</strong></span>
            <span>Trucks <strong>{counts.truck}</strong></span>
            <span>Buses <strong>{counts.bus}</strong></span>
            <span>Motorcycles <strong>{counts.motorcycle}</strong></span>
          </div>
          <div className="detection-list">
            {detected.map((detection, index) => (
              <div className="detection-row" key={`${detection.label}-${index}`}>
                <span className="object-icon blue">▰</span>
                <span className="object-name">{detection.label}<small>Object {String(index + 1).padStart(2, '0')}</small></span>
                <strong className="confidence">{detection.confidence}%</strong>
              </div>
            ))}
          </div>
          {running && <p className="frame-counter">Processed frame {stats.frame}</p>}
          <div className="model-card">
            <div className="model-heading"><span className="model-mark">YOLO</span><strong>YOLO26n</strong></div>
            <dl>
              <div><dt>Input</dt><dd>{source === 'video' ? 'Traffic video' : 'Computer webcam'}</dd></div>
              <div><dt>Confidence threshold</dt><dd>25%</dd></div>
              <div><dt>Output</dt><dd>Browser stream</dd></div>
            </dl>
          </div>
        </aside>
      </section>

      <footer>Traffic Vision <span>·</span> Live local detection powered by FastAPI and YOLO26n</footer>
    </main>
  )
}
