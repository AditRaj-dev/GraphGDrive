import { useState } from "react";
import { requestAccessToken } from "../lib/auth";
import { useStore } from "../store/useStore";

export default function SignIn() {
  const setToken = useStore((s) => s.setToken);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    setError(null);
    setBusy(true);
    try {
      const token = await requestAccessToken();
      setToken(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-stone-50 dark:bg-stone-950">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
          graph.drive
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center max-w-xs">
          Visualize your Google Drive as an interactive node graph.
        </p>
      </div>
      <button
        onClick={onSignIn}
        disabled={busy}
        aria-label="Sign in with Google"
        className="h-11 px-6 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Connecting..." : "Connect Google Drive"}
      </button>
      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}
