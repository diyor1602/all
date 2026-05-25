import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Switch } from "@/components/ui/switch";
import {
  Wrench,
  AlertTriangle,
  Briefcase,
  UserCog,
  ImagePlus,
} from "lucide-react";

const templates = [
  {
    id: 1,
    text: "Menda ish yo'q",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    text: "Mashinam buzildi",
    icon: Wrench,
    color: "bg-red-100 text-red-700",
  },
  {
    id: 3,
    text: "Texnolog kerak",
    icon: UserCog,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: 4,
    text: "Yordam kerak",
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-700",
  },
];

const Issue = () => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forAdmins, setForAdmins] = useState(false);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      if (image) formData.append("image", image);
      formData.append("for_admins", forAdmins);

      await api.post("/issue", formData);

      toast({
        title: "Yuborildi",
        description: "Xabaringiz muvaffaqiyatli yuborildi",
        style: { background: "#16a34a", color: "white" },
      });

      setDescription("");
      setImage(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Yuborishda muammo bo‘ldi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-5 space-y-5">
        {/* Title */}
        <h1 className="text-xl font-semibold text-center text-gray-800">
          Muammo haqida xabar berish
        </h1>

        {/* Toggle */}
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-3">
          <span className="text-sm text-gray-700">Rahbariyatga yuborish</span>
          <Switch checked={forAdmins} onCheckedChange={setForAdmins} />
        </div>

        {/* Templates */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Tez tanlash:</p>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDescription(item.text)}
                  className={`flex w-full h-12 items-center gap-2 p-3 rounded-xl text-sm font-medium active:scale-95 transition ${item.color}`}
                >
                  <Icon size={16} />
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Muammoni yozing..."
          className="w-full rounded-2xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none p-4 text-gray-800 text-sm"
          rows="4"
          required
        />

        {/* Image upload */}
        <label className="flex items-center justify-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 border border-dashed border-gray-400 p-4 rounded-xl transition">
          <ImagePlus size={18} />
          <span className="text-sm text-gray-700">
            {image ? image.name : "Rasm qo‘shish"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>

        {imagePreviewUrl && (
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src={imagePreviewUrl}
              alt="Selected"
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 active:scale-95 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition"
        >
          {loading ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      </div>
    </div>
  );
};

export default Issue;
