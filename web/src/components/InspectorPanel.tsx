import { useWrapStore } from "../store/wrapStore";

export default function InspectorPanel() {
  const selectedId = useWrapStore((s) => s.selectedId);
  const layer = useWrapStore((s) => s.layers.find((l) => l.id === selectedId));
  const updateLayer = useWrapStore((s) => s.updateLayer);

  if (!layer) {
    return (
      <div className="p-3 text-xs text-white/40">
        Select a layer to edit its properties.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 text-xs">
      <Field label="Name">
        <input
          className="input"
          value={layer.name}
          onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <input
            type="number"
            className="input"
            value={Math.round(layer.x)}
            onChange={(e) => updateLayer(layer.id, { x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            className="input"
            value={Math.round(layer.y)}
            onChange={(e) => updateLayer(layer.id, { y: Number(e.target.value) })}
          />
        </Field>
        <Field label="W">
          <input
            type="number"
            className="input"
            value={Math.round(layer.width)}
            onChange={(e) => updateLayer(layer.id, { width: Number(e.target.value) })}
          />
        </Field>
        <Field label="H">
          <input
            type="number"
            className="input"
            value={Math.round(layer.height)}
            onChange={(e) => updateLayer(layer.id, { height: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field label="Rotation">
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.rotation}
          onChange={(e) => updateLayer(layer.id, { rotation: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      <Field label={`Opacity ${Math.round(layer.opacity * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={layer.opacity}
          onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      {layer.kind === "text" && (
        <>
          <Field label="Text">
            <textarea
              className="input min-h-[60px]"
              value={layer.text}
              onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Color">
              <input
                type="color"
                value={layer.fill}
                onChange={(e) => updateLayer(layer.id, { fill: e.target.value })}
                className="h-7 w-full rounded border border-line bg-transparent"
              />
            </Field>
            <Field label="Size">
              <input
                type="number"
                className="input"
                value={layer.fontSize}
                onChange={(e) => updateLayer(layer.id, { fontSize: Number(e.target.value) })}
              />
            </Field>
          </div>
        </>
      )}

      {layer.kind === "rect" && (
        <Field label="Fill">
          <input
            type="color"
            value={layer.fill}
            onChange={(e) => updateLayer(layer.id, { fill: e.target.value })}
            className="h-7 w-full rounded border border-line bg-transparent"
          />
        </Field>
      )}

      <style>{`
        .input {
          width: 100%;
          background: #0b0d10;
          border: 1px solid #252a32;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          font-size: 12px;
        }
        .input:focus { outline: none; border-color: #e31937; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      {children}
    </label>
  );
}
