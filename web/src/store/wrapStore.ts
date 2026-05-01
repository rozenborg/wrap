import { create } from "zustand";

export type LayerKind = "image" | "text" | "rect";

export interface BaseLayer {
  id: string;
  kind: LayerKind;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface ImageLayer extends BaseLayer {
  kind: "image";
  src: string;
}

export interface TextLayer extends BaseLayer {
  kind: "text";
  text: string;
  fill: string;
  fontSize: number;
  fontFamily: string;
}

export interface RectLayer extends BaseLayer {
  kind: "rect";
  fill: string;
}

export type Layer = ImageLayer | TextLayer | RectLayer;

export interface Reference {
  id: string;
  src: string;
  label?: string;
  sourceUrl?: string;
}

export type Provider = "openai" | "replicate";

interface WrapState {
  canvasSize: 512 | 1024;
  background: string;
  showTemplate: boolean;
  templateOpacity: number;
  layers: Layer[];
  selectedId: string | null;
  references: Reference[];
  provider: Provider;
  wrapName: string;

  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  reorderLayer: (id: string, delta: number) => void;
  selectLayer: (id: string | null) => void;
  setBackground: (c: string) => void;
  setShowTemplate: (v: boolean) => void;
  setTemplateOpacity: (v: number) => void;
  setCanvasSize: (s: 512 | 1024) => void;
  addReference: (r: Reference) => void;
  removeReference: (id: string) => void;
  setProvider: (p: Provider) => void;
  setWrapName: (n: string) => void;
}

export const useWrapStore = create<WrapState>((set) => ({
  canvasSize: 1024,
  background: "#ffffff",
  showTemplate: true,
  templateOpacity: 0.35,
  layers: [],
  selectedId: null,
  references: [],
  provider: "openai",
  wrapName: "My_Wrap",

  addLayer: (layer) =>
    set((s) => ({ layers: [...s.layers, layer], selectedId: layer.id })),
  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
    })),
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  reorderLayer: (id, delta) =>
    set((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const next = [...s.layers];
      const [item] = next.splice(idx, 1);
      const target = Math.max(0, Math.min(next.length, idx + delta));
      next.splice(target, 0, item);
      return { layers: next };
    }),
  selectLayer: (id) => set({ selectedId: id }),
  setBackground: (background) => set({ background }),
  setShowTemplate: (showTemplate) => set({ showTemplate }),
  setTemplateOpacity: (templateOpacity) => set({ templateOpacity }),
  setCanvasSize: (canvasSize) => set({ canvasSize }),
  addReference: (r) => set((s) => ({ references: [r, ...s.references] })),
  removeReference: (id) =>
    set((s) => ({ references: s.references.filter((r) => r.id !== id) })),
  setProvider: (provider) => set({ provider }),
  setWrapName: (wrapName) => set({ wrapName }),
}));

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
