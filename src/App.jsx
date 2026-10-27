import { useState } from 'react'

const detections = [
  { label: 'Car', confidence: '98%', color: 'green' },
  { label: 'Bus', confidence: '96%', color: 'blue' },
  { label: 'Car', confidence: '93%', color: 'green' },
  { label: 'Truck', confidence: '89%', color: 'amber' },
]

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
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText('python backend/object_detection.py')
      setCopied(true)
      setCopyError(false)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Could not copy backend command:', error)
      setCopyError(true)
    }
  }

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
          <p className="intro-copy">A visual preview of the YOLO26n webcam detector.</p>
        </div>
        <span className="status">YOLO26n / local script</span>
      </section>

      <section className="content-grid">
        <article className="card preview-card">
          <div className="card-heading">
            <div>
              <h2>Detection preview</h2>
              <p>Example bounding boxes for detected road users</p>
            </div>
            <span className="preview-tag">ILLUSTRATION</span>
          </div>
          <div className="preview-frame">
            <TrafficPreview />
          </div>
          <div className="legend">
            <span><i className="green" /> Car</span>
            <span><i className="blue" /> Bus</span>
            <span><i className="amber" /> Truck</span>
          </div>
          <p className="preview-note">Illustrative preview only.</p>
        </article>

        <aside className="card details-card">
          <div className="card-heading">
            <div>
              <h2>Detection summary</h2>
              <p>Sample objects and confidence</p>
            </div>
          </div>
          <div className="summary-count"><strong>04</strong><span>sample detections</span></div>
          <div className="detection-list">
            {detections.map((detection, index) => (
              <div className="detection-row" key={`${detection.label}-${index}`}>
                <span className={`object-icon ${detection.color}`}>▰</span>
                <span className="object-name">{detection.label}<small>Object {String(index + 1).padStart(2, '0')}</small></span>
                <strong className="confidence">{detection.confidence}</strong>
              </div>
            ))}
          </div>
          <div className="model-card">
            <div className="model-heading"><span className="model-mark">YOLO</span><strong>YOLO26n</strong></div>
            <dl>
              <div><dt>Input</dt><dd>Computer webcam</dd></div>
              <div><dt>Confidence threshold</dt><dd>40%</dd></div>
              <div><dt>Output</dt><dd>OpenCV display</dd></div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="setup">
        <div>
          <h2>Run the detector</h2>
          <p>Start the existing Python backend in a terminal from the project folder.</p>
        </div>
        <div className="command-row">
          <code>python backend/object_detection.py</code>
          <button type="button" onClick={copyCommand}>{copied ? 'Copied' : 'Copy command'}</button>
        </div>
        {copyError && <p className="copy-error" role="status">Copy failed. Select and copy the command above.</p>}
      </section>

      <footer>Traffic Vision <span>·</span> Frontend preview for the local YOLO webcam script</footer>
    </main>
  )
}
