import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Switch } from "@/components/ui/switch";

const Issue = () => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forAdmins, setForAdmins] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      if (image) {
        formData.append("image", image);
      }
      formData.append("for_admins", forAdmins);
      await api.post("/issue", formData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Sizning fikringiz muvaffaqiyatli yuborildi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 2000,
      });
      setDescription("");
      setImage(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Fikringiz yuborilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Fikr Bildirish
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rahbariyatga yuborish
            </label>
            <Switch checked={forAdmins} onCheckedChange={setForAdmins} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tavsif
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none p-3 text-gray-800"
              rows="5"
              placeholder="Fikringizni batafsil yozing..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasm (ixtiyoriy)
            </label>
            <label className="flex items-center gap-3 cursor-pointer bg-gray-100 hover:bg-gray-200 border border-dashed border-gray-400 p-3 rounded-xl transition duration-200">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5V8a2 2 0 012-2h3m10 0a2 2 0 012 2v8.5M16 21v-5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5m4-4h.01"
                />
              </svg>
              <span className="text-gray-700">
                {image ? image.name : "Fayl tanlang"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200"
          >
            {loading ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Issue;
