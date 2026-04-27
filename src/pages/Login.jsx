import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const OTP_LENGTH = 6;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef([]);

  const { login, loading } = useAuth();
  const { toast } = useToast();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!codeDialogOpen || !expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const expireTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
      setRemainingSeconds(diff);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [codeDialogOpen, expiresAt]);

  useEffect(() => {
    if (codeDialogOpen) {
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [codeDialogOpen]);

  const isCodeExpired = useMemo(() => {
    return remainingSeconds !== null && remainingSeconds <= 0;
  }, [remainingSeconds]);

  const otpCode = otp.join("");

  const resetOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(username.trim(), password);

    if (result.success) return;

    if (result.requiresCode) {
      resetOtp();
      setCodeMessage(result.message || "Tasdiqlash kodi Telegramga yuborildi");
      setExpiresAt(result.expiresAt || null);
      setCodeDialogOpen(true);

      toast({
        title: "Tasdiqlash kerak",
        description: result.message || "Tasdiqlash kodi Telegramga yuborildi",
      });

      return;
    }

    toast({
      title: "Diqqat",
      description: result.error,
      variant: "destructive",
    });
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (otpCode.length !== OTP_LENGTH) {
      toast({
        title: "Diqqat",
        description: "6 xonali kodni to'liq kiriting",
        variant: "destructive",
      });
      return;
    }

    const result = await login(username.trim(), password, otpCode);

    if (result.success) {
      setCodeDialogOpen(false);
      setCodeMessage("");
      setExpiresAt(null);
      setOtp(Array(OTP_LENGTH).fill(""));
      return;
    }

    if (result.requiresCode) {
      resetOtp();
      setCodeMessage(result.message || "Tasdiqlash kodi Telegramga yuborildi");
      setExpiresAt(result.expiresAt || null);

      toast({
        title: "Yangi kod yuborildi",
        description: result.message || "Tasdiqlash kodi Telegramga yuborildi",
      });
      return;
    }

    toast({
      title: "Diqqat",
      description: result.error,
      variant: "destructive",
    });
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const handlePasswordPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const textWithoutSpaces = pastedText.replace(/\s/g, "");
    setPassword((prev) => prev + textWithoutSpaces);
  };

  const handleOtpChange = (index, value) => {
    const cleanedValue = value.replace(/\D/g, "");

    if (!cleanedValue) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];

    if (cleanedValue.length === 1) {
      newOtp[index] = cleanedValue;
      setOtp(newOtp);

      if (index < OTP_LENGTH - 1) {
        otpRefs.current[index + 1]?.focus();
      }
      return;
    }

    const digits = cleanedValue.slice(0, OTP_LENGTH).split("");
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = digits[i] || "";
    }
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();

        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
      return;
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const focusIndex =
      pasted.length >= OTP_LENGTH ? OTP_LENGTH - 1 : pasted.length;
    otpRefs.current[focusIndex]?.focus();
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-3xl font-semibold text-[#884DEE]">
            Vizzano
          </h1>

          <p className="mb-8 text-center text-sm text-gray-500">
            Tizimga kirish uchun ma'lumotlaringizni kiriting
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-transparent bg-[#F8F9FA] px-4 py-3 outline-none transition focus:border-[#884DEE]/30 focus:ring-2 focus:ring-[#884DEE]"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                onPaste={handlePasswordPaste}
                required
                className="w-full rounded-xl border border-transparent bg-[#F8F9FA] px-4 py-3 pr-12 outline-none transition focus:border-[#884DEE]/30 focus:ring-2 focus:ring-[#884DEE]"
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <KeyRound size={20} />
              )}
              <span className="font-semibold">
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </span>
            </button>
          </form>
        </div>
      </div>

      <Dialog
        open={codeDialogOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setCodeDialogOpen(open);
            if (!open) {
              setOtp(Array(OTP_LENGTH).fill(""));
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="text-[#884DEE]" size={22} />
              Ikki bosqichli tasdiqlash
            </DialogTitle>

            <DialogDescription className="pt-1 text-sm text-gray-500">
              {codeMessage || "Telegramga yuborilgan 6 xonali kodni kiriting"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyCode} className="space-y-5 pt-2">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Tasdiqlash kodi
              </label>

              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-14 w-12 rounded-xl border border-gray-200 bg-[#F8F9FA] text-center text-xl font-semibold outline-none transition focus:border-[#884DEE] focus:ring-2 focus:ring-[#884DEE]"
                  />
                ))}
              </div>

              <p className="text-center text-xs text-gray-400">
                Kod avtomatik keyingi katakka o‘tadi
              </p>
            </div>

            {expiresAt && (
              <div className="rounded-xl bg-[#F8F9FA] px-4 py-3 text-sm text-gray-600">
                Kod amal qilish vaqti:{" "}
                <span
                  className={`font-semibold ${
                    isCodeExpired ? "text-red-500" : "text-[#884DEE]"
                  }`}
                >
                  {isCodeExpired ? "Vaqt tugadi" : formatTime(remainingSeconds)}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading || isCodeExpired || otpCode.length !== OTP_LENGTH
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#884DEE] py-3 text-white transition hover:bg-[#7a3ff0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ShieldCheck size={20} />
              )}
              <span className="font-semibold">
                {loading ? "Tasdiqlanmoqda..." : "Tasdiqlash"}
              </span>
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
