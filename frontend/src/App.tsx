import React, { useState } from "react";
import FileDrop from "./components/FileDrop";
import ConvertedTree from "./components/ConvertedTree";
import type { UploadedFile, ConvertedFile } from "./types";
import JSZip from "jszip";

const languages = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C#",
  "C++",
  "Ruby",
  "PHP",
];

export default function App() {
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [pasted, setPasted] = useState("");
  const [targetLang, setTargetLang] = useState("Python");
  const [targetVersion, setTargetVersion] = useState("latest");
  const [converted, setConverted] = useState<ConvertedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  async function startConversion() {
    const filesToConvert = [...uploaded];
    if (pasted.trim()) {
      filesToConvert.push({ path: "pasted-snippet.txt", content: pasted, name: "pasted-snippet.txt" });
    }
    if (!filesToConvert.length) {
      alert("Please drop files/folder or paste code to convert.");
      return;
    }

    setBusy(true);
    setConverted([]);
    setProgressPct(0);

    // send array of files + language info
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesToConvert,
          targetLanguage: targetLang,
          targetVersion,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Conversion failed");
      }

      // stream handling is nicer but for simplicity assume JSON array
      const json: { files: ConvertedFile[] } = await res.json();
      setConverted(json.files || []);
    } catch (err: any) {
      console.error(err);
      alert("Conversion error: " + (err.message || err));
    } finally {
      setBusy(false);
      setProgressPct(100);
      setTimeout(() => setProgressPct(0), 800);
    }
  }

  async function downloadZip() {
    if (!converted.length) {
      alert("No converted files to download");
      return;
    }
    const zip = new JSZip();
    for (const f of converted) {
      zip.file(f.path, f.content);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polyglotforge-converted.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <div className="header">
        <div className="logo">PF</div>
        <div>
          <h2 style={{ margin: 0 }}>PolyglotForge</h2>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Convert a folder or files to another language using AI</div>
        </div>
      </div>

      <div className="controls">
        <div style={{ flex: 1 }} className="panel">
          <strong>Input</strong>
          <FileDrop onFiles={(f) => setUploaded((s) => [...s, ...f])} />
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 6 }}>Or paste code:</div>
            <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste single-file code here..."/>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Files queued:</strong>
            <div className="file-list">
              {uploaded.length === 0 ? <div style={{ color: "rgba(255,255,255,0.6)" }}>None</div>
              : uploaded.map((u, i) => <div key={i} style={{ padding: 6 }}>{u.path}</div>)}
            </div>
          </div>
        </div>

        <div style={{ width: 300 }} className="panel">
          <strong>Conversion</strong>
          <div style={{ marginTop: 8 }}>
            <label>Target language</label>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ width: "100%", marginTop: 6 }}>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>Version / flavor (optional)</label>
            <input value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} style={{ width: "100%", marginTop: 6 }}/>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              e.g. <code>Python 3.11</code>, <code>ES2022</code>, <code>go1.20</code>. Leave "latest" to let AI pick.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={startConversion} disabled={busy}>
              {busy ? "Converting..." : "Start Conversion"}
            </button>
            <button className="btn small" onClick={() => { setUploaded([]); setPasted(""); setConverted([]); }}>
              Clear
            </button>
          </div>

          <div className="progress" style={{ marginTop: 12 }}>
            <i style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <ConvertedTree files={converted} />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button className="btn" onClick={downloadZip} disabled={!converted.length}>Download ZIP</button>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Note: This demo sends file contents to a backend AI endpoint. Files are not uploaded anywhere else unless you run the backend.
      </div>
    </div>
  );
}