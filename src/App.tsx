import { useEffect } from "react";
import SignIn from "./components/SignIn";
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
    <div className="h-full flex items-center justify-center text-stone-600 bg-stone-100">
      Signed in. Graph coming next task.
    </div>
  );
}
