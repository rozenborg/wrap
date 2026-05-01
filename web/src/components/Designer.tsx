import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Rect, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import { useWrapStore, type Layer as WLayer } from "../store/wrapStore";

interface DesignerProps {
  onStageReady?: (stage: Konva.Stage) => void;
}

export default function Designer({ onStageReady }: DesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [boxSize, setBoxSize] = useState(720);

  const layers = useWrapStore((s) => s.layers);
  const selectedId = useWrapStore((s) => s.selectedId);
  const selectLayer = useWrapStore((s) => s.selectLayer);
  const updateLayer = useWrapStore((s) => s.updateLayer);
  const background = useWrapStore((s) => s.background);
  const showTemplate = useWrapStore((s) => s.showTemplate);
  const templateOpacity = useWrapStore((s) => s.templateOpacity);
  const canvasSize = useWrapStore((s) => s.canvasSize);

  const [template] = useImage("/tesla/template.png");
  const scale = boxSize / canvasSize;

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        const h = e.contentRect.height;
        setBoxSize(Math.max(200, Math.min(w, h) - 16));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (stageRef.current && onStageReady) onStageReady(stageRef.current);
  }, [onStageReady]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`#${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, layers]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) selectLayer(null);
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateLayer(id, { x: node.x() / scale, y: node.y() / scale });
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateLayer(id, {
      x: node.x() / scale,
      y: node.y() / scale,
      width: (node.width() * sx) / scale,
      height: (node.height() * sy) / scale,
      rotation: node.rotation(),
    });
  };

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center p-4">
      <div
        className="checkerboard rounded-md shadow-2xl ring-1 ring-line"
        style={{ width: boxSize, height: boxSize }}
      >
        <Stage
          ref={stageRef}
          width={boxSize}
          height={boxSize}
          onMouseDown={handleStageClick}
          onTouchStart={handleStageClick}
        >
          <Layer listening={false}>
            <Rect x={0} y={0} width={boxSize} height={boxSize} fill={background} />
          </Layer>
          <Layer>
            {layers.map((l) => (
              <RenderedLayer
                key={l.id}
                layer={l}
                scale={scale}
                onSelect={() => selectLayer(l.id)}
                onDragEnd={(e) => handleDragEnd(l.id, e)}
                onTransformEnd={(e) => handleTransformEnd(l.id, e)}
              />
            ))}
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              anchorSize={8}
              borderStroke="#e31937"
              anchorStroke="#e31937"
              anchorFill="#0b0d10"
            />
          </Layer>
          {showTemplate && template && (
            <Layer listening={false} opacity={templateOpacity}>
              <KImage image={template} x={0} y={0} width={boxSize} height={boxSize} />
            </Layer>
          )}
        </Stage>
      </div>
    </div>
  );
}

interface RenderedLayerProps {
  layer: WLayer;
  scale: number;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

function RenderedLayer({ layer, scale, onSelect, onDragEnd, onTransformEnd }: RenderedLayerProps) {
  const common = useMemo(
    () => ({
      id: layer.id,
      x: layer.x * scale,
      y: layer.y * scale,
      width: layer.width * scale,
      height: layer.height * scale,
      rotation: layer.rotation,
      opacity: layer.opacity,
      visible: layer.visible,
      draggable: !layer.locked,
      onClick: onSelect,
      onTap: onSelect,
      onDragEnd,
      onTransformEnd,
    }),
    [layer, scale, onSelect, onDragEnd, onTransformEnd]
  );

  if (layer.kind === "image") return <ImageLayerNode {...common} src={layer.src} />;
  if (layer.kind === "rect") return <Rect {...common} fill={layer.fill} />;
  return (
    <KText
      {...common}
      text={layer.text}
      fill={layer.fill}
      fontSize={layer.fontSize * scale}
      fontFamily={layer.fontFamily}
    />
  );
}

function ImageLayerNode(props: {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  draggable: boolean;
  onClick: () => void;
  onTap: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const [img] = useImage(props.src, "anonymous");
  return <KImage image={img} {...props} />;
}
