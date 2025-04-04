import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Key, KeyRound } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-[#6C5CE7] text-2xl font-medium text-center mb-8">
          Vizzano
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#F8F9FA] rounded-md border-0 focus:ring-2 focus:ring-[#6C5CE7] outline-none"
          />
          <input
            type="text"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#F8F9FA] rounded-md border-0 focus:ring-2 focus:ring-[#6C5CE7] outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C5CE7] text-white py-3 rounded-md hover:bg-[#5849e4] transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound size={20} />
            <span className="font-semibold">
              {loading ? "Tekshirilmoqda..." : "Kirish"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
