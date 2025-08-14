"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Camera, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const fullScreenStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "black",
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const MinusPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [tarifications, setTarifications] = useState([]);
  const [selectedTarifications, setSelectedTarifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [minusForm, setMinusForm] = useState({
    order_sub_model_id: null,
    comment: "",
    status: false,
    image: null,
  });

  useEffect(() => {
    fetchOrder();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const orderRes = await api.get(`/qualityController/orders/${id}`);
      setOrder(orderRes.data);
      setTarifications(
        orderRes.data?.order_model?.submodels[0]?.tarification_categories || []
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data",
      });
    }
  };

  const resetImageAndForm = () => {
    setImagePreview(null);
    setMinusForm({
      order_sub_model_id: null,
      comment: "",
      status: false,
      image: null,
    });
  };

  const handleMinus = async () => {
    minusForm.order_sub_model_id = order?.order_model?.submodels[0]?.id;
    if (!minusForm.order_sub_model_id || selectedTarifications.length === 0) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Ma'lumotlar to'liq emas",
      });
      return;
    }

    if (!minusForm.image) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Rasm yuklanmagan",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("comment", minusForm.comment);
      formData.append("status", false);
      formData.append("order_sub_model_id", minusForm.order_sub_model_id);
      formData.append("tarifications", JSON.stringify(selectedTarifications));
      if (minusForm.image) {
        formData.append("image", minusForm.image);
      }
      setIsSending(true);

      await api.post("/qualityController/qualityFailureCheck", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Muvaffaqiyatli!",
        description: "Sifat nazoratidan nosozlik qo'shildi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Reset form and navigate back
      resetImageAndForm();
      navigate(`/qualityController/orders/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Sifat nazoratidan o'tishda xatolik",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleTarification = (tarifId) => {
    setSelectedTarifications((prev) => {
      const exists = prev.includes(tarifId);
      if (exists) {
        return prev.filter((id) => id !== tarifId);
      } else {
        return [...prev, tarifId];
      }
    });
  };

  const startCamera = async () => {
    setIsCameraInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
      } else {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Video element not available after stream");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          err.name === "NotAllowedError"
            ? "Kamerani ishlatish uchun ruxsat berilmadi"
            : "Kamerani ishga tushirishda xatolik yuz berdi",
      });
      stopCamera();
    } finally {
      setIsCameraInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setMinusForm({ ...minusForm, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        stopCamera();
      },
      "image/jpeg",
      0.8
    );
  };

  const removeImage = () => {
    setMinusForm({ ...minusForm, image: null });
    setImagePreview(null);
  };

  const filteredTarifications = tarifications[0]?.tarifications?.filter(
    (tarif) => {
      const search = searchQuery.toLowerCase();
      return (
        tarif.name.toLowerCase().includes(search) ||
        tarif.code.toLowerCase().includes(search)
      );
    }
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Nosozlik qo'shish</h1>
          <Button
            variant="outline"
            onClick={() => navigate(`/qualityController/orders/${id}`)}
          >
            Orqaga
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Tarifikatsiyalarni tanlang
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Tarifikatsiyani qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {filteredTarifications?.map((tarif) => (
                <div
                  key={tarif.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedTarifications.includes(tarif.id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => toggleTarification(tarif.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{tarif.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Kod: {tarif.code}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary",
                      selectedTarifications.includes(tarif.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </div>
              ))}
              {filteredTarifications?.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500">
                  {searchQuery
                    ? "Qidiruv bo'yicha tarifikatsiya topilmadi"
                    : "Tarifikatsiyalar mavjud emas"}
                </div>
              )}
            </div>
          </div>

          <Input
            type="text"
            placeholder="Izoh"
            value={minusForm.comment}
            onChange={(e) =>
              setMinusForm({ ...minusForm, comment: e.target.value })
            }
          />

          <div className="relative">
            {!imagePreview && !isCameraOpen ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={startCamera}
              >
                {isCameraInitializing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Kamera ishga tushmoqda...
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Rasmga olish uchun bosing
                    </p>
                  </>
                )}
              </div>
            ) : isCameraOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={fullScreenStyle}
              >
                <div className="relative h-full flex flex-col">
                  <div className="absolute top-4 right-4 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white hover:bg-black/70"
                      onClick={stopCamera}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="flex-1 relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 p-0 border-4 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                        onClick={takePhoto}
                      >
                        <div className="w-10 h-10 rounded-full bg-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="relative rounded-lg overflow-hidden group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white hover:bg-gray-100"
                    onClick={startCamera}
                  >
                    Qayta olish
                  </Button>
                  <Button variant="destructive" size="sm" onClick={removeImage}>
                    O'chirish
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/qualityController/orders/${id}`)}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleMinus}
              disabled={isSending}
              className="min-w-[120px]"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </div>
              ) : (
                "Qo'shish"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinusPage;
