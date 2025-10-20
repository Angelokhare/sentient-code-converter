import React from "react";
import type { ConvertedFile } from "../types";

export default function ConvertedTree({ files }: { files: ConvertedFile[] }) {
  if (!files.length) return <div style={{ color: "rgba(255,255,255,0.6)" }}>No converted files yet</div>;
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <strong>Converted files</strong>
      <div className="file-list">
        {files.map((f, idx) => (
          <div key={idx} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 13, color: "var(--accent)" }}>{f.path}</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
              {f.content.slice(0, 400)}
              {f.content.length > 400 ? "..." : ""}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}