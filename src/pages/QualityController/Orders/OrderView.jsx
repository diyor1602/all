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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Camera,
  Upload,
  Edit3,
  Download,
  Palette,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(3);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const [orderRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
      ]);

      setOrder(orderRes.data);
    } catch (error) {
      console.log(error);
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
      setDescription("");
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    setIsEditing(false);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
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
            setDescription("");
            setUseCamera(false);
            if (cameraStream) {
              cameraStream.getTracks().forEach((track) => track.stop());
              setCameraStream(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-2xl">
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUseCamera(true);
                      startCamera();
                    }}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Kameradan olish
                  </Button>

                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload").click()
                      }
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Faylni tanlash
                    </Button>
                  </div>
                </div>
              )}

              {useCamera && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUseCamera(false);
                        stopCamera();
                      }}
                    >
                      Bekor qilish
                    </Button>
                  </div>
                </div>
              )}

              {imagePreview && !isEditing && (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={startEditing}
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
                <div className="space-y-2">
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
                      className="w-full max-h-64 cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopEditing}
                      className="flex-1"
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      type="button"
                      onClick={saveEditedImage}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Saqlash
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Izoh
              </label>
              <Textarea
                id="description"
                placeholder="Yaroqsizlik sababini tavsiflang..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setMinusDialogOpen(false);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              className="py-7"
              disabled={sending || !selectedImage || !description.trim()}
              onClick={handleMinus}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <XCircle className="mr-2" /> Yaroqsiz deb belgilash
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
