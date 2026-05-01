import { useEffect, useRef, useState } from "react";
import { fetchImageFromUrl, getHealth, searchImages, type SearchResult } from "../lib/api";
import { fileToDataUrl, loadImage } from "../lib/fileToDataUrl";
import { uid, useWrapStore, type ImageLayer } from "../store/wrapStore";

export default function ReferencesPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [braveAvailable, setBraveAvailable] = useState<boolean | null>(null);

  const refs = useWrapStore((s) => s.references);
  const addReference = useWrapStore((s) => s.addReference);
  const removeReference = useWrapStore((s) => s.removeReference);
  const addLayer = useWrapStore((s) => s.addLayer);
  const canvasSize = useWrapStore((s) => s.canvasSize);

  useEffect(() => {
    getHealth().then((h) => setBraveAvailable(h.providers.brave)).catch(() => {});
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      addReference({ id: uid(), src: dataUrl, label: file.name });
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await searchImages(query.trim());
      setResults(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function addFromUrl(url: string, label?: string) {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fetchImageFromUrl(url);
      addReference({ id: uid(), src: dataUrl, label, sourceUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function dropToCanvas(src: string, name: string) {
    const img = await loadImage(src);
    const max = canvasSize * 0.6;
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
      src,
    };
    addLayer(layer);
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-xs">
      <div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className="w-full rounded border border-line bg-ink py-1.5 hover:bg-line"
        >
          Upload reference images
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-white/50">From URL</div>
        <div className="flex gap-1">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…/image.jpg"
            className="flex-1 rounded border border-line bg-ink px-2 py-1 focus:border-accent focus:outline-none"
          />
          <button
            disabled={busy || !urlInput.trim()}
            onClick={() => {
              addFromUrl(urlInput.trim());
              setUrlInput("");
            }}
            className="rounded bg-accent px-2 hover:bg-accent/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-white/50">Web search</span>
          {braveAvailable === false && (
            <span className="text-[10px] text-yellow-300/80">no Brave key</span>
          )}
        </div>
        <div className="flex gap-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="search images…"
            disabled={braveAvailable === false}
            className="flex-1 rounded border border-line bg-ink px-2 py-1 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            disabled={busy || braveAvailable === false}
            onClick={handleSearch}
            className="rounded bg-accent px-2 hover:bg-accent/90 disabled:opacity-50"
          >
            Go
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {results.slice(0, 18).map((r, i) => (
              <button
                key={i}
                onClick={() => addFromUrl(r.url, r.title)}
                title={r.title}
                className="aspect-square overflow-hidden rounded border border-line hover:border-accent"
              >
                {r.thumbnail && (
                  <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="rounded bg-red-900/40 px-2 py-1 text-red-200">{error}</div>}

      <div className="space-y-1 border-t border-line pt-2">
        <div className="text-[11px] uppercase tracking-wide text-white/50">
          Saved references ({refs.length})
        </div>
        {refs.length === 0 && (
          <div className="text-white/40">
            No references yet. Drop images here or generate them in the AI panel.
          </div>
        )}
        <div className="grid grid-cols-2 gap-1">
          {refs.map((r) => {
            if (!r.src) {
              return (
                <a
                  key={r.id}
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex aspect-square flex-col justify-between rounded border border-line bg-ink/60 p-2 hover:border-accent"
                  title={r.sourceUrl}
                >
                  <span className="line-clamp-3 text-[10px] leading-tight text-white/80">
                    {r.label ?? r.sourceUrl}
                  </span>
                  <span className="text-[10px] text-accent">↗ source</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeReference(r.id);
                    }}
                    className="absolute right-1 top-1 rounded bg-white/10 px-1 text-[10px] text-white opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </a>
              );
            }
            return (
              <div key={r.id} className="group relative aspect-square overflow-hidden rounded border border-line">
                <img src={r.src} alt={r.label ?? ""} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/70 p-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => dropToCanvas(r.src, r.label ?? "Reference")}
                    className="rounded bg-accent px-1 text-[10px] text-white"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => removeReference(r.id)}
                    className="rounded bg-white/10 px-1 text-[10px] text-white"
                  >
                    ✕
                  </button>
                </div>
                {r.sourceUrl && (
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white/80"
                  >
                    ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
