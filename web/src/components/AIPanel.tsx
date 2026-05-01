import { useEffect, useState } from "react";
import {
  generateImage,
  getHealth,
  researchImage,
  type ResearchProvider,
  type ResearchSource,
} from "../lib/api";
import { uid, useWrapStore, type ImageLayer, type Provider } from "../store/wrapStore";
import { loadImage } from "../lib/fileToDataUrl";

interface ProvidersHealth {
  openai: boolean;
  anthropic: boolean;
  replicate: boolean;
  brave: boolean;
}

export default function AIPanel() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProvidersHealth | null>(null);

  const [researchMode, setResearchMode] = useState(true);
  const [researchProvider, setResearchProvider] = useState<ResearchProvider>("openai");
  const [lastResearch, setLastResearch] = useState<{
    summary: string;
    imagePrompt: string;
    sources: ResearchSource[];
  } | null>(null);

  const provider = useWrapStore((s) => s.provider);
  const setProvider = useWrapStore((s) => s.setProvider);
  const addLayer = useWrapStore((s) => s.addLayer);
  const addReference = useWrapStore((s) => s.addReference);
  const canvasSize = useWrapStore((s) => s.canvasSize);

  useEffect(() => {
    getHealth().then((h) => setProviders(h.providers)).catch(() => setProviders(null));
  }, []);

  async function dropImageAsLayer(dataUrl: string, name: string) {
    const img = await loadImage(dataUrl);
    const max = canvasSize * 0.7;
    const ratio = Math.min(max / img.width, max / img.height, 1);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const layer: ImageLayer = {
      id: uid(),
      kind: "image",
      name,
      visible: true,
      locked: false,
      x: (canvasSize - w) / 2,
      y: (canvasSize - h) / 2,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      src: dataUrl,
    };
    addLayer(layer);
  }

  async function handleGenerate(target: "layer" | "reference") {
    if (!prompt.trim()) return;
    setBusy(true);
    setError(null);
    try {
      if (researchMode) {
        const result = await researchImage(prompt.trim(), researchProvider, provider);
        setLastResearch(result.research);
        for (const s of result.research.sources) {
          addReference({
            id: uid(),
            src: "",
            label: s.title,
            sourceUrl: s.url,
          });
        }
        const name = prompt.slice(0, 24) || "Researched image";
        if (target === "reference") {
          addReference({ id: uid(), src: result.image.dataUrl, label: name });
        } else {
          await dropImageAsLayer(result.image.dataUrl, name);
        }
      } else {
        const result = await generateImage(prompt.trim(), provider);
        const name = prompt.slice(0, 24) || "AI image";
        if (target === "reference") {
          addReference({ id: uid(), src: result.dataUrl, label: name });
        } else {
          await dropImageAsLayer(result.dataUrl, name);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 p-3 text-xs">
      <div className="space-y-2 rounded border border-line bg-ink/40 p-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={researchMode}
            onChange={(e) => setResearchMode(e.target.checked)}
          />
          <span className="font-medium text-white/90">Research mode</span>
        </label>
        <p className="text-[11px] leading-relaxed text-white/50">
          Describe a subject in plain English (e.g. "make a wrap based on a Japanese police
          car"). The model will search the web for visual references, write an image prompt,
          and generate the wrap. Sources are added to your References panel.
        </p>
        {researchMode && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] uppercase tracking-wide text-white/50">
              Research with
            </span>
            <select
              value={researchProvider}
              onChange={(e) => setResearchProvider(e.target.value as ResearchProvider)}
              className="rounded border border-line bg-ink px-1.5 py-0.5"
            >
              <option value="openai" disabled={providers?.openai === false}>
                OpenAI gpt-4.1 {providers?.openai === false && "(no key)"}
              </option>
              <option value="anthropic" disabled={providers?.anthropic === false}>
                Claude {providers?.anthropic === false && "(no key)"}
              </option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-white/50">Image model</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="rounded border border-line bg-ink px-1.5 py-0.5"
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
        placeholder={
          researchMode
            ? 'e.g. "look up what a Japanese police car looks like and make it into a wrap"'
            : "e.g. seamless cyberpunk neon circuitry, dark background, high contrast"
        }
        className="min-h-[90px] w-full rounded border border-line bg-ink p-2 focus:border-accent focus:outline-none"
      />

      {error && <div className="rounded bg-red-900/40 px-2 py-1 text-red-200">{error}</div>}

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => handleGenerate("layer")}
          className="flex-1 rounded bg-accent px-2 py-1.5 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {busy
            ? researchMode
              ? "Researching…"
              : "Generating…"
            : researchMode
              ? "Research + add as layer"
              : "Add as layer"}
        </button>
        <button
          disabled={busy}
          onClick={() => handleGenerate("reference")}
          className="rounded border border-line bg-ink px-2 py-1.5 hover:bg-line disabled:opacity-50"
          title="Save the generated image to references instead of the canvas"
        >
          As reference
        </button>
      </div>

      {lastResearch && (
        <div className="space-y-2 rounded border border-line bg-ink/40 p-2">
          <div className="text-[11px] uppercase tracking-wide text-white/50">
            What I found
          </div>
          <p className="text-white/80 leading-relaxed">{lastResearch.summary}</p>
          <details>
            <summary className="cursor-pointer text-[11px] text-white/50 hover:text-white">
              Image prompt used
            </summary>
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
              {lastResearch.imagePrompt}
            </p>
          </details>
          {lastResearch.sources.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">
                Sources ({lastResearch.sources.length})
              </div>
              <ul className="space-y-0.5">
                {lastResearch.sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-accent hover:underline"
                      title={s.url}
                    >
                      ↗ {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-white/40">
        Tip: ask for tileable / seamless designs. The wrap is mapped onto the car body, so
        edge-to-edge motifs read best.
      </p>
    </div>
  );
}
