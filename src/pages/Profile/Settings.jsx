import {
  CircleUser,
  Pencil,
  X,
  Check,
  Eye,
  EyeOff,
  Camera,
  Loader2,
} from "lucide-react";
import payment_types from "@/lib/paymentTypes";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useNavigate } from "react-router-dom";

const Settings = ({ userData }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [previewImg, setPreviewImg] = useState(null);
  const [isEditingImg, setIsEditingImg] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userData.username);
  const [loadingUsername, setLoadingUsername] = useState(false);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // === IMAGE HANDLING ===
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImg(URL.createObjectURL(file));
      setIsEditingImg(true);
    }
  };

  const handleCancelImage = () => {
    setPreviewImg(null);
    setIsEditingImg(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveImage = async () => {
    if (!fileInputRef.current?.files[0]) return;
    if (!newUsername.trim()) {
      toast({
        title: "Login bo'sh bo'lmasligi kerak!",
        variant: "destructive",
      });
      return;
    }

    setLoadingImg(true);

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("img", fileInputRef.current.files[0]);
    formData.append("username", newUsername.trim()); // ✅ always send username

    try {
      await api.post(`/profile/${userData.id}`, formData);
      toast({ title: "Rasm yangilandi ✅" });
      setIsEditingImg(false);
      setPreviewImg(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate(0); // ✅ reload after success
    } catch (error) {
      toast({
        title: "Xatolik!",
        variant: "destructive",
        description: error.response?.data?.error || "Rasmni yangilab bo'lmadi",
      });
    } finally {
      setLoadingImg(false);
    }
  };

  // === USERNAME HANDLING ===
  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Login bo'sh bo'lmasligi kerak!",
        variant: "destructive",
      });
      return;
    }

    setLoadingUsername(true);

    try {
      await api.post(`/profile/${userData.id}`, {
        _method: "PATCH",
        username: newUsername.trim(), // ✅ required
      });
      toast({
        title: "Login yangilandi ✅",
        duration: 2000,
        style: {
          background: "green",
          color: "white",
        },
      });
      setIsEditingUsername(false);
      navigate(0); // ✅ reload after success
    } catch (error) {
      toast({
        title: "Xatolik!",
        variant: "destructive",
        description: error.response?.data?.error || "Loginni yangilab bo'lmadi",
      });
      setNewUsername(userData.username); // reset if error
    } finally {
      setLoadingUsername(false);
    }
  };

  const handleCancelUsername = () => {
    setNewUsername(userData.username);
    setIsEditingUsername(false);
  };

  // === PASSWORD HANDLING ===
  const handleSavePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      toast({ title: "Parolni kiriting!", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Parollar mos emas!", variant: "destructive" });
      return;
    }
    if (password.trim().length < 6) {
      toast({
        title: "Parol kamida 6 ta bo'lishi kerak!",
        variant: "destructive",
      });
      return;
    }
    if (!newUsername.trim()) {
      toast({
        title: "Login bo'sh bo'lmasligi kerak!",
        variant: "destructive",
      });
      return;
    }

    setLoadingPassword(true);

    try {
      await api.post(`/profile/${userData.id}`, {
        _method: "PATCH",
        username: newUsername.trim(), // ✅ always send username
        password,
      });
      toast({ title: "Parol yangilandi ✅" });
      setShowPasswordFields(false);
      setPassword("");
      setConfirmPassword("");
      navigate(0); // ✅ reload after success
    } catch (error) {
      toast({
        title: "Xatolik!",
        variant: "destructive",
        description: error.response?.data?.error || "Parol yangilab bo'lmadi",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* === IMAGE === */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          {userData.img || previewImg ? (
            <img
              src={previewImg || userData.img}
              alt={userData.username}
              className="w-24 h-24 rounded-full object-cover border"
            />
          ) : (
            <CircleUser className="w-24 h-24 rounded-full text-gray-400" />
          )}

          {/* Camera Icon */}
          <label className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Camera className="w-5 h-5 text-gray-700" />
          </label>
        </div>

        {isEditingImg && (
          <div className="flex space-x-2">
            <button
              onClick={handleSaveImage}
              className="p-2 bg-green-500 text-white rounded-full flex items-center justify-center"
              disabled={loadingImg}
            >
              {loadingImg ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleCancelImage}
              className="p-2 bg-red-500 text-white rounded-full flex items-center justify-center"
              disabled={loadingImg}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* === USERNAME === */}
      <div className="bg-white rounded-2xl p-4 shadow space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-gray-600 font-medium">Login:</span>
          {isEditingUsername ? (
            <div className="flex items-center space-x-2">
              <input
                value={newUsername}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  setNewUsername(e.target.value);
                }}
                className="border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={handleSaveUsername}
                className="p-1 bg-green-500 text-white rounded"
                disabled={loadingUsername}
              >
                {loadingUsername ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancelUsername}
                className="p-1 bg-red-500 text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>{newUsername}</span>
              <button onClick={() => setIsEditingUsername(true)}>
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === PASSWORD === */}
      <div className="bg-white rounded-2xl p-4 shadow space-y-2">
        {!showPasswordFields ? (
          <button
            onClick={() => setShowPasswordFields(true)}
            className="text-blue-500 text-sm"
          >
            Parolni o'zgartirish?
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Yangi parol"
                value={password}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  setPassword(e.target.value);
                }}
                className="border rounded w-full px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Parolni tasdiqlang"
                value={confirmPassword}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  setConfirmPassword(e.target.value);
                }}
                className="border rounded w-full px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSavePassword}
                className="flex-1 bg-green-500 text-white rounded-lg py-2 flex justify-center"
                disabled={loadingPassword}
              >
                {loadingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Saqlash"
                )}
              </button>
              <button
                onClick={() => setShowPasswordFields(false)}
                className="flex-1 bg-red-500 text-white rounded-lg py-2"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === STATIC INFO === */}
      <div className="bg-white rounded-2xl p-4 shadow space-y-2">
        <div>To'lov turi: {payment_types[userData.payment_type]}</div>
        <div>
          To'lov miqdori:{" "}
          {parseFloat(userData.salary)?.toLocaleString("ru-RU", {
            maximumFractionDigits: 0,
          }) || 0}{" "}
          so'm
        </div>
        <div>Bo'lim: {userData.department || ""}</div>
        {userData.group && <div>Guruh: {userData.group}</div>}
      </div>
    </div>
  );
};

export default Settings;
