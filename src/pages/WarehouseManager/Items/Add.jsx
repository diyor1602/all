import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";

const Add = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [units, setUnits] = useState([]);
  const [colors, setColors] = useState([]);
  const [types, setTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    unit_id: "",
    color_id: "",
    type_id: "",
    price: "",
    currency_id: "",
    min_quantity: "",
    lot: "",
    image: null,
  });

  const fetchUnits = async () => {
    try {
      const response = await api.get("/warehouseManager/units");
      setUnits(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Birligi olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchColors = async () => {
    try {
      const response = await api.get("/warehouseManager/colors");
      setColors(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Rangi olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/types");
      setTypes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Turi olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await api.get("/warehouseManager/currencies");
      setCurrencies(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Valuta olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchColors();
    fetchTypes();
    fetchCurrencies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();

      // Create the data object
      const data = {
        name: formData.name,
        code: formData.code,
        unit_id: formData.unit_id,
        color_id: formData.color_id,
        type_id: formData.type_id,
        price: formData.price,
        currency_id: formData.currency_id,
        min_quantity: formData.min_quantity,
        lot: formData.lot,
      };

      if (
        !formData.unit_id ||
        !formData.color_id ||
        !formData.type_id ||
        !formData.price ||
        !formData.code ||
        !formData.name ||
        !formData.currency_id ||
        !formData.min_quantity
      ) {
        toast({
          title: "Xatolik",
          description: "Barcha maydonlarni to'ldiring",
          variant: "destructive",
        });
        return;
      }

      // Append the data object as a JSON string
      formPayload.append("data", JSON.stringify(data));

      // Append the image separately if it exists
      if (formData.image) {
        formPayload.append("image", formData.image);
      }

      await api.post("/warehouseManager/items", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Mahsulot qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      navigate("/warehouseManager/settings/items");
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Mahsulot qo'shishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-0 rounded-md md:p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("-1")}
          className="flex items-center gap-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          Yangi mahsulot qo'shish
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nomi
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Mahsulot nomi"
              className="w-full focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Kodi
            </Label>
            <Input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Mahsulot kodi"
              className="w-full focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_id" className="text-sm font-medium">
              Birligi
            </Label>
            <Select
              name="unit_id"
              value={formData.unit_id}
              onValueChange={(value) => handleSelectChange(value, "unit_id")}
              required
            >
              <SelectTrigger
                id="unit"
                className="w-full focus:ring-2 focus:ring-blue-500"
              >
                <SelectValue placeholder="Birligi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit?.id} value={unit?.id.toString()}>
                    {unit?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_id" className="text-sm font-medium">
              Rangi
            </Label>
            <Select
              name="color_id"
              value={formData.color_id}
              onValueChange={(value) => handleSelectChange(value, "color_id")}
              required
            >
              <SelectTrigger
                id="color"
                className="w-full focus:ring-2 focus:ring-blue-500"
              >
                <SelectValue placeholder="Rangi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {colors?.map((color) => (
                  <SelectItem key={color?.id} value={color?.id.toString()}>
                    {color?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot" className="text-sm font-medium">
              Lot
            </Label>
            <Input
              type="number"
              id="lot"
              step="0.5"
              name="lot"
              value={formData.lot}
              onChange={handleInputChange}
              placeholder="Lot raqami"
              className="w-full focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type_id" className="text-sm font-medium">
              Turi
            </Label>
            <Select
              name="type_id"
              value={formData.type_id}
              onValueChange={(value) => handleSelectChange(value, "type_id")}
              required
            >
              <SelectTrigger
                id="type"
                className="w-full focus:ring-2 focus:ring-blue-500"
              >
                <SelectValue placeholder="Turi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {types?.map((type) => (
                  <SelectItem key={type?.id} value={type?.id.toString()}>
                    {type?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Narxi
            </Label>
            <Input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium">
              Valyuta
            </Label>
            <Select
              name="currency_id"
              value={formData.currency_id}
              onValueChange={(value) =>
                handleSelectChange(value, "currency_id")
              }
              required
            >
              <SelectTrigger
                id="currency"
                className="w-full focus:ring-2 focus:ring-blue-500"
              >
                <SelectValue placeholder="Valyuta tanlang" />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem
                    key={currency?.id}
                    value={currency?.id.toString()}
                  >
                    {currency?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_quantity" className="text-sm font-medium">
              Minimal miqdor (
              {parseFloat(formData.min_quantity)?.toLocaleString("en-GB")})
            </Label>
            <Input
              type="number"
              id="min_quantity"
              name="min_quantity"
              value={formData.min_quantity}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="image" className="text-sm font-medium">
              Rasmi
            </Label>
            <input
              type="file"
              id="image"
              name="image"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <div
              onClick={handleImageClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-md object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                  <Upload className="h-10 w-10 mb-2" />
                  <p className="font-medium">Rasm tanlash uchun bosing</p>
                  <p className="text-sm text-gray-400 mt-1">
                    yoki bu yerga tashlang
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/warehouseManager/settings/items")}
            className="mr-2"
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saqlanmoqda...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Saqlash
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Add;
