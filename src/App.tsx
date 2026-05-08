import { useEffect } from "react";
import SignIn from "./components/SignIn";
import Toolbar from "./components/Toolbar";
import GraphCanvas from "./components/GraphCanvas";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  if (!token) return <SignIn />;
  return (
    <div className="h-full flex flex-col bg-stone-50">
      <Toolbar />
      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0">
        <div className="h-full min-h-0">
          <GraphCanvas />
        </div>
        <aside className="h-full min-h-0 border-l border-stone-200 bg-white flex flex-col">
          <div className="flex-1 min-h-0 p-4 overflow-auto text-sm text-stone-500">
            Preview pane — select a file
          </div>
        </aside>
      </div>
    </div>
  );
}
