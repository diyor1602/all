import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Image, Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const Edit = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const fieldConfig = {
    name: { label: "Ism", placeholder: "Ism kiriting", type: "text" },
    phone: { label: "Telefon", placeholder: "Telefon raqam", type: "tel" },
    address: {
      label: "Manzil",
      placeholder: "Manzilni kiriting",
      type: "text",
    },
    birth_day: { label: "Tug'ilgan kun", placeholder: "", type: "date" },
    comment: { label: "Izoh", placeholder: "Izoh yozing", type: "textarea" },
  };

  const [editPayload, setEditPayload] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
    birth_day: "",
  });

  // For handling the case when we want to remove the existing image
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [addImage, setAddImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLid = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/superhr/lids/${id}`);
        const data = response.data;

        // Format the birth_day to YYYY-MM-DD format for the date input
        const formattedBirthDay = data.birth_day
          ? data.birth_day.split(" ")[0]
          : "";

        setEditPayload({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          comment: data.comment || "",
          birth_day: formattedBirthDay,
        });

        // Set image preview if image exists
        if (data.image) {
          setImagePreview(data.image);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description:
            error.response?.data?.message ||
            "Lid ma'lumotlarini yuklashda xatolik",
        });
        navigate("/superhr/lids");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLid();
    }
  }, [id, navigate]);

  const formatPhoneNumber = (value) => {
    if (!value) return "+998";
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, "");
    // Ensure the number starts with 998
    if (!phoneNumber.startsWith("998")) {
      return "+998";
    }
    // Format the phone number
    let formattedNumber = "+";
    for (let i = 0; i < phoneNumber.length; i++) {
      if (i === 0) {
        formattedNumber += phoneNumber[i];
      } else if (i === 3) {
        formattedNumber += " (" + phoneNumber[i];
      } else if (i === 5) {
        formattedNumber += ") " + phoneNumber[i];
      } else if (i === 8 || i === 10) {
        formattedNumber += "-" + phoneNumber[i];
      } else {
        formattedNumber += phoneNumber[i];
      }
    }
    return formattedNumber;
  };

  const handlePhoneChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setEditPayload((prev) => ({
      ...prev,
      phone: formattedNumber,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setAddImage(file);
      setRemoveExistingImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAddImage(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const handleAddLid = async () => {
    const { name, phone, address, comment, birth_day } = editPayload;

    if (!name || !phone || !address || !birth_day) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      const formattedPhone = phone.replace(/[^0-9]/g, "");
      formData.append("phone", `+${formattedPhone}`);
      formData.append("address", address);
      formData.append("comment", comment);
      formData.append("birth_day", birth_day);
      formData.append("_method", "PATCH");
      if (addImage) {
        formData.append("image", addImage);
      } else if (removeExistingImage) {
        formData.append("remove_image", "1");
      }

      await api.post(`/superhr/lids/${id}`, formData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Lid ma'lumotlari yangilandi",
        style: { background: "green", color: "white" },
        duration: 1500,
      });

      navigate("/superhr/lids");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.response?.data?.message || "Lid qo'shishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nomzodni Tahrirlash
          </h1>
          <p className="text-gray-600">Kerakli maydonlarni o'zgartiring</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(fieldConfig).map((field) => {
                const config = fieldConfig[field];
                const isComment = field === "comment";

                if (isComment || field === "birth_day") return null;

                return (
                  <div key={field} className="space-y-1.5">
                    <Label
                      htmlFor={field}
                      className="text-sm font-medium text-gray-700"
                    >
                      {config.label}{" "}
                      {field !== "birth_day" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    {field === "phone" ? (
                      <Input
                        id={field}
                        name={field}
                        value={editPayload[field]}
                        onChange={handlePhoneChange}
                        placeholder="+998 (XX) XXX-XX-XX"
                        maxLength={19}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200"
                      />
                    ) : (
                      <Input
                        id={field}
                        type={config.type}
                        placeholder={config.placeholder}
                        value={editPayload[field]}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200"
                        onChange={(e) =>
                          setEditPayload({
                            ...editPayload,
                            [field]: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                );
              })}

              <div className="space-y-1.5">
                <Label
                  htmlFor="birth_day"
                  className="text-sm font-medium text-gray-700"
                >
                  Tug'ilgan kun <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birth_day"
                  type="date"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200"
                  value={editPayload.birth_day}
                  onChange={(e) =>
                    setEditPayload({
                      ...editPayload,
                      birth_day: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="comment"
                className="text-sm font-medium text-gray-700"
              >
                {fieldConfig.comment.label}
              </Label>
              <Textarea
                id="comment"
                placeholder={fieldConfig.comment.placeholder}
                value={editPayload.comment}
                rows="3"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200"
                onChange={(e) =>
                  setEditPayload({ ...editPayload, comment: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-sm font-medium text-gray-700"
              >
                Rasm (ixtiyoriy)
              </Label>
              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-4 w-full">
                  <Label
                    htmlFor="image"
                    className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <Image size={20} className="mr-2" />
                    Rasm tanlang
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </Label>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      onClick={removeImage}
                    >
                      <Trash2 />
                      O'chirish
                    </Button>
                  )}
                </div>
                {(imagePreview || editPayload.image) && (
                  <div className="mt-2 relative w-full max-w-xs rounded-lg overflow-hidden border-2 border-dashed border-gray-300 p-1">
                    <img
                      src={imagePreview || editPayload.image}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleAddLid}
                className="w-full"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                O'zgarishlarni saqlash
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Edit;
