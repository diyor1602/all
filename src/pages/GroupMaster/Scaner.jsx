import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  Scan,
  Check,
  X,
  ShoppingBag,
  Info,
  AlertCircle,
  Camera,
  CameraOff,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const Scaner = () => {
  const [cameraId, setCameraId] = useState("environment");
  const { toast } = useToast();
  const [orderId, setOrderId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [orderCuts, setOrderCuts] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  const validateAndProcessQR = (qrData) => {
    const qrDataArray = qrData.split(",");
    if (qrDataArray.length === 2) {
      setOrderId(qrDataArray[0]);
      setCategoryId(qrDataArray[1]);

      toast({
        title: "Muvaffaqiyatli!",
        description: "QR kod o'qildi",
        variant: "default",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } else {
      toast({
        title: "Diqqat!",
        description: "QR kod formati noto'g'ri",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (orderId && categoryId) {
      handleSubmit(orderId, categoryId);
    }
  }, [orderId, categoryId]);

  const handleSubmit = async (orderId, categoryId) => {
    setIsApplying(true);
    try {
      const response = await api.get("groupMaster/orderCuts/show", {
        params: {
          order_id: orderId,
          category_id: categoryId,
        },
      });
      setOrderCuts(response.data);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "QR kodda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleAccept = async (cutId) => {
    try {
      await api.post(`groupMaster/orderCuts/${cutId}`);
      toast({
        title: "Muvaffaqiyatli!",
        description: "Qabul qilindi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      handleSubmit(orderId, categoryId);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Qabul qilishda xatolik",
        variant: "destructive",
      });
    }
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  const switchCamera = () => {
    const newMode = cameraId === "environment" ? "user" : "environment";
    setCameraId(newMode);
    toast({
      title: newMode === "environment" ? "Orqa kamera" : "Old kamera",
      variant: "default",
      duration: 2000,
    });
  };

  const resetScan = () => {
    setOrderId(null);
    setCategoryId(null);
    setOrderCuts(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">QR Scanner</h1>
        <p className="text-muted-foreground">Scan QR codes to manage orders</p>
      </motion.div>

      <div className="grid grid-cols-1  gap-6">
        <motion.div layout className="flex flex-col items-center">
          <Card className="w-full max-w-md shadow-lg border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Scan className="text-primary" size={20} />
                  <span>QR Skanerlash</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleCamera}
                  className="rounded-full"
                >
                  {cameraActive ? (
                    <CameraOff size={18} />
                  ) : (
                    <Camera size={18} />
                  )}
                </Button>
              </div>
              <CardDescription>
                Buyurtma ma'lumotlarini olish uchun QR kodni skanerlang
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <AnimatePresence mode="wait">
                {cameraActive ? (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <Scanner
                      onScan={(result) =>
                        result && validateAndProcessQR(result[0].rawValue)
                      }
                      className="rounded-lg overflow-hidden"
                      style={{ width: "100%", height: "400px" }}
                      constraints={{
                        facingMode: cameraId,
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="camera-off"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg"
                  >
                    <CameraOff
                      size={48}
                      className="text-muted-foreground mb-4"
                    />
                    <p className="text-center text-muted-foreground">
                      Kamera yoqilmagan
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={toggleCamera}
                    >
                      <Camera size={16} className="mr-2" />
                      Kamerani yoqish
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-primary/10 to-secondary/10 flex justify-between pt-3">
              <Button
                variant="outline"
                onClick={resetScan}
                className="bg-background hover:bg-background/80"
              >
                <RefreshCcw size={16} className="mr-2" />
                Yangilash
              </Button>
              <Button
                variant="secondary"
                onClick={switchCamera}
                className="bg-background hover:bg-background/80"
                disabled={!cameraActive}
              >
                <RefreshCcw size={16} className="mr-2" />
                {cameraId === "environment" ? "Old kamera" : "Orqa kamera"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <AnimatePresence>
            {isApplying && !orderCuts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="w-full">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {orderCuts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="w-full border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="text-primary" size={20} />
                      <CardTitle>Buyurtma Tafsilotlari</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary"
                        >
                          Nomi
                        </Badge>
                        <span className="font-medium">
                          {orderCuts?.name}{" "}
                          <span className="text-primary">#{orderCuts?.id}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Miqdori</Badge>
                        <span className="font-medium">
                          {orderCuts?.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-500 mb-2"
                      >
                        Izoh
                      </Badge>
                      <p className="text-muted-foreground p-2 bg-muted rounded">
                        {orderCuts?.comment || "Izoh mavjud emas"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4 space-y-3">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <Info size={18} />
                    Kesimlar
                  </h3>

                  <AnimatePresence>
                    {orderCuts?.order_cuts?.map((cut, index) => (
                      <motion.div
                        key={cut.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={cn("w-full border-l-4", {
                            "border-l-green-500 bg-green-50": cut?.status,
                            "border-l-amber-500 bg-amber-50": !cut?.status,
                          })}
                        >
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn({
                                    "bg-green-100 text-green-800 hover:bg-green-100":
                                      cut?.status,
                                    "bg-amber-100 text-amber-800 hover:bg-amber-100":
                                      !cut?.status,
                                  })}
                                >
                                  {cut?.category?.name}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-background"
                                >
                                  {cut?.quantity} dona
                                </Badge>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn({
                                  "bg-green-100 text-green-800": cut?.status,
                                  "bg-amber-100 text-amber-800": !cut?.status,
                                })}
                              >
                                {cut?.status ? (
                                  <span className="flex items-center gap-1">
                                    <Check size={14} />
                                    Qabul qilingan
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <X size={14} />
                                    Qabul qilinmagan
                                  </span>
                                )}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground mb-3">
                              {cut?.status
                                ? "Qabul qilgan xodim: "
                                : "Kesgan xodim: "}{" "}
                              <span className="font-medium text-foreground">
                                {cut?.user?.employee?.name || "Ma'lumot yo'q"}
                              </span>
                            </div>

                            {!cut?.status && (
                              <Button
                                onClick={() => handleAccept(cut?.id)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                disabled={isApplying}
                              >
                                {isApplying ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    Qabul qilinmoqda
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Check size={16} />
                                    Qabul qilish
                                  </div>
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {!orderCuts && !isApplying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Yo'riqnoma</AlertTitle>
                  <AlertDescription>
                    Buyurtma ma'lumotlarini ko'rish uchun QR kodni skanerlang.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Scaner;
