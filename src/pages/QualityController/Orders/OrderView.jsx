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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Loader2,
  X,
  ChevronDown,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

const OrderView = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [minusDialogOpen, setMinusDialogOpen] = useState(false);
  const [qualityCheckResults, setQualityCheckResults] = useState(null);
  const [qualityDescription, setQualityDescription] = useState(null);
  const [qualityDescriptionDialogOpen, setQualityDescriptionDialogOpen] =
    useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQualityName, setEditQualityName] = useState("");
  const [editingQualityId, setEditingQualityId] = useState(null);
  const [qualityName, setQualityName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [minusForm, setMinusForm] = useState({
    order_sub_model_id: null,
    descriptions: [],
    comment: "",
    status: false,
  });

  const fetchOrderAndQuality = async () => {
    try {
      setIsLoading(true);
      const [orderRes, descRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
        api.get(`/qualityController/qualityDescription`),
      ]);

      setOrder(orderRes.data);
      setQualityDescription(descRes.data);

      const submodelId = orderRes.data?.order_model?.submodels[0]?.id;
      if (submodelId) {
        const qualityRes = await api.get(`/qualityController/qualityCheck`, {
          params: { order_sub_model_id: submodelId },
        });
        setQualityCheckResults(qualityRes.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingQualityId(item.id);
    setEditQualityName(item.description);
    setEditDialogOpen(true);
  };

  const handleQualityDescriptionEdit = async () => {
    try {
      await api.post(
        `/qualityController/qualityDescription/${editingQualityId}`,
        {
          _method: "PATCH",
          description: editQualityName,
        }
      );

      toast({
        title: "Muvaffaqiyatli!",
        description: "Tahrirlandi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      setEditDialogOpen(false);
      setEditQualityName("");
      setEditingQualityId(null);
      fetchOrderAndQuality();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Tahrirlashda xatolik yuz berdi",
      });
    }
  };

  const handlePlus = async () => {
    setQualityCheckResults((prev) => ({
      ...prev,
      qualityChecksTrue: (prev?.qualityChecksTrue || 0) + 1,
    }));

    try {
      await api.post(`/qualityController/qualitySuccessCheck`, {
        order_sub_model_id: order?.order_model?.submodels[0]?.id,
        status: true,
      });

      toast({
        title: "Muvaffaqiyatli!",
        description: "Sifat nazoratidan muvaffaqiyatli o'tdi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      setQualityCheckResults((prev) => ({
        ...prev,
        qualityChecksTrue: (prev?.qualityChecksTrue || 1) - 1,
      }));

      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Sifat nazoratidan o'tishda xatolik",
      });
    }
  };

  const handleMinus = async () => {
    minusForm.order_sub_model_id = order?.order_model?.submodels[0]?.id;
    if (!minusForm.order_sub_model_id || !minusForm.descriptions.length) {
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
      formData.append(
        "descriptions",
        JSON.stringify(minusForm.descriptions.map((desc) => desc.id))
      );
      formData.append("comment", minusForm.comment);
      formData.append("status", false);
      formData.append("order_sub_model_id", minusForm.order_sub_model_id);
      if (minusForm.image) {
        formData.append("image", minusForm.image);
      }
      setIsSending(true);

      await api.post("/qualityController/qualityFailureCheck", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the quality check results count
      setQualityCheckResults((prev) => ({
        ...prev,
        qualityChecksFalse: (prev?.qualityChecksFalse || 0) + 1,
      }));

      toast({
        title: "Muvaffaqiyatli!",
        description: "Sifat nazoratidan nosozlik qo'shildi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Reset form state
      setMinusForm({
        order_sub_model_id: null,
        descriptions: [],
        comment: "",
        status: false,
      });

      // Close dialog only after successful submission
      setMinusDialogOpen(false);

      // Refresh data
      fetchOrderAndQuality();
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

  const handleQualityDescriptionPlus = async () => {
    try {
      await api.post(`/qualityController/qualityDescription`, {
        description: qualityName,
      });
      toast({
        title: "Muvaffaqiyatli!",
        description: "Qo'shildi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setQualityName("");
      fetchOrderAndQuality();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Qo'shishda xatolik",
      });
    }
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

      // Wait for next render when video element will be available
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
      } else {
        // If video element is still not available, cleanup
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Video element not available after stream");
      }
    } catch (err) {
      console.error("Camera error:", err);
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

  useEffect(() => {
    fetchOrderAndQuality();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
        className="bg-white rounded-2xl shadow-lg mt-6"
      >
        <motion.div
          className="p-6 cursor-pointer select-none"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Buyurtma Tafsilotlari
            </h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {[
                    { label: "Nomi", value: order?.name },
                    {
                      label: "Submodel",
                      value: order?.order_model?.submodels[0]?.submodel?.name,
                    },
                    { label: "Status", value: statuses[order?.status]?.text },
                    { label: "Miqdori", value: order?.quantity },
                    { label: "Model", value: order?.order_model?.model?.name },
                    {
                      label: "Material",
                      value: order?.order_model?.material?.name || "-",
                    },
                    {
                      label: "Tikkan gurux",
                      value:
                        order?.order_model?.submodels[0]?.group?.group?.name ||
                        "-",
                    },
                    {
                      label: "O'lchamlar",
                      value: order?.order_model?.sizes
                        ?.map((size) => size.size.name)
                        .join(", "),
                    },
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
              onClick={() => setPlusDialogOpen(true)}
              className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-green-500">
                {qualityCheckResults?.qualityChecksTrue ?? 0}
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
              onClick={() => setMinusDialogOpen(true)}
              className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-red-500">
                {qualityCheckResults?.qualityChecksFalse ?? 0}
              </span>
              <span className="text-sm text-red-600">Nosoz</span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 bg-white rounded-2xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Nosozliklar</h2>
          <Button
            onClick={() => setQualityDescriptionDialogOpen(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Qo'shish</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {qualityDescription?.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                className="group relative"
              >
                <div
                  onClick={() => handleEditClick(item)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{item.description}</span>
                  <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Tahrirlash</DialogTitle>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Yangi nomi"
                value={editQualityName}
                onChange={(e) => setEditQualityName(e.target.value)}
                className="w-full"
              />
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 justify-end w-full">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleQualityDescriptionEdit}>Saqlash</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Tasdiqlaysizmi?</DialogTitle>
            <DialogDescription className="mt-2">
              Mahsulot sifatli ekanligini tasdiqlashga rozimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 justify-end w-full">
              <DialogClose asChild>
                <Button variant="outline">Yo'q</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handlePlus}>Roziman</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={minusDialogOpen} onOpenChange={setMinusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Nosozlik qo'shish</DialogTitle>
            <DialogDescription className="mt-2">
              Brak mahsulotlar shu yerda kiritiladi
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
              {qualityDescription?.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all",
                      minusForm.descriptions.includes(item)
                        ? "bg-primary text-white"
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                    onClick={() => {
                      if (minusForm.descriptions.includes(item)) {
                        setMinusForm({
                          ...minusForm,
                          descriptions: minusForm.descriptions.filter(
                            (desc) => desc !== item
                          ),
                        });
                        return;
                      }
                      setMinusForm({
                        ...minusForm,
                        descriptions: [...minusForm.descriptions, item],
                      });
                    }}
                  >
                    <div>{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Input
              className="mt-4"
              type="text"
              placeholder="Izoh"
              value={minusForm.comment}
              onChange={(e) =>
                setMinusForm({ ...minusForm, comment: e.target.value })
              }
            />
            <div className="mt-6 space-y-4">
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
                      {/* Close button */}
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

                      {/* Camera preview */}
                      <div className="flex-1 relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>

                      {/* Camera controls */}
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                      >
                        O'chirish
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 justify-end w-full">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <Button
                onClick={() => handleMinus()}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qualityDescriptionDialogOpen}
        onOpenChange={setQualityDescriptionDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Qo'shish</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Nomi"
              value={qualityName}
              onChange={(e) => setQualityName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 justify-end w-full">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => handleQualityDescriptionPlus()}>
                  Qo'shish
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
