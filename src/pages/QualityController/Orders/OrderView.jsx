import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { statuses } from "@/lib/status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

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

  const totalQuantity = order?.quantity || 0;
  const goodCount = order?.good_count || 0;
  const progressPercent = totalQuantity
    ? Math.round((goodCount / totalQuantity) * 100)
    : 0;

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
    formData.append("employee_id", selectedEmployee);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
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
                setPlusDialogOpen(true);
              }}
              className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-green-500">
                {order?.good_count || 0}
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
                setMinusDialogOpen(true);
              }}
              className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-red-500">
                {order?.pending_fail_count || 0}
              </span>
              <span className="text-sm text-red-600">Yaroqsiz</span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <span className="font-medium">Jarayon holati</span>
          <span>
            {goodCount}/{totalQuantity} dona
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-green-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-600 font-medium">
          {progressPercent}% bajarilgan
        </div>
      </div>

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
            <Button className="py-7" disabled={sending} onClick={handlePlus}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Mahsulot yaroqsiz ekanligini tasdiqlaysizmi?
            </DialogTitle>
            <DialogDescription>
              Iltimos, yaroqsiz mahsulotning rasmini va izohini qo'shing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Image Upload/Camera Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rasm</label>

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
                    className="w-full rounded-lg border"
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
                      className="w-full rounded-lg border"
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
                      className="w-full cursor-crosshair touch-none"
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
              <Select
                value={selectedTarifCat}
                onValueChange={(value) => {
                  setSelectedTarifCat(value);
                  setSelectedTarif("");
                  setSelectedEmployee("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {order?.order_model?.submodels[0]?.tarification_categories?.map(
                    (category, index) => (
                      <SelectItem key={index} value={category.id}>
                        <div className="break-words whitespace-normal max-w-[250px] text-left">
                          {category.name}
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select
                value={selectedTarif}
                onValueChange={(value) => {
                  setSelectedTarif(value);
                  setSelectedEmployee(""); // Reset employee when tarif changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ishni tanlang" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {order?.order_model?.submodels[0]?.tarification_categories
                    ?.find((cat) => cat.id === selectedTarifCat)
                    ?.tarifications?.map((work, index) => (
                      <SelectItem key={index} value={work.id}>
                        <div className="break-words whitespace-normal max-w-[250px] text-left">
                          {work.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Selection Section */}
            {selectedTarif && (
              <>
                {(() => {
                  const employees = getAttachedEmployees(
                    order?.order_model?.submodels[0]?.tarification_categories
                      ?.find((cat) => cat.id === selectedTarifCat)
                      ?.tarifications?.find(
                        (tarif) => tarif.id === selectedTarif,
                      )?.tarification_logs,
                  );

                  // Auto-select if only one employee available
                  if (employees.length === 1 && !selectedEmployee) {
                    setSelectedEmployee(String(employees[0].id));
                  }

                  if (employees.length === 0) {
                    return (
                      <div className="text-gray-500 text-sm p-2 text-center bg-gray-50 rounded-lg">
                        Bu ishni bajargan hali hech kim bajarmagan
                      </div>
                    );
                  }

                  return (
                    <Select
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Xodimni tanlang" />
                      </SelectTrigger>

                      <SelectContent className="max-h-[250px] overflow-y-auto">
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={String(employee.id)}
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-6 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setMinusDialogOpen(false);
                setSelectedTarifCat("");
                setSelectedTarif("");
                setSelectedEmployee("");
                setImagePreview(null);
                setSelectedImage(null);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              className="py-7"
              disabled={sending || !selectedImage || !selectedTarif}
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
    </div>
  );
};

export default OrderView;
