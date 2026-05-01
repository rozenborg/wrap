import { useState } from "react";
import Konva from "konva";
import { useWrapStore } from "../store/wrapStore";
import { canvasToTeslaPng, downloadBlob, validateName } from "../lib/exportPng";

interface ExportBarProps {
  getStage: () => Konva.Stage | null;
}

export default function ExportBar({ getStage }: ExportBarProps) {
  const wrapName = useWrapStore((s) => s.wrapName);
  const setWrapName = useWrapStore((s) => s.setWrapName);
  const canvasSize = useWrapStore((s) => s.canvasSize);
  const setCanvasSize = useWrapStore((s) => s.setCanvasSize);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameError = validateName(wrapName);

  async function handleExport() {
    setBusy(true);
    setInfo(null);
    setError(null);
    try {
      const stage = getStage();
      if (!stage) throw new Error("designer not ready");

      const tr = stage.findOne<Konva.Transformer>("Transformer");
      const wasVisible = tr?.visible() ?? false;
      if (tr) tr.visible(false);

      const fullCanvas = stage.toCanvas({
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height(),
        pixelRatio: canvasSize / stage.width(),
      });

      if (tr) tr.visible(wasVisible);

      const { blob, size } = await canvasToTeslaPng(fullCanvas);
      const filename = `${wrapName}.png`;
      downloadBlob(blob, filename);
      setInfo(`Saved ${filename} (${(size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-t border-line bg-panel px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <label className="text-white/60">Name</label>
        <input
          value={wrapName}
          onChange={(e) => setWrapName(e.target.value)}
          maxLength={30}
          className={`w-44 rounded border bg-ink px-2 py-1 focus:outline-none ${
            nameError ? "border-red-500" : "border-line focus:border-accent"
          }`}
        />
        {nameError && <span className="text-red-300">{nameError}</span>}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-white/60">Size</label>
        <select
          value={canvasSize}
          onChange={(e) => setCanvasSize(Number(e.target.value) as 512 | 1024)}
          className="rounded border border-line bg-ink px-1.5 py-1"
        >
          <option value={512}>512×512</option>
          <option value={1024}>1024×1024</option>
        </select>
      </div>

      <div className="flex-1" />

      {info && <span className="text-emerald-300">{info}</span>}
      {error && <span className="text-red-300">{error}</span>}

      <button
        disabled={busy || !!nameError}
        onClick={handleExport}
        className="rounded bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {busy ? "Exporting…" : "Export PNG for USB"}
      </button>
    </div>
  );
}
