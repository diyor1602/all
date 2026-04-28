import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { statuses } from "@/lib/status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Camera,
  Edit3,
  Palette,
  RotateCcw,
  BadgeCheck,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import formatNumber from "@/utils/formatNumber";

const OrderView = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [minusDialogOpen, setMinusDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [availableCameras, setAvailableCameras] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(3);
  const canvasRef = useRef(null);
  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const [selectedTarifCat, setSelectedTarifCat] = useState("");
  const [selectedTarif, setSelectedTarif] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [description, setDescription] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOtkType, setSelectedOtkType] = useState(() => {
    try {
      const orderId = order?.id;
      if (!orderId) return null;
      const stored = localStorage.getItem(`selectedOtkTarif_${orderId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  });
  const [enteredQuantity, setEnteredQuantity] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const getEmployees = async () => {
    if (debouncedSearchTerm.length < 2) return;
    try {
      setIsSearching(true);
      const res = await api.get("/qualityController/employees", {
        params: {
          search: debouncedSearchTerm,
          status: "working",
        },
      });
      setSearchResults(res.data?.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlarni qidirishda xatolik yuz berdi",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    getEmployees();
  }, [debouncedSearchTerm]);

  const getAttachedEmployees = (data) => {
    if (!Array.isArray(data)) return [];

    const map = new Map();

    data.forEach((item) => {
      if (item?.employee?.id && !map.has(item.employee.id)) {
        map.set(item.employee.id, item.employee);
      }
    });

    return Array.from(map.values());
  };

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const [orderRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
      ]);

      setOrder(orderRes.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  useEffect(() => {
    if (order?.id) {
      try {
        const stored = localStorage.getItem(`selectedOtkTarif_${order.id}`);
        setSelectedOtkType(stored ? JSON.parse(stored) : null);
      } catch (error) {
        setSelectedOtkType(null);
      }
    }
  }, [order?.id]);

  useEffect(() => {
    if (minusDialogOpen) {
      setUseCamera(true);
      startCamera();
    }
  }, [minusDialogOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isEditing) {
        stopEditing();
      }
    };

    const handleClickOutside = (e) => {
      if (
        isEditing &&
        editorRef.current &&
        !editorRef.current.contains(e.target)
      ) {
        stopEditing();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isEditing]);

  const handlePlus = async () => {
    setSending(true);
    try {
      await api.post("/qualityController/qualityControl", {
        order_id: id,
        type: "good",
        stage_tarification_id: selectedOtkType?.id,
        quantity: enteredQuantity,
      });
      setPlusDialogOpen(false);
      toast({
        title: "Tekshirildi",
        duration: 1000,
      });
      fetchOrder();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Yuborishda xatolik yuz berdi",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMinus = async () => {
    setSending(true);
    const formData = new FormData();
    formData.append("order_id", id);
    formData.append("type", "fail");
    formData.append("image", selectedImage);
    formData.append("stage_tarification_id", selectedOtkType?.id);
    formData.append("fail_tarification_id", selectedTarif);
    formData.append(
      "employee_id",
      selectedEmployee || selectedSearchResult?.id || "",
    );
    formData.append("description", description);

    try {
      await api.post("/qualityController/qualityControl", formData);
      setMinusDialogOpen(false);
      toast({
        title: "Tekshirildi",
        duration: 1000,
      });
      fetchOrder();
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedTarif("");
      setSelectedTarifCat("");
      setSelectedEmployee("");
      setUseCamera(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Yuborishda xatolik yuz berdi",
      });
    } finally {
      setSending(false);
    }
  };

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );
      setAvailableCameras(videoDevices);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kameraga ulanib bo'lmadi",
      });
    }
  };

  const startCamera = async () => {
    try {
      await getAvailableCameras();
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kameraga ulanib bo'lmadi",
      });
    }
  };

  const switchCamera = async () => {
    stopCamera();
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);

    try {
      const constraints = {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kamerani almashtirib bo'lmadi",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setUseCamera(false);
        stopCamera();
      });
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = imagePreview;
    }, 100);
  };

  const stopEditing = () => {
    if (isEditing) {
      saveEditedImage();
    } else {
      setIsEditing(false);
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    } else {
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imagePreview;
  };

  const saveEditedImage = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], "edited-image.jpg", {
        type: "image/jpeg",
      });
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsEditing(false);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Earnings Display */}
      {order?.auth_employee_earnings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 mb-4 shadow-lg"
        >
          <div className="flex justify-between items-center text-white">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90 mb-1">Bugun</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {formatNumber(order.auth_employee_earnings.today_earned, 0)}
                </span>
                <span className="text-sm font-medium opacity-90">so'm</span>
              </div>
            </div>
            <div className="text-right opacity-75">
              <p className="text-xs font-medium opacity-80 mb-1">
                Umumiy balans
              </p>
              <p className="text-sm font-medium">
                {formatNumber(order.auth_employee_earnings.total_earned, 0)}{" "}
                so'm
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg mt-4"
      >
        <motion.div
          className="p-6 cursor-pointer select-none"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">
                {order?.name}
              </div>
              <div className="font-semibold text-gray-800 text-xs">
                {order?.order_model?.sub_models[0]?.submodel?.name ||
                  "Buyurtma"}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isDetailsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-6 h-6 text-gray-500" />
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {isDetailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Status", value: statuses[order?.status]?.text },
                    { label: "Miqdori", value: order?.quantity },
                    { label: "Model", value: order?.order_model?.model?.name },
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium text-gray-600 block mb-1">
                        {item.label}:
                      </span>
                      <span className="text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {order?.order_model?.submodels[0]?.tarification_categories?.find(
        (category) => category.name === "OTK",
      ) ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-md border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <BadgeCheck className="w-5 h-5 mr-2 text-blue-500" />
                OTK turini tanlang
              </h3>
              <div className="flex gap-2 items-center flex-wrap">
                {order?.order_model?.submodels[0]?.tarification_categories
                  ?.find((category) => category.name === "OTK")
                  ?.tarifications?.map((item, index) => {
                    const isSelected = selectedOtkType?.id === item.id;

                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedOtkType(item);
                          localStorage.setItem(
                            `selectedOtkTarif_${order?.id}`,
                            JSON.stringify(item),
                          );
                        }}
                        className={`
                        flex-1 cursor-pointer rounded-xl p-3 border-2 transition-all duration-300 relative
                        ${
                          isSelected
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transform scale-105"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }
                      `}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}

                        <div className="flex flex-col items-center text-center space-y-1">
                          <motion.div
                            animate={{
                              scale: isSelected ? [1, 1.1, 1] : 1,
                            }}
                            transition={{
                              duration: 0.3,
                              repeat: isSelected ? Infinity : 0,
                              repeatDelay: 2,
                            }}
                            className={`
                            text-lg font-bold w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                            ${
                              isSelected
                                ? "border-blue-500 text-blue-600 bg-white shadow-md"
                                : "border-gray-300 text-gray-500"
                            }
                          `}
                          >
                            {index + 1}
                          </motion.div>

                          <div className="space-y-0.5">
                            <h4
                              className={`
                            text-xs font-semibold transition-all
                            ${
                              isSelected
                                ? "text-blue-800 transform scale-105"
                                : "text-gray-600"
                            }
                          `}
                            >
                              {item.name}
                            </h4>

                            {item?.summa && (
                              <div
                                className={`
                              text-xs font-medium transition-all
                              ${
                                isSelected
                                  ? "text-blue-700 font-semibold"
                                  : "text-gray-400"
                              }
                            `}
                              >
                                {formatNumber(item.summa, 2)} so'm
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>

              {!selectedOtkType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md"
                >
                  <p className="text-xs text-amber-700 flex items-center">
                    <span className="mr-1.5 text-xs">⚠️</span>
                    Iltimos, OTK turini tanlang
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 py-8 bg-white rounded-2xl shadow-lg"
          >
            <div className="grid grid-cols-2 gap-3 px-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <button
                  onClick={() => {
                    if (!selectedOtkType) {
                      alert("Iltimos otk turini tanlang!");
                      return;
                    }
                    setMinusDialogOpen(true);
                    setDescription("");
                    setSearchTerm("");
                    setSearchResults([]);
                    setSelectedSearchResult(null);
                  }}
                  className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-3xl sm:text-5xl font-bold text-red-500">
                    {order?.fail_by_stage?.find(
                      (stage) =>
                        stage?.tarification?.id === selectedOtkType?.id,
                    )?.count || 0}
                  </span>
                  <span className="text-sm text-red-600">Yaroqsiz</span>
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <button
                  onClick={() => {
                    if (!selectedOtkType) {
                      alert("Iltimos otk turini tanlang!");
                      return;
                    }
                    setEnteredQuantity("");
                    setPlusDialogOpen(true);
                  }}
                  className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-3xl sm:text-5xl font-bold text-green-500">
                    {order?.good_by_stage?.find(
                      (stage) =>
                        stage?.tarification?.id === selectedOtkType?.id,
                    )?.count || 0}
                  </span>
                  <span className="text-sm text-green-600">Sifatli</span>
                </button>
              </motion.div>
            </div>
          </motion.div>

          <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Mahsulot sifatli ekanligini tasdiqlaysizmi?
                </DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                value={enteredQuantity}
                onChange={(e) => setEnteredQuantity(e.target.value)}
                placeholder="Miqdorni kiriting"
              />
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlusDialogOpen(false);
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="py-7"
                  disabled={sending || enteredQuantity <= 0}
                  onClick={handlePlus}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle /> Tasdiqlash
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={minusDialogOpen}
            onOpenChange={(open) => {
              setMinusDialogOpen(open);
              if (!open) {
                // Reset when dialog closes
                setSelectedImage(null);
                setImagePreview(null);
                setSelectedTarifCat("");
                setSelectedTarif("");
                setUseCamera(false);
                if (cameraStream) {
                  cameraStream.getTracks().forEach((track) => track.stop());
                  setCameraStream(null);
                }
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-auto">
              <div className="space-y-4 mt-4">
                {/* Image Upload/Camera Section */}
                <div className="space-y-2">
                  {!imagePreview && !useCamera && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setUseCamera(true);
                          startCamera();
                        }}
                        className="w-full max-w-xs"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Kameradan olish
                      </Button>
                    </div>
                  )}

                  {useCamera && (
                    <div className="space-y-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-[50vh] rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Rasmga olish
                        </Button>
                        {availableCameras.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={switchCamera}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {imagePreview && !isEditing && (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-[50vh] object-contain rounded-lg border"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={startEditing}
                            className="bg-black text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImagePreview(null);
                              setSelectedImage(null);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="space-y-2" ref={editorRef}>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          <input
                            type="color"
                            value={drawColor}
                            onChange={(e) => setDrawColor(e.target.value)}
                            className="w-8 h-8 border rounded cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Qalam:</label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(e.target.value)}
                            className="w-20"
                          />
                          <span className="text-sm">{brushSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="relative border rounded-lg overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-[50vh] object-contain cursor-crosshair touch-none"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tarification Section */}
                {/* <div className="flex items-center gap-2">
                  <select
                    value={selectedTarifCat}
                    onChange={(e) => {
                      setSelectedTarifCat(e.target.value);
                      setSelectedTarif("");
                      setSelectedEmployee("");
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Kategoriyani tanlang</option>
                    {order?.order_model?.submodels[0]?.tarification_categories?.map(
                      (category, index) => (
                        <option key={index} value={category.id}>
                          {category.name}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    value={selectedTarif}
                    onChange={(e) => {
                      setSelectedTarif(e.target.value);
                      setSelectedEmployee(""); 
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Ishni tanlang</option>
                    {order?.order_model?.submodels[0]?.tarification_categories
                      ?.find(
                        (cat) => String(cat.id) === String(selectedTarifCat),
                      )
                      ?.tarifications?.map((work, index) => (
                        <option key={index} value={work.id}>
                          {work.name}
                        </option>
                      ))}
                  </select>
                </div> */}

                {/* Employee Selection Section */}
                <>
                  {(() => {
                    const employees = getAttachedEmployees(
                      order?.order_model?.submodels[0]?.tarification_categories
                        ?.find(
                          (cat) => String(cat.id) === String(selectedTarifCat),
                        )
                        ?.tarifications?.find(
                          (tarif) => String(tarif.id) === String(selectedTarif),
                        )?.tarification_logs,
                    );

                    // Auto-select if only one employee available
                    if (employees.length === 1 && !selectedEmployee) {
                      setSelectedEmployee(String(employees[0].id));
                    }

                    if (employees.length === 0) {
                      return (
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder="Xodim ismini kiriting..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                              }}
                              className="pr-10 border-gray-200 focus:border-blue-400 focus:ring-blue-100 transition-all duration-200"
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                              {selectedSearchResult?.name ? (
                                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {selectedSearchResult?.img ? (
                                        <img
                                          src={selectedSearchResult?.img}
                                          className="w-8 h-8 shrink-0 object-cover rounded-full"
                                          alt=""
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                          <span className="text-xs font-medium text-blue-600">
                                            {selectedSearchResult?.name
                                              ?.charAt(0)
                                              ?.toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                      <span className="font-medium text-green-800 text-xs">
                                        Tanlangan: {selectedSearchResult.name}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedSearchResult(null);
                                        setSelectedEmployee("");
                                        setSearchTerm("");
                                      }}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
                                    >
                                      O'zgartirish
                                    </button>
                                  </div>
                                </div>
                              ) : isSearching ? (
                                <div className="px-4 py-8 text-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">
                                    Xodimlar qidirilmoqda...
                                  </p>
                                </div>
                              ) : searchResults?.length > 0 ? (
                                <div className="py-1">
                                  {searchResults?.map((searchResult, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setSelectedEmployee(
                                          String(searchResult.id),
                                        );
                                        setSelectedSearchResult(searchResult);
                                      }}
                                      className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 group"
                                    >
                                      <div className="flex items-center space-x-3">
                                        {searchResult?.img ? (
                                          <img
                                            src={searchResult.img}
                                            className="w-8 h-8 object-cover shrink-0 rounded-full"
                                            alt=""
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <span className="text-xs font-medium text-blue-600">
                                              {searchResult?.name
                                                ?.charAt(0)
                                                ?.toUpperCase()}
                                            </span>
                                          </div>
                                        )}

                                        <span className="text-gray-700 group-hover:text-gray-900 font-medium text-xs">
                                          {searchResult?.name} <br />
                                          {searchResult?.group?.name}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-4 py-6 text-center">
                                  {searchTerm.length < 2 ? (
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-gray-400 text-lg">
                                          🔍
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        Kamida 2 ta harf kiriting
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-yellow-600 text-lg">
                                          ✏️
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Xodim topilmadi
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Siz yozgan ism yuboriladi!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <span>👥</span>
                          <span>Xodimni tanlang</span>
                        </label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300"
                        >
                          <option value="">Xodimni tanlang...</option>
                          {employees.map((employee) => (
                            <option
                              key={employee.id}
                              value={String(employee.id)}
                            >
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </>

                <Input
                  type="text"
                  placeholder="Izoh"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 mt-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMinusDialogOpen(false);
                    setSelectedTarifCat("");
                    setSelectedTarif("");
                    setSelectedEmployee("");
                    setImagePreview(null);
                    setSelectedImage(null);
                    setDescription("");
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="py-7"
                  disabled={sending || !selectedImage || !selectedEmployee}
                  onClick={handleMinus}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Yaroqsiz deb belgilash"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center mt-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Tekshirish uchun OTK tarifikatsiya kiriting!
          </h3>
          <p className="text-red-600">Texnologga murojaat qiling!</p>
        </div>
      )}
    </div>
  );
};

export default OrderView;
