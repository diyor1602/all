"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronDown,
  Camera,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [qualityCheckResults, setQualityCheckResults] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [tarifications, setTarifications] = useState([]);
  const [tarifOpen, setTarifOpen] = useState(false);
  const [tarifValue, setTarifValue] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [minusForm, setMinusForm] = useState({
    order_sub_model_id: null,
    tarification_id: null,
    comment: "",
    status: false,
  });

  const fetchOrderAndQuality = async () => {
    try {
      setIsLoading(true);
      const [orderRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
      ]);

      setOrder(orderRes.data);

      const submodelId = orderRes.data?.order_model?.submodels[0]?.id;
      if (submodelId) {
        const qualityRes = await api.get(`/qualityController/qualityCheck`, {
          params: { order_sub_model_id: submodelId },
        });
        setQualityCheckResults(qualityRes.data);
        setTarifications(
          orderRes.data?.order_model?.submodels[0]?.tarification_categories ||
            []
        );
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

  const resetImageAndForm = () => {
    setImagePreview(null);
    setMinusForm({
      order_sub_model_id: null,
      tarification_id: null,
      comment: "",
      status: false,
    });
  };

  const handleDialogClose = (open) => {
    if (!open) {
      resetImageAndForm();
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
              {order?.order_model?.submodels[0]?.submodel?.name || "Buyurtma"}
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
              onClick={() => navigate(`/qualityController/orders/${id}/minus`)}
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
    </div>
  );
};

export default OrderView;
