import { useRef } from "react";
import { uid, useWrapStore, type ImageLayer, type RectLayer, type TextLayer } from "../store/wrapStore";
import { fileToDataUrl, loadImage } from "../lib/fileToDataUrl";

export default function Toolbar() {
  const fileInput = useRef<HTMLInputElement>(null);
  const addLayer = useWrapStore((s) => s.addLayer);
  const canvasSize = useWrapStore((s) => s.canvasSize);
  const background = useWrapStore((s) => s.background);
  const setBackground = useWrapStore((s) => s.setBackground);
  const showTemplate = useWrapStore((s) => s.showTemplate);
  const setShowTemplate = useWrapStore((s) => s.setShowTemplate);
  const templateOpacity = useWrapStore((s) => s.templateOpacity);
  const setTemplateOpacity = useWrapStore((s) => s.setTemplateOpacity);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      const max = canvasSize * 0.6;
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const layer: ImageLayer = {
        id: uid(),
        kind: "image",
        name: file.name.replace(/\.[^.]+$/, ""),
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
  }

  function addText() {
    const layer: TextLayer = {
      id: uid(),
      kind: "text",
      name: "Text",
      visible: true,
      locked: false,
      x: canvasSize / 2 - 200,
      y: canvasSize / 2 - 50,
      width: 400,
      height: 100,
      rotation: 0,
      opacity: 1,
      text: "TESLA",
      fill: "#ffffff",
      fontSize: 96,
      fontFamily: "Inter",
    };
    addLayer(layer);
  }

  function addRect() {
    const layer: RectLayer = {
      id: uid(),
      kind: "rect",
      name: "Rectangle",
      visible: true,
      locked: false,
      x: canvasSize / 2 - 200,
      y: canvasSize / 2 - 200,
      width: 400,
      height: 400,
      rotation: 0,
      opacity: 1,
      fill: "#e31937",
    };
    addLayer(layer);
  }

  return (
    <div className="flex items-center gap-2 border-b border-line bg-panel px-3 py-2 text-xs">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <ToolBtn onClick={() => fileInput.current?.click()}>Upload image</ToolBtn>
      <ToolBtn onClick={addText}>Text</ToolBtn>
      <ToolBtn onClick={addRect}>Rectangle</ToolBtn>

      <div className="ml-4 flex items-center gap-2">
        <label className="text-white/60">Background</label>
        <input
          type="color"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent"
        />
      </div>

      <div className="ml-4 flex items-center gap-2">
        <label className="text-white/60">Template</label>
        <input
          type="checkbox"
          checked={showTemplate}
          onChange={(e) => setShowTemplate(e.target.checked)}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={templateOpacity}
          onChange={(e) => setTemplateOpacity(Number(e.target.value))}
          className="w-24"
          disabled={!showTemplate}
        />
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-line bg-ink px-2 py-1 text-white/80 hover:bg-line hover:text-white"
    >
      {children}
    </button>
  );
}
