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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

const engNames = {
  astar: "intermediate",
  tana: "body",
  finish: "final",
};

const objKeyNames = {
  astar: ["good_intermediate_count", "fail_intermediate_count"],
  tana: ["good_body_count", "fail_body_count"],
  finish: ["good_final_count", "fail_final_count"],
};

const namesObject = {
  astar: "OTK Astar",
  tana: "OTK Tana",
  finish: "OTK Finish",
};

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
  const [searchTerm, setSearchTerm] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [selectedOtkType, setSelectedOtkType] = useState(
    localStorage.getItem("selectedOtkType") || null,
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const getEmployees = async () => {
    if (debouncedSearchTerm.length < 2) return;
    try {
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
        description: "Xodimlar ma'lumotlari yuklanmadi",
      });
      return [];
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
        tarification_id: getOtkTarif(selectedOtkType)?.id,
        inspection_stage: engNames[selectedOtkType],
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
        description: "Yuborishda xatolik yuz berdi",
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
    formData.append("tarification_id", selectedTarif);
    formData.append(
      "employee_id",
      selectedEmployee || selectedSearchResult?.id || "",
    );
    const descriptionText = selectedEmployee
      ? `${description}`
      : `${description} ${searchTerm}`;

    formData.append("description", descriptionText);
    formData.append("inspection_stage", engNames[selectedOtkType]);

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
        description: "Yuborishda xatolik yuz berdi",
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

  const getOtkTarif = (key) => {
    const actualName = namesObject[key];
    if (!actualName) return null;

    const submodel = order?.order_model?.submodels?.[0];
    if (!submodel) return null;

    const otkCategory = submodel.tarification_categories?.find(
      (category) => category.name === "OTK",
    );

    if (!otkCategory) return null;

    return otkCategory.tarifications?.find(
      (tarif) => tarif.name === actualName,
    );
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
              <div className="text-2xl font-semibold text-gray-800">
                {order?.name}
              </div>
              <div className="font-semibold text-gray-800">
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
              <div className="flex gap-2">
                {[
                  {
                    key: "astar",
                    label: "Astar",
                    number: "1",
                    color: "blue",
                  },
                  {
                    key: "tana",
                    label: "Tana",
                    number: "2",
                    color: "green",
                  },
                  {
                    key: "finish",
                    label: "Finish",
                    number: "3",
                    color: "purple",
                  },
                ].map((item) => {
                  const tarif = getOtkTarif(item.key);
                  const isSelected = selectedOtkType === item.key;

                  return (
                    <motion.div
                      key={item.key}
                      whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedOtkType(item.key);
                        localStorage.setItem("selectedOtkType", item.key);
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
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
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
                          {item.number}
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
                            {item.label}
                          </h4>

                          {tarif?.summa && (
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
                              {tarif.summa.toLocaleString()} so'm
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6">
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
                    setPlusDialogOpen(true);
                  }}
                  className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-4xl sm:text-5xl font-bold text-green-500">
                    {selectedOtkType
                      ? order?.[objKeyNames[selectedOtkType][0]] || 0
                      : 0}
                  </span>
                  <span className="text-sm text-green-600">Sifatli</span>
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
                    setMinusDialogOpen(true);
                    setDescription("");
                    setSearchTerm("");
                    setSearchResults([]);
                    setSelectedSearchResult(null);
                  }}
                  className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-4xl sm:text-5xl font-bold text-red-500">
                    {selectedOtkType
                      ? order?.[objKeyNames[selectedOtkType][1]] || 0
                      : 0}
                  </span>
                  <span className="text-sm text-red-600">Yaroqsiz</span>
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
                  disabled={sending}
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
                <div className="flex items-center gap-2">
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
                      setSelectedEmployee(""); // Reset employee when tarif changes
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
                </div>

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
                        <div>
                          <Input
                            type="text"
                            placeholder="Xodim ismini kiriting"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                            }}
                          />
                          <div className="max-h-40 overflow-y-auto border rounded-md">
                            {selectedSearchResult?.name ? (
                              <div className="px-3 py-2 bg-green-50 border-b">
                                <div className="font-medium text-green-800">
                                  Tanlangan: {selectedSearchResult.name}
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedSearchResult(null);
                                    setSelectedEmployee("");
                                    setSearchTerm("");
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 mt-1"
                                >
                                  O'zgartirish
                                </button>
                              </div>
                            ) : searchResults?.length > 0 ? (
                              searchResults?.map((searchResult, index) => (
                                <div
                                  key={index}
                                  onClick={() => {
                                    setSelectedEmployee(
                                      String(searchResult.id),
                                    );
                                    setSelectedSearchResult(searchResult);
                                  }}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                                >
                                  {searchResult?.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                {searchTerm.length < 3
                                  ? "Kamida 2 ta harf kiriting"
                                  : "Xodim topilmadi, siz yozgan ism yuboriladi!"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Xodimni tanlang</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={String(employee.id)}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
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
                  disabled={sending || !selectedImage}
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
