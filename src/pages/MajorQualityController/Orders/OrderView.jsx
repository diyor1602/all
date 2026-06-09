import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  XCircle,
  Loader2,
  ChevronDown,
  Camera,
  Edit3,
  Palette,
  RotateCcw,
  Package,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OrderView = () => {
  const { toast } = useToast();

  // ── Order selection ─────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSelectOpen, setOrderSelectOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState(
    localStorage.getItem("otkSearchQuery") || "",
  );
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ── Order detail ────────────────────────────────────────────────────
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // ── Minus dialog ────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const [minusDialogOpen, setMinusDialogOpen] = useState(false);

  // ── Image / camera ──────────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [availableCameras, setAvailableCameras] = useState([]);

  // ── Drawing editor ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(3);

  // ── Employee search ─────────────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [description, setDescription] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOtkTarifs, setSelectedOtkTarifs] = useState({});

  const canvasRef = useRef(null);
  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastPreviewUrlRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // ── Fetch orders list ───────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await api.get("/majorQualityController/orders");
      setOrders(response.data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch orders" });
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Fetch order detail ──────────────────────────────────────────────
  const fetchOrder = async (id) => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/majorQualityController/orders/${id}`);
      setOrder(res.data);
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(selectedOrderId);
  }, [selectedOrderId]);

  // ── Employee search ─────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) return;
    const run = async () => {
      try {
        setIsSearching(true);
        const res = await api.get("/majorQualityController/employees", {
          params: { search: debouncedSearchTerm, status: "working" },
        });
        setSearchResults(res.data?.data);
      } catch {
        toast({ variant: "destructive", title: "Xatolik", description: "Xodimlarni qidirishda xatolik yuz berdi" });
      } finally {
        setIsSearching(false);
      }
    };
    run();
  }, [debouncedSearchTerm]);

  // ── Camera effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (minusDialogOpen && useCamera) startCamera();
  }, [minusDialogOpen]);

  useEffect(() => {
    if (minusDialogOpen && useCamera) startCamera();
    if (!useCamera) stopCamera();
  }, [useCamera]);

  // ── Image preview URL cleanup ───────────────────────────────────────
  useEffect(() => {
    if (lastPreviewUrlRef.current && lastPreviewUrlRef.current !== imagePreview) {
      URL.revokeObjectURL(lastPreviewUrlRef.current);
    }
    if (imagePreview?.startsWith("blob:")) {
      lastPreviewUrlRef.current = imagePreview;
    } else {
      lastPreviewUrlRef.current = null;
    }
    return () => {
      if (lastPreviewUrlRef.current) {
        URL.revokeObjectURL(lastPreviewUrlRef.current);
        lastPreviewUrlRef.current = null;
      }
    };
  }, [imagePreview]);

  // ── Drawing editor outside-click / escape ───────────────────────────
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape" && isEditing) stopEditing(); };
    const handleClickOutside = (e) => {
      if (isEditing && editorRef.current && !editorRef.current.contains(e.target)) stopEditing();
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

  // ── Order list helpers ──────────────────────────────────────────────
  const doesHaveOtk = (o) =>
    o.order_model?.sub_models[0]?.tarification_categories?.find((c) => c.name === "OTK");

  const filteredOrders = orders
    .filter((o) => {
      const s = orderSearchQuery.toLowerCase();
      return (
        o.id.toString().includes(s) ||
        o.name.toLowerCase().includes(s) ||
        o.order_model?.model?.name.toLowerCase().includes(s) ||
        (o.order_model?.material?.name || "").toLowerCase().includes(s) ||
        o.order_model?.sub_models[0]?.submodel?.name.toLowerCase().includes(s)
      );
    })
    .filter(doesHaveOtk)
    .sort((a, b) => {
      const pA = a.quantity > 0 ? (a.good_count / a.quantity) * 100 : 0;
      const pB = b.quantity > 0 ? (b.good_count / b.quantity) * 100 : 0;
      const aIn = pA > 0 && pA < 100;
      const bIn = pB > 0 && pB < 100;
      if (aIn && !bIn) return -1;
      if (!aIn && bIn) return 1;
      return pB - pA;
    });

  const handleSelectOrder = (o) => {
    setSelectedOrderId(o.id);
    setOrderSelectOpen(false);
    setIsDetailsOpen(false);
  };

  // ── Minus submit ────────────────────────────────────────────────────
  const handleMinus = async () => {
    setSending(true);
    const baseOffenders = Object.values(selectedOtkTarifs)
      .filter((item) => item.selected && item.employee)
      .map((item) => ({ employee_id: item.employee }));

    const hasSelected =
      selectedEmployee !== null &&
      selectedEmployee !== undefined &&
      String(selectedEmployee).trim() !== "";

    const offenders =
      hasSelected && !baseOffenders.some((o) => o.employee_id === selectedEmployee)
        ? [...baseOffenders, { employee_id: selectedEmployee }]
        : baseOffenders;

    const formData = new FormData();
    formData.append("order_id", selectedOrderId);
    formData.append("description", description);
    formData.append("image", selectedImage);
    offenders.forEach((o, i) =>
      formData.append(`offenders[${i}][employee_id]`, o.employee_id),
    );

    try {
      await api.post("/majorQualityController/majorQualityControls", formData);
      setMinusDialogOpen(false);
      toast({ title: "Tekshirildi", duration: 1000 });
      fetchOrder(selectedOrderId);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedEmployee("");
      setSelectedOtkTarifs({});
      setUseCamera(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Yuborishda xatolik yuz berdi" });
    } finally {
      setSending(false);
    }
  };

  // ── Camera helpers ──────────────────────────────────────────────────
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableCameras(devices.filter((d) => d.kind === "videoinput"));
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Kameraga ulanib bo'lmadi" });
    }
  };

  const startCamera = async () => {
    try {
      await getAvailableCameras();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Kameraga ulanib bo'lmadi" });
    }
  };

  const switchCamera = async () => {
    stopCamera();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Kamerani almashtirib bo'lmadi" });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  // ── Image helpers ───────────────────────────────────────────────────
  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast({ variant: "destructive", title: "Xatolik", description: "Faqat rasm fayllarni yuklash mumkin" });
      return;
    }
    stopCamera();
    setUseCamera(false);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onFileInputChange = (e) => {
    handleImageFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDropImage = (e) => {
    e.preventDefault();
    handleImageFile(e.dataTransfer?.files?.[0]);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setUseCamera(false);
      stopCamera();
    });
  };

  // ── Drawing helpers ─────────────────────────────────────────────────
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
    if (isEditing) saveEditedImage();
    else setIsEditing(false);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

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
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], "edited-image.jpg", { type: "image/jpeg" });
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsEditing(false);
    });
  };

  // ── OTK helpers ─────────────────────────────────────────────────────
  const otkCategory = order?.order_model?.submodels[0]?.tarification_categories?.find(
    (cat) => cat?.name === "OTK",
  );

  const getUniqueEmployees = (tarifName) => {
    const logs =
      otkCategory?.tarifications?.find((t) => t.name === tarifName)
        ?.tarification_logs || [];
    return [...new Map(logs.map((log) => [log.employee?.id, log])).values()];
  };

  const hasEmptyEmployee = Object.values(selectedOtkTarifs).some(
    (item) => item.selected && !item.employee,
  );

  // ── Skeleton ────────────────────────────────────────────────────────
  const OrderSkeleton = () => (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl border shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="border-b pb-3">
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto space-y-6">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setOrderSelectOpen(true)} className="gap-2">
          <Package className="w-4 h-4" />
          {selectedOrderId ? "Buyurtmani o'zgartirish" : "Buyurtma tanlash"}
        </Button>
        {order && !isLoading && (
          <span className="text-sm text-muted-foreground">
            <span className="font-medium">{order.name}</span>
            {" · "}
            <span>{order.order_model?.sub_models[0]?.submodel?.name}</span>
          </span>
        )}
      </div>

      {/* ── Order select dialog ── */}
      <Dialog open={orderSelectOpen} onOpenChange={setOrderSelectOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Buyurtma tanlash</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
            <Input
              placeholder="Qidirish..."
              value={orderSearchQuery}
              onChange={(e) => {
                setOrderSearchQuery(e.target.value);
                localStorage.setItem("otkSearchQuery", e.target.value);
              }}
              className="pl-10 bg-white"
            />
          </div>

          <div className="overflow-y-auto flex-1 pr-1">
            {loadingOrders ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <OrderSkeleton key={i} />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Buyurtmalar topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((o, i) => {
                  const isCompleted =
                    o.quantity > 0 && (o.good_count / o.quantity) * 100 >= 100;
                  const isSelected = o.id === selectedOrderId;
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectOrder(o)}
                      className={`flex flex-col gap-3 bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary ${
                        isSelected ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono text-muted-foreground">
                            #{o.id}
                          </span>
                        </div>
                        <Badge
                          variant={isCompleted ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {statuses[o.status]?.text}
                        </Badge>
                      </div>

                      <div className="border-b pb-3">
                        <h3 className="text-base font-semibold text-primary">
                          {o.order_model?.sub_models[0]?.submodel?.name || "No Submodel"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {o.order_model?.model?.name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nomi:</span>
                          <span className="text-sm font-medium">{o.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Jami miqdor:</span>
                          <span className="text-sm font-semibold">{o.quantity} dona</span>
                        </div>
                        {o?.good_by_stage?.length > 0 && (
                          <div className="flex items-center flex-wrap gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {o.good_by_stage.map((stage, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <CircularProgress
                                  value={
                                    o.quantity > 0
                                      ? ((stage?.count || 0) / o.quantity) * 100
                                      : 0
                                  }
                                  size={45}
                                  strokeWidth={3}
                                />
                                <div className="text-center">
                                  <div className="text-xs font-medium text-gray-700">
                                    {stage?.tarification?.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {stage?.count || 0}/{o.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Empty state ── */}
      {!selectedOrderId && (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Buyurtma tanlanmagan</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yuqoridagi tugmani bosib buyurtma tanlang
          </p>
        </div>
      )}

      {/* ── Order view ── */}
      {selectedOrderId && (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : order && (
          <div className="max-w-4xl mx-auto">
            {/* Order info accordion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg"
            >
              <motion.div
                className="p-6 cursor-pointer select-none"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-800">{order?.name}</div>
                    <div className="font-semibold text-gray-800">
                      {order?.order_model?.sub_models[0]?.submodel?.name || "Buyurtma"}
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

            {/* OTK section */}
            {otkCategory ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 py-8 bg-white rounded-2xl shadow-lg"
                >
                  <div className="grid grid-cols-1 px-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <button
                        onClick={() => {
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
                          {order?.major_count || 0}
                        </span>
                        <span className="text-sm text-red-600">Yaroqsiz</span>
                      </button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* ── Minus dialog ── */}
                <Dialog
                  open={minusDialogOpen}
                  onOpenChange={(open) => {
                    setMinusDialogOpen(open);
                    if (!open) {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setUseCamera(false);
                      if (cameraStream) {
                        cameraStream.getTracks().forEach((t) => t.stop());
                        setCameraStream(null);
                      }
                    }
                  }}
                >
                  <DialogContent className="max-w-2xl max-h-[95vh] overflow-auto">
                    <div className="space-y-4 mt-4">
                      {/* Image / camera */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={useCamera ? "default" : "outline"}
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                              setIsEditing(false);
                              setUseCamera(true);
                            }}
                            className="flex-1"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Kamera
                          </Button>
                          <Button
                            type="button"
                            variant={!useCamera ? "default" : "outline"}
                            onClick={() => {
                              stopCamera();
                              setIsEditing(false);
                              setUseCamera(false);
                            }}
                            className="flex-1"
                          >
                            Rasm tanlash
                          </Button>
                        </div>

                        {!useCamera && !imagePreview && (
                          <div
                            className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDropImage}
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                fileInputRef.current?.click();
                            }}
                          >
                            <div className="text-sm text-gray-600">
                              Rasmni shu yerga tashlang yoki bosib tanlang
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={onFileInputChange}
                            />
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
                              <Button type="button" onClick={capturePhoto} className="flex-1">
                                <Camera className="w-4 h-4 mr-2" />
                                Rasmga olish
                              </Button>
                              {availableCameras.length > 1 && (
                                <Button type="button" variant="outline" onClick={switchCamera}>
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
                              <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
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

                      {/* OTK tarifications */}
                      <div className="flex flex-col gap-3">
                        {order?.order_model?.submodels[0]?.tarification_categories
                          ?.find((cat) => cat?.name === "OTK")
                          ?.tarifications?.map((tarif, index) => {
                            const employees = getUniqueEmployees(tarif?.name);
                            const isDisabled = employees.length === 0;
                            const singleEmployeeId =
                              employees.length === 1
                                ? String(employees?.[0]?.employee?.id ?? "")
                                : "";
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <Button
                                  variant={
                                    selectedOtkTarifs?.[tarif?.name]?.selected
                                      ? "default"
                                      : "outline"
                                  }
                                  disabled={isDisabled}
                                  onClick={() =>
                                    setSelectedOtkTarifs((prev) => ({
                                      ...prev,
                                      [tarif?.name]: {
                                        selected: !prev[tarif?.name]?.selected,
                                        employee: !prev[tarif?.name]?.selected
                                          ? singleEmployeeId || null
                                          : null,
                                      },
                                    }))
                                  }
                                >
                                  {tarif?.name.charAt(0).toUpperCase() +
                                    tarif?.name.slice(1)}
                                </Button>
                                {selectedOtkTarifs?.[tarif?.name]?.selected ? (
                                  <select
                                    value={
                                      selectedOtkTarifs?.[tarif?.name]?.employee || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedOtkTarifs((prev) => ({
                                        ...prev,
                                        [tarif?.name]: {
                                          ...prev[tarif?.name],
                                          employee: e.target.value,
                                        },
                                      }))
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="">Xodim tanlanmagan</option>
                                    {employees.map((log) => (
                                      <option
                                        key={log.employee?.id}
                                        value={log.employee?.id}
                                      >
                                        {log.employee?.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  "-"
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {/* Employee search */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Xodim ismini kiriting..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10 border-gray-200 focus:border-blue-400 focus:ring-blue-100 transition-all duration-200"
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            </div>
                          )}
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                          {selectedSearchResult?.name ? (
                            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {selectedSearchResult?.img ? (
                                    <img
                                      src={selectedSearchResult.img}
                                      className="w-8 h-8 shrink-0 object-cover rounded-full"
                                      alt=""
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-blue-600">
                                        {selectedSearchResult.name?.charAt(0)?.toUpperCase()}
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
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                >
                                  O'zgartirish
                                </button>
                              </div>
                            </div>
                          ) : isSearching ? (
                            <div className="px-4 py-8 text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Xodimlar qidirilmoqda...</p>
                            </div>
                          ) : searchResults?.length > 0 ? (
                            <div className="py-1">
                              {searchResults.map((result, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSelectedEmployee(String(result.id));
                                    setSelectedSearchResult(result);
                                  }}
                                  className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 last:border-b-0 transition-all group"
                                >
                                  <div className="flex items-center space-x-3">
                                    {result?.img ? (
                                      <img
                                        src={result.img}
                                        className="w-8 h-8 object-cover shrink-0 rounded-full"
                                        alt=""
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <span className="text-xs font-medium text-blue-600">
                                          {result?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-gray-700 group-hover:text-gray-900 font-medium text-xs">
                                      {result?.name} <br />
                                      {result?.group?.name}
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
                                    <span className="text-gray-400 text-lg">🔍</span>
                                  </div>
                                  <p className="text-sm text-gray-500">Kamida 2 ta harf kiriting</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-yellow-600 text-lg">✏️</span>
                                  </div>
                                  <p className="text-sm text-gray-600">Xodim topilmadi</p>
                                  <p className="text-xs text-gray-500">
                                    Siz yozgan ism yuboriladi!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

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
                        disabled={sending || !selectedImage || hasEmptyEmployee}
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
        )
      )}
    </div>
  );
};

export default OrderView;
