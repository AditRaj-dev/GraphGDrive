import { useEffect, useState } from "react";
import SignIn from "./components/SignIn";
import Toolbar from "./components/Toolbar";
import GraphCanvas from "./components/GraphCanvas";
import PreviewPane from "./components/preview/PreviewPane";
import ShortcutsModal from "./components/ShortcutsModal";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";
import { requestAccessToken } from "./lib/auth";

const SIGNED_IN_KEY = "graphDrive.signedIn";

export default function App() {
  const token = useStore((s) => s.token);
  const setToken = useStore((s) => s.setToken);
  const { ensureRoot } = useDriveTree();
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const darkMode = useStore((s) => s.darkMode);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [restoringSession, setRestoringSession] = useState(() => {
    return !token && localStorage.getItem(SIGNED_IN_KEY) === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  useEffect(() => {
    if (token || localStorage.getItem(SIGNED_IN_KEY) !== "true") {
      setRestoringSession(false);
      return;
    }

    let cancelled = false;
    setRestoringSession(true);

    (async () => {
      try {
        const nextToken = await requestAccessToken({ prompt: "", timeoutMs: 5000 });
        if (!cancelled) setToken(nextToken);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(SIGNED_IN_KEY);
          setToken(null);
        }
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setToken, token]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) setShortcutsOpen((o) => !o);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (restoringSession) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-xs text-stone-500 dark:text-stone-400">
        Restoring Google Drive session...
      </div>
    );
  }

  if (!token) return <SignIn />;
  return (
    <>
      <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden">
        <Toolbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
        <div
          className={`flex-1 grid min-h-0 overflow-hidden transition-[grid-template-columns] duration-200 ${
            sidebarOpen ? "grid-cols-[1fr_380px]" : "grid-cols-[1fr_0px]"}`}
        >
          <div className="h-full min-h-0 overflow-hidden">
            <GraphCanvas />
          </div>
          <aside
            className={`h-full min-h-0 border-l border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex flex-col overflow-hidden transition-all duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <PreviewPane />
          </aside>
        </div>
      </div>

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </>
  );
}
