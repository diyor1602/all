import { useState, useEffect, useRef } from "react";

const BUILD_VERSION = import.meta.env.VITE_APP_VERSION;
const IS_DEV = import.meta.env.DEV;

export function useVersionCheck(intervalMs = 300_000) {
  const [remoteVersion, setRemoteVersion] = useState(null);
  const intervalRef = useRef(null);

  const fetchVersion = async () => {
    if (document.visibilityState === "hidden") return;
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version) setRemoteVersion(data.version);
    } catch {
      // network error — silently ignore
    }
  };

  useEffect(() => {
    if (IS_DEV) return;

    fetchVersion();
    intervalRef.current = setInterval(fetchVersion, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchVersion();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);

  const updateAvailable =
    remoteVersion !== null && remoteVersion !== BUILD_VERSION;

  return { updateAvailable, remoteVersion };
}
