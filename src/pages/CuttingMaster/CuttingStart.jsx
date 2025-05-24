"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Box,
  Calendar,
  CheckCheck,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  PackageOpen,
  Ruler,
  Scissors,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const CuttingStart = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cuttingCount, setCuttingCount] = useState("");
  const [finishing, setFinishing] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [errors, setErrors] = useState({
    submodel: false,
    size: false,
    cuttingCount: false,
    boxCount: false,
  });

  const getOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
      if (response.data.order_model.submodels.length === 1) {
        setSelectedSubmodel(response.data.order_model.submodels[0].id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtmani yuklashda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  const validateForm = () => {
    const newErrors = {
      submodel: !selectedSubmodel,
      size: !selectedSize,
      cuttingCount: !cuttingCount,
      boxCount: !boxCount,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return false;
    }

    return true;
  };

  const handleCutting = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Barcha maydonlarni to'ldiring",
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    try {
      setIsSending(true);
      const response = await api.get(`/cuttingMaster/markAsCut`, {
        params: {
          order_id: id,
          quantity: cuttingCount,
          submodel_id: selectedSubmodel,
          size_id: selectedSize,
          box_capacity: boxCount,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${order?.id} ${order?.name} kesish.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Muvaffaqiyatli",
        description: "Kesish PDF fayli yuklab olindi",
        variant: "default",
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kesish PDF fayl yuklab bo'lmadi",
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFinish = async () => {
    if (!window.confirm("Buyurtmani yakunlashni tasdiqlaysizmi?")) return;
    setFinishing(true);
    try {
      await api.get(`/cuttingMaster/finishCutting/${id}`);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma yakunlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1500,
      });
      navigate("/cuttingMaster/cutting");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma yakunlashda xatolik",
        variant: "destructive",
      });
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Buyurtma #{order?.id}
            </CardTitle>
          </div>
          <CardDescription>{order?.name}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Buyurtma nomi:</span>
                <span className="font-medium">{order?.name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Miqdori:</span>
                <span className="font-medium">{order?.quantity} ta</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Box className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">
                  {order?.order_model?.model?.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <PackageOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Material:</span>
                <span className="font-medium">
                  {order?.order_model?.material?.name || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {order?.comment && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Izoh:</span>
                  <span className="font-medium">{order?.comment}</span>
                </div>
              )}

              {order?.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Boshlanish vaqti:
                  </span>
                  <span className="font-medium">
                    {order?.start_date
                      ?.split(" ")[0]
                      .split("-")
                      .reverse()
                      .join(".")}
                  </span>
                </div>
              )}

              {order?.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tugash vaqti:</span>
                  <span className="font-medium">
                    {order?.end_date
                      ?.split(" ")[0]
                      .split("-")
                      .reverse()
                      .join(".")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                Submodellar:
              </h3>
              <div className="flex flex-wrap gap-2">
                {order?.order_model?.submodels.map((submodel) => (
                  <Badge key={submodel.id} variant="secondary">
                    {submodel.submodel?.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                O'lchamlar:
              </h3>
              <div className="flex flex-wrap gap-2">
                {order?.order_model?.sizes.map((size) => (
                  <Badge key={size.id} variant="secondary">
                    {size.size?.name} ({size?.quantity} ta)
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleFinish} disabled={finishing}>
              {finishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck />
              )}
              Yakunlash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Kesish ma'lumotlari
          </CardTitle>
          <CardDescription>
            Kesish uchun kerakli ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="submodel" className="text-sm font-medium">
              Submodelni tanlang
              {errors.submodel && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {order?.order_model?.submodels.map((submodel) => (
                <Button
                  key={submodel.id}
                  onClick={() => {
                    setSelectedSubmodel(submodel.id);
                    setErrors({ ...errors, submodel: false });
                  }}
                  variant={
                    selectedSubmodel === submodel.id ? "default" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                >
                  {submodel.submodel?.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="size" className="text-sm font-medium">
              O'lchamni tanlang
              {errors.size && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {order?.order_model?.sizes.map((size) => (
                <Button
                  key={size.id}
                  onClick={() => {
                    setSelectedSize(size.id);
                    setErrors({ ...errors, size: false });
                  }}
                  variant={selectedSize === size.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  {size.size?.name} ({size?.quantity} ta)
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cutting_count" className="text-sm font-medium">
                Kesish soni
                {errors.cuttingCount && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Input
                id="cutting_count"
                type="number"
                placeholder="Kesish sonini kiriting"
                value={cuttingCount}
                onChange={(e) => {
                  setCuttingCount(e.target.value);
                  setErrors({ ...errors, cuttingCount: false });
                }}
                className={errors.cuttingCount ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="box_count" className="text-sm font-medium">
                Quti sig'imi
                {errors.boxCount && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Input
                id="box_count"
                type="number"
                placeholder="Quti sig'imini kiriting"
                value={boxCount}
                onChange={(e) => {
                  setBoxCount(e.target.value);
                  setErrors({ ...errors, boxCount: false });
                }}
                className={errors.boxCount ? "border-destructive" : ""}
              />
            </div>
          </div>

          {Object.values(errors).some((error) => error) && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Diqqat!</AlertTitle>
              <AlertDescription>
                Barcha kerakli maydonlarni to'ldiring
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCutting}
            disabled={isSending}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Kesish PDF yuklab olish
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CuttingStart;
