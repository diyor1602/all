import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// Banner ko'rinsa, layout sidebar va kontentni uning balandligiga (h-10) suradi
export function useAppDownloadBanner() {
  const app = apps[localStorage.getItem("role")];
  const [hidden, setHidden] = useState(isDismissed);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage yopiq bo'lsa, faqat shu sessiyada yashiriladi
    }
    setHidden(true);
  };

  return {
    visible: Boolean(app) && !hidden,
    app,
    url: app ? `${DOWNLOAD_BASE}/${app.pkg}` : null,
    dismiss,
  };
}

export default function AppDownloadBanner({ app, url, onDismiss }) {
  const [qr, setQr] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 180 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  const linkClass =
    "inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline";

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-center bg-gradient-to-r from-blue-600 to-violet-600 pl-4 pr-10 text-sm text-white">
      <p className="truncate">
        <span className="font-medium">{app.name} ilovasi telefoningiz uchun tayyor.</span>{" "}
        {/* Telefonda: to'g'ridan yuklab olish */}
        <a href={url} className={`${linkClass} md:hidden`}>
          Yuklab olish
          <ArrowRight className="h-4 w-4" />
        </a>
        {/* Kompyuterda: APK kerak emas, telefon bilan skanerlash uchun QR */}
        <Popover>
          <PopoverTrigger className={`${linkClass} hidden md:inline-flex`}>
            Yuklab olish
            <ArrowRight className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="z-[70] w-60 text-center">
            {qr && (
              <img
                src={qr}
                alt={`${app.name} yuklab olish QR-kodi`}
                className="mx-auto h-40 w-40"
              />
            )}
            <p className="mt-2 text-sm text-gray-600">
              Telefon kamerasi bilan skanerlang
            </p>
            <a href={url} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              yoki APK faylni shu yerda yuklab oling
            </a>
          </PopoverContent>
        </Popover>
      </p>

      <button
        onClick={onDismiss}
        aria-label="Yopish"
        className="absolute right-2 rounded-full p-1.5 transition-colors hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
