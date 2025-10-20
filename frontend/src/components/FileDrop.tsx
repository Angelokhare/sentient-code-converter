import React, { useRef } from "react";
import type { UploadedFile } from "../types";

type Props = {
  onFiles: (files: UploadedFile[]) => void;
};

export default function FileDrop({ onFiles }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileList(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    Promise.all(
      arr.map(async (f) => {
        const content = await f.text();
        // Build a path: if directory upload, browsers set webkitRelativePath
        const path = (f as any).webkitRelativePath || f.name;
        return { path, content, name: f.name } as UploadedFile;
      })
    ).then(onFiles);
  }

  return (
    <div>
      <div
        className="file-drop panel"
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer?.files ?? null;
          handleFileList(files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Drop files or a folder</strong>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              (or click to open file picker — hold a folder in the picker to include subfolders)
            </div>
          </div>
          <div>
            <button
              className="btn small"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files / folder
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          style={{ display: "none" }}
          type="file"
          multiple
          // allow folder picking in Chromium
          //@ts-ignore
          webkitdirectory="true"
          onChange={(e) => handleFileList(e.target.files)}
        />
      </div>
    </div>
  );
}