"use client";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import { CircleDollarSign, Pencil, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Female from "/female.png";
import Male from "/male.png";
import NoImage from "/noimage.png";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile");
      setData(response.data);
      setFormData((prev) => ({ ...prev, username: response.data.username }));
      localStorage.setItem("imgUrl", response.data.img);
      localStorage.setItem("username", response.data.username);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Profil ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
    if (!editing) {
      setFormData({
        username: data.username,
        password: "",
        confirmPassword: "",
      });
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasPasswordChange =
      formData.password.trim() !== "" || formData.confirmPassword.trim() !== "";

    if (hasPasswordChange) {
      if (formData.password.trim() !== formData.confirmPassword.trim()) {
        toast({
          title: "Xatolik",
          description: "Parollar bir xil emas",
          variant: "destructive",
        });
        return;
      }
      if (formData.password.length < 6 || formData.confirmPassword.length < 6) {
        toast({
          title: "Xatolik",
          description: "Parol kamida 6 ta bo'lishi kerak",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const updateData = new FormData();
      updateData.append("_method", "PATCH");

      updateData.append("username", formData.username);

      if (hasPasswordChange) {
        updateData.append("password", formData.password);
      }

      if (fileInputRef.current.files[0]) {
        updateData.append("img", fileInputRef.current.files[0]);
      }

      await api.post(`/profile/${data.id}`, updateData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Profil yangilandi",
        variant: "default",
      });

      localStorage.setItem("username", formData.username);

      setEditing(false);
      navigate(0);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          "Profilni yangilab bo'lmadi. Bunday username mavjud bo'lishi mumkin.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading && !data.id) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div>
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
          <h2 className="text-zinc-900 dark:text-white mt-4">Yuklanmoqda...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="w-full mx-auto p-4">
        <div className="flex justify-between items-stretch flex-col md:flex-row gap-6 mb-6 w-full">
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
            <div className="text-2xl font-semibold text-center mb-6">
              {data.name}
            </div>
            <div className="flex justify-center items-center w-full">
              <div
                className={cn(
                  "relative w-64 h-64 rounded-full border-4 border-primary/20 bg-gray-200 overflow-hidden cursor-pointer shadow-lg",
                  editing && "hover:border-primary transition-all duration-300"
                )}
                onClick={editing ? handleImageClick : undefined}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 transition-opacity duration-300 z-10",
                    editing && "hover:opacity-100"
                  )}
                >
                  {editing && <Upload className="text-white w-8 h-8" />}
                </div>
                <div className="w-full h-full relative">
                  <img
                    src={
                      imagePreview ||
                      data.img ||
                      (data.gender === "male"
                        ? Male
                        : data.gender === "female"
                        ? Female
                        : NoImage)
                    }
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.src = NoImage;
                    }}
                  />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <button
              className="mt-8 py-2.5 px-6 bg-white border border-primary text-primary rounded-full flex items-center gap-2 hover:bg-primary hover:text-white transition-colors duration-300 shadow-sm"
              onClick={handleEditToggle}
            >
              {editing ? (
                <X className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {editing ? "Bekor qilish" : "Tahrirlash"}
            </button>
            <Link
              to="/profileSalary"
              className="mt-6 w-full flex items-center justify-center"
            >
              <Button
                className="rounded-full w-full flex items-center gap-2 bg-green-500 hover:bg-green-600"
                size="lg"
              >
                <CircleDollarSign /> Oylik
              </Button>
            </Link>
          </div>

          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md p-6 px-8 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Shaxsiy ma'lumotlar</h1>
            </div>

            {editing && (
              <form onSubmit={handleSubmit} className="mb-6 rounded-lg">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="w-full block">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foydalanuvchi ismi
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yangi parol (ixtiyoriy)
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parolni tasdiqlash
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            )}

            {!editing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-6">
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Foydalanuvchi ismi</p>
                    <p className="font-medium text-lg">{data.username}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">F.I.SH</p>
                    <p className="font-medium text-lg">{data.name}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium text-lg">
                      {data.phone && data.phone.length >= 11
                        ? data.phone.slice(0, 4) +
                          " " +
                          data.phone.slice(4, 6) +
                          " " +
                          data.phone.slice(6, 9) +
                          " " +
                          data.phone.slice(9, 11) +
                          " " +
                          data.phone.slice(11)
                        : data.phone || "-"}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Tug'ilgan sana</p>
                    <p className="font-medium text-lg">
                      {data.birthday
                        ? data.birthday
                            .split(" ")[0]
                            .split("-")
                            .reverse()
                            .join(".")
                        : "-"}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Bo'lim</p>
                    <p className="font-medium text-lg">
                      {data.department || "-"}
                    </p>
                  </div>
                  {data.group && (
                    <div className="border-b pb-2">
                      <p className="text-sm text-gray-500">Guruh</p>
                      <p className="font-medium text-lg">{data.group}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Lavozim</p>
                    <p className="font-medium text-lg">
                      {data.position || "-"}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">
                      Ishga qabul qilingan sana
                    </p>
                    <p className="font-medium text-lg">
                      {data.hiring_date
                        ? data.hiring_date
                            .split(" ")[0]
                            .split("-")
                            .reverse()
                            .join(".")
                        : "-"}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Manzil</p>
                    <p className="font-medium text-lg">{data.address || "-"}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">Pasport seriya</p>
                    <p className="font-medium text-lg">
                      {data.passport_number || "-"}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">JSHSHIR</p>
                    <p className="font-medium text-lg">
                      {data.passport_code || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
