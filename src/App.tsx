import { useEffect, useState } from "react";
import SignIn from "./components/SignIn";
import Toolbar from "./components/Toolbar";
import GraphCanvas from "./components/GraphCanvas";
import PreviewPane from "./components/preview/PreviewPane";
import ShortcutsModal from "./components/ShortcutsModal";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) setShortcutsOpen((o) => !o);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!token) return <SignIn />;
  return (
    <>
      <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
        <Toolbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
        <div
          className={`flex-1 grid min-h-0 overflow-hidden transition-[grid-template-columns] duration-200 ${
            sidebarOpen ? "grid-cols-[1fr_380px]" : "grid-cols-[1fr_0px]"
          }`}
        >
          <div className="h-full min-h-0 overflow-hidden">
            <GraphCanvas />
          </div>
          <aside
            className={`h-full min-h-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden transition-all duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <PreviewPane />
          </aside>
        </div>
      </div>

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </>
  );
}
