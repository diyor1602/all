import { useState } from "react";
import { useVersionCheck } from "../hooks/useVersionCheck";

export default function UpdateBanner() {
  const { updateAvailable, remoteVersion } = useVersionCheck();
  const [dismissedVersion, setDismissedVersion] = useState(null);

  const visible = updateAvailable && dismissedVersion !== remoteVersion;

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-white shadow-md"
    >
      <span className="text-sm font-medium">
        Dasturning yangi versiyasi mavjud!
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-white px-3 py-1 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-blue-600"
        >
          Yangilash
        </button>
        <button
          onClick={() => setDismissedVersion(remoteVersion)}
          aria-label="Dismiss"
          className="rounded p-1 transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
