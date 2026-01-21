import React, { useRef, useState } from "react";
import { buildExportBundle, clearLocalStorage, downloadJson, loadFromLocalStorage, readJsonFile, saveToLocalStorage } from "./storage/bridge-storage";

type Props = {
  appName: string;
  build: string;
  getData: () => any;
  setData: (data: any) => void;
};

export function PortabilityPanel(props: Props) {
  const { appName, build, getData, setData } = props;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("");

  function doExportDownload() {
    const bundle = buildExportBundle(appName, build, getData());
    downloadJson("bridge-os-export.json", bundle);
    setStatus("Exported JSON download.");
  }

  function doSaveLocal() {
    const bundle = buildExportBundle(appName, build, getData());
    saveToLocalStorage(bundle);
    setStatus("Saved to localStorage.");
  }

  function doLoadLocal() {
    const bundle = loadFromLocalStorage();
    if (!bundle) {
      setStatus("No localStorage bundle found.");
      return;
    }
    setData(bundle.data);
    setStatus(`Loaded from localStorage (${bundle.exportedAt}).`);
  }

  function doClearLocal() {
    clearLocalStorage();
    setStatus("Cleared localStorage bundle.");
  }

  async function doImportFile(file: File) {
    try {
      const parsed = await readJsonFile(file);
      if (parsed?.version !== "BRIDGE_OS_EXPORT_V1" || !parsed?.data) {
        setStatus("Invalid import file.");
        return;
      }
      setData(parsed.data);
      setStatus(`Imported from file (${parsed.exportedAt}).`);
    } catch {
      setStatus("Failed to import JSON file.");
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <div style={{ fontWeight: 700 }}>Portability</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
        Export/Import session+artifacts. Save/Load localStorage.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={doExportDownload}>Export JSON</button>
        <button onClick={() => fileRef.current?.click()}>Import JSON</button>
        <button onClick={doSaveLocal}>Save Local</button>
        <button onClick={doLoadLocal}>Load Local</button>
        <button onClick={doClearLocal}>Clear Local</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await doImportFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>
      {status && <div style={{ marginTop: 10, fontSize: 12 }}>Status: {status}</div>}
    </div>
  );
}
