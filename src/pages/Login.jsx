import { useState } from "react";
import { useAuth } from "@/context/auth-context.js";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (!result.success) {
      toast({
        title: "Diqqat",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);

    const name = document.querySelector("input[placeholder='Name']").value;
    const email = document.querySelector("input[placeholder='Email']").value;
    const message = document.querySelector("textarea").value;

    if (!name || !email || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setSending(false);
      return;
    }

    const text = `📩 Yangi bog'lanish so'rovi:\n👤 Ism: ${name}\n📭 Pochta: ${email}\n💬 Xabar: ${message}`;

    try {
      await fetch(
        `https://api.telegram.org/bot${
          import.meta.env.VITE_TELEGRAM_BOT_TOKEN
        }/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: import.meta.env.VITE_TELEGRAM_CHAT_ID, // e.g., 123456789
            text,
          }),
        }
      );

      toast({
        title: "Success",
        description: "We will get back to you shortly.",
      });
      setOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[90vh] bg-white">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-[#884DEE] text-3xl font-medium text-center mb-8">
            Vizzano
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-md border-0 focus:ring-2 focus:ring-[#884DEE] outline-none"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-md border-0 focus:ring-2 focus:ring-[#884DEE] outline-none"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound size={20} />
              <span className="font-semibold">
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </span>
            </button>
          </form>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-center">
        <a
          href="https://t.me/vizzano_biz"
          target="_blank"
          className="text-sm hover:text-sky-500 hover:underline"
        >
          Telegram
        </a>
        <span className="text-sm text-gray-400">|</span>
        <a
          href="https://www.instagram.com/vizzano.uz/"
          target="_blank"
          className="text-sm hover:text-red-500 hover:underline"
        >
          Instagram
        </a>
        <span className="text-sm text-gray-400">|</span>
        <div
          onClick={() => setOpen(true)}
          className="text-sm hover:text-amber-500 hover:underline"
        >
          Contact Us
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vizzano</DialogTitle>
            <DialogDescription>
              Please, leave your name and reason for contact. We will get back
              to you shortly.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-2" onSubmit={handleContact}>
            <Input type="text" placeholder="Name" required />
            <Input type="email" placeholder="Email" required />
            <Textarea
              placeholder="Your message"
              className="min-h-[20vh]"
              required
            />
            <Button disabled={sending} type="submit">
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
