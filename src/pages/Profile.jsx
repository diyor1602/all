import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import NoImage from "/noimage.png";
import { Eye, EyeOff, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Check if password fields are filled and match
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

      // Always send username
      updateData.append("username", formData.username);

      // Only send password if it's not empty
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-40 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-white mb-5">Shaxsiy profil</h1>
        </div>

        <div className="relative -mt-16 px-6">
          <div className="flex justify-center">
            <div
              className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden cursor-pointer relative"
              onClick={editing ? handleImageClick : undefined}
            >
              {editing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="text-white" />
                </div>
              )}
              <img
                src={imagePreview || data.img || NoImage}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = NoImage;
                }}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Foydalanuvchi ismi
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    F.I.SH
                  </label>
                  <div className="px-4 py-2 border border-gray-200 rounded-md bg-gray-50">
                    {data.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      autoComplete="new-password"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-t-2 border-blue-200 border-solid rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        Foydalanuvchi ismi
                      </p>
                      <p className="font-medium">{data.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">F.I.SH</p>
                      <p className="font-medium">{data.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{data.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tug'ilgan sana</p>
                      <p className="font-medium">{data.birthday}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Bo'lim</p>
                      <p className="font-medium">{data.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lavozim</p>
                      <p className="font-medium">{data.position || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Ishga qabul qilingan sana
                      </p>
                      <p className="font-medium">
                        {data.hiring_date?.split(" ")[0]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Holati</p>
                      <p className="font-medium capitalize">
                        {data.status === "working"
                          ? "Faol ishlayotgan"
                          : data.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Manzil</p>
                    <p className="font-medium">{data.address}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Pasport seriya</p>
                      <p className="font-medium">{data.passport_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">JSHSHIR</p>
                      <p className="font-medium">{data.passport_code}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tahrirlash
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
