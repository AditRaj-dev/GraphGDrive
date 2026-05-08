import { useEffect } from "react";
import SignIn from "./components/SignIn";
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
    <div className="h-full grid grid-cols-[1fr_380px] bg-stone-50">
      <div className="h-full min-h-0">
        <GraphCanvas />
      </div>
      <aside className="h-full border-l border-stone-200 bg-white p-4 text-sm text-stone-500">
        Preview pane — select a file
      </aside>
    </div>
  );
}
