import { useWrapStore } from "../store/wrapStore";

export default function LayersPanel() {
  const layers = useWrapStore((s) => s.layers);
  const selectedId = useWrapStore((s) => s.selectedId);
  const selectLayer = useWrapStore((s) => s.selectLayer);
  const removeLayer = useWrapStore((s) => s.removeLayer);
  const updateLayer = useWrapStore((s) => s.updateLayer);
  const reorderLayer = useWrapStore((s) => s.reorderLayer);

  if (layers.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-white/40">
        No layers yet. Add an image, generate one with AI, or paste from a URL.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {[...layers].reverse().map((layer) => {
        const selected = selectedId === layer.id;
        return (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`group flex items-center gap-2 border-b border-line/60 px-3 py-2 text-xs cursor-pointer ${
              selected ? "bg-accent/10" : "hover:bg-white/5"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { visible: !layer.visible });
              }}
              className="w-5 text-white/60 hover:text-white"
              title={layer.visible ? "Hide" : "Show"}
            >
              {layer.visible ? "●" : "○"}
            </button>
            <span className="flex-1 truncate">{layer.name}</span>
            <span className="text-white/30 uppercase tracking-wide text-[10px]">
              {layer.kind}
            </span>
            <div className="hidden group-hover:flex items-center gap-1 ml-1">
              <IconBtn label="↑" onClick={() => reorderLayer(layer.id, 1)} />
              <IconBtn label="↓" onClick={() => reorderLayer(layer.id, -1)} />
              <IconBtn label="✕" onClick={() => removeLayer(layer.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded px-1.5 text-white/60 hover:text-white hover:bg-white/10"
    >
      {label}
    </button>
  );
}
