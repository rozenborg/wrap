import { useEffect, useState } from "react";
import { generateImage, getHealth } from "../lib/api";
import { uid, useWrapStore, type ImageLayer, type Provider } from "../store/wrapStore";
import { loadImage } from "../lib/fileToDataUrl";

export default function AIPanel() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{ openai: boolean; replicate: boolean } | null>(null);

  const provider = useWrapStore((s) => s.provider);
  const setProvider = useWrapStore((s) => s.setProvider);
  const addLayer = useWrapStore((s) => s.addLayer);
  const addReference = useWrapStore((s) => s.addReference);
  const canvasSize = useWrapStore((s) => s.canvasSize);

  useEffect(() => {
    getHealth().then((h) => setProviders(h.providers)).catch(() => setProviders(null));
  }, []);

  async function handleGenerate(target: "layer" | "reference") {
    if (!prompt.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateImage(prompt.trim(), provider);
      if (target === "reference") {
        addReference({ id: uid(), src: result.dataUrl, label: prompt.slice(0, 40) });
      } else {
        const img = await loadImage(result.dataUrl);
        const max = canvasSize * 0.7;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const layer: ImageLayer = {
          id: uid(),
          kind: "image",
          name: prompt.slice(0, 24) || "AI image",
          visible: true,
          locked: false,
          x: (canvasSize - w) / 2,
          y: (canvasSize - h) / 2,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          src: result.dataUrl,
        };
        addLayer(layer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-white/50">Provider</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="rounded border border-line bg-ink px-1.5 py-0.5 text-xs"
        >
          <option value="openai" disabled={providers?.openai === false}>
            OpenAI gpt-image-2 {providers?.openai === false && "(no key)"}
          </option>
          <option value="replicate" disabled={providers?.replicate === false}>
            Replicate Flux {providers?.replicate === false && "(no key)"}
          </option>
        </select>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. seamless cyberpunk neon circuitry, dark background, high contrast"
        className="min-h-[80px] w-full rounded border border-line bg-ink p-2 text-xs focus:border-accent focus:outline-none"
      />

      {error && <div className="rounded bg-red-900/40 px-2 py-1 text-red-200">{error}</div>}

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => handleGenerate("layer")}
          className="flex-1 rounded bg-accent px-2 py-1.5 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Add as layer"}
        </button>
        <button
          disabled={busy}
          onClick={() => handleGenerate("reference")}
          className="rounded border border-line bg-ink px-2 py-1.5 hover:bg-line disabled:opacity-50"
        >
          As reference
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-white/40">
        Tip: ask for tileable / seamless patterns. The wrap is mapped onto the car body, so
        edge-to-edge designs read best.
      </p>
    </div>
  );
}
