export type ExportBundle = {
  version: "BRIDGE_OS_EXPORT_V1";
  exportedAt: string;
  app: {
    name: string;
    build: string;
  };
  data: any;
};

const STORAGE_KEY = "BRIDGE_OS_SESSION_BUNDLE_V1";

export function saveToLocalStorage(bundle: ExportBundle): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
}

export function loadFromLocalStorage(): ExportBundle | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExportBundle;
  } catch {
    return null;
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildExportBundle(appName: string, build: string, data: any): ExportBundle {
  return {
    version: "BRIDGE_OS_EXPORT_V1",
    exportedAt: new Date().toISOString(),
    app: { name: appName, build },
    data
  };
}

export function downloadJson(filename: string, obj: any): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}
