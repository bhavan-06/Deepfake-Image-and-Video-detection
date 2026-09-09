// ── CONFIG ────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000"; // Change if deployed

// ── STATE ─────────────────────────────────────────────────────
let currentMode   = "image";
let selectedFile  = null;
let progressTimer = null;

// ── VIDEO PROGRESS STEPS ──────────────────────────────────────
const videoSteps = [
  { pct: 8,  label: "Uploading video…"       },
  { pct: 22, label: "Extracting frames…"     },
  { pct: 42, label: "Detecting faces…"       },
  { pct: 60, label: "Running model on faces…"},
  { pct: 78, label: "Scoring & filtering…"   },
  { pct: 93, label: "Compiling results…"     },
];

// ── PROGRESS HELPERS ──────────────────────────────────────────
function startVideoProgress() {
  const fill = document.getElementById("progress-fill");
  const step = document.getElementById("progress-step");
  const pct  = document.getElementById("progress-pct");

  fill.classList.remove("indeterminate");
  fill.style.width = "0%";
  let si = 0;

  function advance() {
    if (si >= videoSteps.length) return;
    const s = videoSteps[si++];
    fill.style.width = s.pct + "%";
    step.textContent = s.label;
    pct.textContent  = s.pct + "%";
    progressTimer = setTimeout(advance, 2600);
  }
  advance();
}

function startImageProgress() {
  const fill = document.getElementById("progress-fill");
  fill.style.transition = "none";
  fill.style.width = "0%";
  setTimeout(() => {
    fill.style.transition = "";
    fill.classList.add("indeterminate");
  }, 20);
  document.getElementById("progress-step").textContent = "Analysing image…";
  document.getElementById("progress-pct").textContent  = "";
}

function finishProgress() {
  clearTimeout(progressTimer);
  const fill = document.getElementById("progress-fill");
  fill.classList.remove("indeterminate");
  fill.style.width = "100%";
  document.getElementById("progress-step").textContent = "Done!";
  document.getElementById("progress-pct").textContent  = "100%";
}

// ── MODE SWITCH ───────────────────────────────────────────────
function switchMode(mode) {
  currentMode  = mode;
  selectedFile = null;

  document.getElementById("tab-image").classList.toggle("active", mode === "image");
  document.getElementById("tab-video").classList.toggle("active", mode === "video");

  const input  = document.getElementById("file-input");
  input.value  = "";
  input.accept = mode === "image" ? "image/*" : "video/*";

  document.getElementById("upload-hint").textContent =
    mode === "image" ? "JPG · PNG · JPEG accepted" : "MP4 · AVI · MOV accepted";

  resetUI();
}

// ── FILE EVENTS ───────────────────────────────────────────────
document.getElementById("file-input").addEventListener("change", e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

const dropZone = document.getElementById("drop-zone");

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) {
    document.getElementById("file-input").files = e.dataTransfer.files;
    handleFile(file);
  }
});

// ── HANDLE FILE ───────────────────────────────────────────────
function handleFile(file) {
  selectedFile = file;
  resetResult();

  const url = URL.createObjectURL(file);
  const img = document.getElementById("preview-img");
  const vid = document.getElementById("preview-vid");

  if (currentMode === "image") {
    img.src = url; img.style.display = "block";
    vid.style.display = "none";
  } else {
    vid.src = url; vid.style.display = "block";
    img.style.display = "none";
  }

  document.getElementById("preview-name").textContent = file.name;
  document.getElementById("preview-size").textContent = formatBytes(file.size);
  document.getElementById("preview-wrap").classList.add("show");
  document.getElementById("analyze-btn").classList.add("show");
}

// ── RUN ANALYSIS ──────────────────────────────────────────────
async function runAnalysis() {
  if (!selectedFile) return;

  const btn = document.getElementById("analyze-btn");
  btn.disabled = true;

  hideEl("result-card");
  hideEl("frames-section");
  hideEl("error-msg");

  // Reset progress bar
  const fill = document.getElementById("progress-fill");
  fill.classList.remove("indeterminate");
  fill.style.width = "0%";
  document.getElementById("progress-step").textContent = "";
  document.getElementById("progress-pct").textContent  = "";

  showEl("loading");
  document.getElementById("loading-text").textContent =
    currentMode === "video" ? "Analysing video…" : "Analysing image…";

  if (currentMode === "video") startVideoProgress();
  else startImageProgress();

  try {
    const fd = new FormData();
    fd.append("file", selectedFile);

    const endpoint = currentMode === "image"
      ? `${API_BASE}/predict/image`
      : `${API_BASE}/predict/video`;

    const res  = await fetch(endpoint, { method: "POST", body: fd });
    const data = await res.json();

    finishProgress();
    await delay(350);
    hideEl("loading");

    data.error ? showError(data.error) : showResult(data);

  } catch (err) {
    clearTimeout(progressTimer);
    hideEl("loading");
    showError("Could not connect to backend. Make sure FastAPI is running on " + API_BASE);
  }

  btn.disabled = false;
}

// ── SHOW RESULT ───────────────────────────────────────────────
function showResult(data) {
  const isFake = data.label === "FAKE";

  document.getElementById("result-header").className   = "result-header " + (isFake ? "fake" : "real");
  document.getElementById("verdict-badge").textContent  = data.label;
  document.getElementById("verdict-badge").className    = "verdict-badge "  + (isFake ? "fake" : "real");
  document.getElementById("verdict-label").textContent  =
    isFake ? "This content appears to be manipulated." : "This content appears to be authentic.";

  document.getElementById("stat-fake").textContent = pct(data.fake);
  document.getElementById("stat-real").textContent = pct(data.real);
  document.getElementById("stat-conf").textContent = pct(data.confidence);

  const gf = document.getElementById("gauge-fill");
  gf.className   = "gauge-fill " + (isFake ? "fake" : "real");
  gf.style.width = "0%";
  setTimeout(() => { gf.style.width = (data.fake * 100).toFixed(1) + "%"; }, 80);

  showEl("result-card");

  // Render video face frames
  if (data.frames && data.frames.length > 0) {
    const grid = document.getElementById("frames-grid");
    grid.innerHTML = "";
    data.frames.forEach(b64 => {
      const img = document.createElement("img");
      img.src = "data:image/jpeg;base64," + b64;
      img.alt = "Face frame";
      grid.appendChild(img);
    });
    showEl("frames-section");
  }
}

// ── HELPERS ───────────────────────────────────────────────────
const showEl = id => document.getElementById(id).classList.add("show");
const hideEl = id => document.getElementById(id).classList.remove("show");
const delay  = ms => new Promise(r => setTimeout(r, ms));
const pct    = v  => (v * 100).toFixed(1) + "%";

function showError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = "⚠ " + msg;
  el.classList.add("show");
}

function resetResult() {
  hideEl("result-card");
  hideEl("frames-section");
  hideEl("error-msg");
  hideEl("loading");
  clearTimeout(progressTimer);
}

function resetUI() {
  resetResult();
  hideEl("preview-wrap");
  hideEl("analyze-btn");
  document.getElementById("preview-img").style.display = "none";
  document.getElementById("preview-vid").style.display = "none";
}

function formatBytes(b) {
  if (b < 1024)    return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}
