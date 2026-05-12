const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const INTERACTIVE_TOKEN_TIMEOUT_MS = 60000;

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(opts?: { prompt?: string }): void };
          revoke(token: string, done: () => void): void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function requestAccessToken(options: { prompt?: "consent" | ""; timeoutMs?: number } = {}): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  await loadGis();
  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Google sign-in timed out"));
    }, options.timeoutMs ?? INTERACTIVE_TOKEN_TIMEOUT_MS);

    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        window.clearTimeout(timeout);
        if (resp.error || !resp.access_token) reject(new Error(resp.error ?? "no token"));
        else resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: options.prompt ?? "consent" });
  });
}

export async function revokeAccessToken(token: string): Promise<void> {
  await loadGis();
  return new Promise((resolve) => window.google!.accounts.oauth2.revoke(token, resolve));
}
