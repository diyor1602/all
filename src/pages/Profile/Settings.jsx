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

  const [activeTab, setActiveTab] = useState("salary"); // salary, group

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
        duration: 2000,
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
      toast({ title: "Rasm yangilandi ✅", duration: 2000 });
      setIsEditingImg(false);
      setPreviewImg(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate(0); // ✅ reload after success
    } catch (error) {
      toast({
        title: "Xatolik!",
        variant: "destructive",
        description: error.response?.data?.error || "Rasmni yangilab bo'lmadi",
        duration: 2000,
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
        duration: 2000,
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
        duration: 2000,
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
        duration: 2000,
      });
      return;
    }
    if (!newUsername.trim()) {
      toast({
        title: "Login bo'sh bo'lmasligi kerak!",
        variant: "destructive",
        duration: 2000,
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
        duration: 2000,
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

          {/* Camera Icon
          <label className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Camera className="w-5 h-5 text-gray-700" />
          </label> */}
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

      {/* Salary and Group history tab */}
      <div className="flex space-x-2 bg-white rounded-2xl p-4 shadow justify-between items-center">
        <div
          className={
            activeTab === "salary"
              ? "text-green-500 font-semibold text-center w-full cursor-pointer"
              : "w-full text-center cursor-pointer"
          }
          onClick={() => setActiveTab("salary")}
        >
          Oyliklar tarixi
        </div>
        <div
          className={
            activeTab === "group"
              ? "text-green-500 font-semibold text-center w-full cursor-pointer"
              : "w-full text-center cursor-pointer"
          }
          onClick={() => setActiveTab("group")}
        >
          Guruhlar tarixi
        </div>
      </div>

      {activeTab === "salary" && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          {userData?.salaryChanges?.length > 0 ? (
            <div className="space-y-4">
              {userData.salaryChanges
                ?.sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )
                ?.map((salary, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 text-gray-800">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          Eski miqdor
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                          {parseFloat(salary.old_salary)?.toLocaleString(
                            "ru-RU"
                          )}{" "}
                          so’m{" "}
                          <span className="text-xs text-gray-500">
                            {payment_types[salary.old_type] || ""}
                          </span>
                        </span>
                      </div>
                      <span className="text-blue-500 font-bold text-lg">→</span>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          Yangi miqdor
                        </span>
                        <span className="text-base font-semibold text-green-600">
                          {parseFloat(salary.new_salary)?.toLocaleString(
                            "ru-RU"
                          )}{" "}
                          so’m{" "}
                          <span className="text-xs text-gray-500">
                            {payment_types[salary.new_type] || ""}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 sm:text-right">
                      {salary.created_at
                        ?.split("T")[0]
                        ?.split("-")
                        .reverse()
                        .join(".")}{" "}
                      {salary.created_at?.split("T")[1]?.slice(0, 5)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-6">
              <span className="text-sm">
                💸 Bu oy davomida oyliklar o‘zgarmagan
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === "group" && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          {userData?.groupChanges?.length > 0 ? (
            <div className="space-y-4">
              {userData.groupChanges
                ?.sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )
                ?.map((change, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition"
                  >
                    {/* OLD DATA */}
                    <div className="flex gap-3">
                      <div className="flex items-center gap-3 text-gray-800">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Eski bo'lim
                          </span>
                          <span className="text-base font-semibold text-gray-700">
                            {change.old_department?.name || "—"}{" "}
                            {change.old_group?.name || ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* NEW DATA */}
                    <div className="flex  gap-3">
                      <div className="flex items-center gap-3 text-gray-800">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Yangi bo'lim
                          </span>
                          <span className="text-base font-semibold text-gray-700">
                            {change.new_department?.name || "—"}{" "}
                            {change.new_group?.name || ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* META INFO */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                      <div>
                        {change.created_at
                          ?.split("T")[0]
                          ?.split("-")
                          .reverse()
                          .join(".")}{" "}
                        {change.created_at?.split("T")[1]?.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-6">
              <span className="text-sm">
                👥 Bu oy davomida guruh o'zgartirilmagan
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
