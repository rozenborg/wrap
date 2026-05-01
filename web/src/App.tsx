import { useCallback, useRef, useState } from "react";
import Konva from "konva";
import Designer from "./components/Designer";
import Toolbar from "./components/Toolbar";
import LayersPanel from "./components/LayersPanel";
import InspectorPanel from "./components/InspectorPanel";
import AIPanel from "./components/AIPanel";
import ReferencesPanel from "./components/ReferencesPanel";
import Preview3D from "./components/Preview3D";
import ExportBar from "./components/ExportBar";
import ErrorBoundary from "./components/ErrorBoundary";

type SideTab = "ai" | "refs" | "layers";

export default function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [tab, setTab] = useState<SideTab>("ai");

  const handleStageReady = useCallback((s: Konva.Stage) => {
    stageRef.current = s;
  }, []);

  const getCanvas = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const w = stage.width();
    if (!w) return null;
    return stage.toCanvas({ pixelRatio: 1024 / w });
  }, []);

  const getStage = useCallback(() => stageRef.current, []);

  return (
    <ErrorBoundary label="App">
      <div className="flex h-full w-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-accent" />
            <h1 className="text-sm font-semibold tracking-wide">Tesla Wrap Studio</h1>
            <span className="text-[11px] text-white/40">Model 3 (2024+ Premium)</span>
          </div>
          <a
            href="https://github.com/teslamotors/custom-wraps"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-white/40 hover:text-white"
          >
            Tesla template repo ↗
          </a>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-panel">
            <div className="flex shrink-0 border-b border-line">
              <TabBtn active={tab === "ai"} onClick={() => setTab("ai")}>AI</TabBtn>
              <TabBtn active={tab === "refs"} onClick={() => setTab("refs")}>References</TabBtn>
              <TabBtn active={tab === "layers"} onClick={() => setTab("layers")}>Layers</TabBtn>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ErrorBoundary label={`Sidebar/${tab}`}>
                {tab === "ai" && <AIPanel />}
                {tab === "refs" && <ReferencesPanel />}
                {tab === "layers" && <LayersPanel />}
              </ErrorBoundary>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <Toolbar />
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 border-r border-line bg-ink">
                <ErrorBoundary label="Designer">
                  <Designer onStageReady={handleStageReady} />
                </ErrorBoundary>
              </div>
              <div className="w-[44%] min-w-[320px]">
                <Preview3D getCanvas={getCanvas} />
              </div>
            </div>
            <ExportBar getStage={getStage} />
          </main>

          <aside className="w-64 shrink-0 border-l border-line bg-panel overflow-y-auto">
            <div className="border-b border-line px-3 py-2 text-[11px] uppercase tracking-wide text-white/50">
              Inspector
            </div>
            <ErrorBoundary label="Inspector">
              <InspectorPanel />
            </ErrorBoundary>
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2 text-xs ${
        active ? "bg-ink text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
