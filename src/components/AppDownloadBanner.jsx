import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Smartphone, X } from "lucide-react";

const DOWNLOAD_BASE = "https://update.vizzano-apparel.uz/download";

// Rol -> mobil ilova
const apps = {
  tailor: { name: "Tikuvchi", pkg: "uz.vizzano.tikuvchi" },
  universalTailor: { name: "Tikuvchi", pkg: "uz.vizzano.tikuvchi" },
  qualityController: { name: "SifatNazoratchi", pkg: "uz.vizzano.sifatnazoratchi" },
};

const DISMISS_KEY = "appDownloadBannerDismissedAt";
// Kuniga bir marta: bugun yopilgan bo'lsa, ertaga yana ko'rsatiladi
function isDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && new Date(at).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function AppDownloadBanner() {
  const app = apps[localStorage.getItem("role")];
  const [hidden, setHidden] = useState(isDismissed);
  const [qr, setQr] = useState(null);

  const url = app ? `${DOWNLOAD_BASE}/${app.pkg}` : null;

  useEffect(() => {
    if (!url || hidden) return;
    QRCode.toDataURL(url, { margin: 1, width: 160 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url, hidden]);

  if (!app || hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage yopiq bo'lsa, faqat shu sessiyada yashiriladi
    }
    setHidden(true);
  };

  return (
    <div className="relative mb-6 flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 pr-10">
      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white sm:flex">
        <Smartphone className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">
          {app.name} ilovasini telefoningizga o'rnating
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          Ishlaringiz telefonda qulayroq.
          <span className="hidden md:inline">
            {" "}Kompyuterdan kirgan bo'lsangiz, QR-kodni telefon kamerasi bilan skanerlang.
          </span>
        </p>
        <a
          href={url}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Yuklab olish
        </a>
      </div>

      {qr && (
        <img
          src={qr}
          alt={`${app.name} yuklab olish QR-kodi`}
          className="hidden h-28 w-28 shrink-0 rounded-lg border border-blue-200 bg-white p-1 md:block"
        />
      )}

      <button
        onClick={dismiss}
        aria-label="Yopish"
        className="absolute right-2 top-2 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-blue-100 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
