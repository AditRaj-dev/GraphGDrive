import { useEffect, useRef, useState, type ReactNode } from "react";
import { createDriveClient } from "../lib/drive";
import { useStore } from "../store/useStore";

type Props = {
  srcs: string[];
  alt: string;
  className: string;
  fallback: ReactNode;
  loading?: "eager" | "lazy";
  fileId?: string;
  authenticatedFallback?: boolean;
};

const RETRY_DELAYS_MS = [2000, 5000, 10000];

function cacheBustedSrc(src: string, attempt: number): string {
  if (attempt === 0 || !src.includes("drive.google.com/thumbnail")) return src;
  const joiner = src.includes("?") ? "&" : "?";
  return `${src}${joiner}retry=${attempt}`;
}

export default function RetryingThumbnail({
  srcs,
  alt,
  className,
  fallback,
  loading = "lazy",
  fileId,
  authenticatedFallback = false,
}: Props) {
  const token = useStore((s) => s.token);
  const srcKey = srcs.join("|");
  const timeoutRef = useRef<number | null>(null);
  const [srcIndex, setSrcIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [waitingToRetry, setWaitingToRetry] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrcIndex(0);
    setAttempt(0);
    setWaitingToRetry(false);
    setExhausted(false);
    setBlobSrc(null);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, [srcKey]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authenticatedFallback || !exhausted || !fileId || !token || blobSrc) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        const client = createDriveClient(() => token);
        const blob = await client.fetchBytes(fileId);
        if (!blob.type.startsWith("image/")) return;
        createdUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        setBlobSrc(createdUrl);
      } catch {
        // Keep the normal placeholder if authenticated fallback fails.
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [authenticatedFallback, blobSrc, exhausted, fileId, token]);

  const src = blobSrc ?? srcs[srcIndex];
  if (!src || waitingToRetry) return <>{fallback}</>;

  return (
    <img
      key={`${srcIndex}-${attempt}`}
      src={cacheBustedSrc(src, attempt)}
      alt=""
      title={alt}
      className={className}
      loading={loading}
      onError={() => {
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay !== undefined) {
          setWaitingToRetry(true);
          timeoutRef.current = window.setTimeout(() => {
            setAttempt((value) => value + 1);
            setWaitingToRetry(false);
          }, delay);
          return;
        }

        setSrcIndex((index) => index + 1);
        setAttempt(0);
        setWaitingToRetry(false);
        if (srcIndex >= srcs.length - 1) setExhausted(true);
      }}
    />
  );
}
