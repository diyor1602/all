import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Box,
  FileText,
  History,
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
import { Skeleton } from "@/components/ui/skeleton";
import formatNumber from "@/utils/formatNumber";

const CuttingStart = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cuttingCount, setCuttingCount] = useState("");
  const [cuttingDate, setCuttingDate] = useState("");

  const [cuts, setCuts] = useState([]);

  const getOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
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

  const getCuts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cuttingMaster/cuts/${id}`);
      setCuts(response.data);
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
    getCuts();
  }, [id]);

  const handleCutting = async () => {
    if (!cuttingCount || cuttingCount <= 0) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Mahsulot miqdorini kiriting",
      });
      return;
    }

    const availableQuantity =
      order?.quantity -
      cuts?.reduce((total, cut) => total + Number(cut.quantity), 0);

    if (Number(cuttingCount) > Number(availableQuantity)) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description:
          "Kesish soni buyurtma sonidan ko'proq bo'lishi mumkin emas",
      });
      return;
    }

    try {
      setIsSending(true);
      await api.get(`/cuttingMaster/markAsCut`, {
        params: {
          order_id: id,
          quantity: cuttingCount,
          date: cuttingDate,
        },
        responseType: "blob",
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Muvaffaqiyatli kesildi",
        variant: "default",
        duration: 1500,
      });
      getOrder();
      getCuts();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {order?.name}
            </CardTitle>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2 text-xs">
              ID: {order?.id}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

            {order?.comment && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Izoh:</span>
                <span className="font-medium">{order?.comment}</span>
              </div>
            )}
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

            {order?.order_model?.sizes &&
              order.order_model.sizes.length > 0 &&
              (() => {
                // Get unique sizes and colors
                const sizes = [
                  ...new Set(
                    order.order_model.sizes.map((size) => size.size?.name),
                  ),
                ].sort((a, b) => a.localeCompare(b));
                const colors = [
                  ...new Set(
                    order.order_model.sizes.map((size) => size.color?.name),
                  ),
                ].sort((a, b) => a.localeCompare(b));

                // Create a map for quick lookup
                const sizeColorMap = new Map();
                order.order_model.sizes.forEach((item) => {
                  const key = `${item.size?.name}-${item.color?.name}`;
                  sizeColorMap.set(key, item.quantity || 0);
                });

                // Calculate row and column totals
                const rowTotals = new Map();
                const colTotals = new Map(colors.map((color) => [color, 0]));

                sizes.forEach((size) => {
                  let total = 0;
                  colors.forEach((color) => {
                    const quantity = sizeColorMap.get(`${size}-${color}`) || 0;
                    total += quantity;
                    colTotals.set(
                      color,
                      (colTotals.get(color) || 0) + quantity,
                    );
                  });
                  rowTotals.set(size, total);
                });

                const grandTotal = Array.from(rowTotals.values()).reduce(
                  (sum, val) => sum + val,
                  0,
                );

                return (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Ruler className="h-4 w-4 mr-2 text-indigo-500" />
                      <span>O'lchamlar</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse bg-white text-xs">
                        <thead>
                          <tr>
                            <th className="bg-yellow-100 border border-gray-300 p-1 text-center">
                              O'lcham
                            </th>
                            {colors.map((color, index) => (
                              <th
                                key={index}
                                className="border border-gray-300 p-1 text-center"
                              >
                                {color}
                              </th>
                            ))}
                            <th className="bg-blue-200 border border-gray-300 p-1 text-center font-semibold">
                              Jami
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizes.map((size) => (
                            <tr key={size}>
                              <td className="bg-yellow-50 border border-gray-300 p-1 font-medium text-center">
                                {size}
                              </td>
                              {colors.map((color) => {
                                const quantity =
                                  sizeColorMap.get(`${size}-${color}`) || 0;
                                return (
                                  <td
                                    key={`${size}-${color}`}
                                    className="border border-gray-200 p-1 text-center"
                                  >
                                    {quantity || ""}
                                  </td>
                                );
                              })}
                              <td className="bg-blue-100 border border-gray-300 p-1 text-center font-medium">
                                {rowTotals.get(size) || 0}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td className="bg-green-50 border border-gray-300 p-1 font-semibold text-center">
                              Jami
                            </td>
                            {colors.map((color) => (
                              <td
                                key={`total-${color}`}
                                className="bg-green-50 border border-gray-300 p-1 text-center font-semibold"
                              >
                                {colTotals.get(color) || 0}
                              </td>
                            ))}
                            <td className="bg-blue-100 border border-gray-300 p-1 text-center font-bold">
                              {grandTotal}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cutting_count" className="text-sm font-medium">
                Kesish soni
              </Label>
              <Input
                id="cutting_count"
                type="number"
                placeholder="Kesish sonini kiriting"
                value={cuttingCount}
                onChange={(e) => {
                  setCuttingCount(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutting_date" className="text-sm font-medium">
                Kesish sanasi
              </Label>
              <Input
                type="date"
                value={cuttingDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCuttingDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <Button
              onClick={handleCutting}
              disabled={
                isSending ||
                !cuttingCount ||
                !cuttingDate ||
                cuttingDate > new Date().toISOString().split("T")[0]
              }
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-4 w-4" />
                  Kesish
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Cuts History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <History className="h-5 w-5 text-primary" />
            Kesish tarixi
          </CardTitle>
          <CardDescription>
            Jami {cuts?.reduce((total, cut) => total + Number(cut.quantity), 0)}{" "}
            ta kesildi
          </CardDescription>
        </CardHeader>

        <CardContent>
          {cuts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
              <Scissors className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Hozircha hech qanday kesish mavjud emas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cuts
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((cut) => (
                  <div
                    key={cut.id}
                    className="flex items-center justify-between border rounded-xl p-3 bg-card/50 shadow-sm hover:shadow-md hover:bg-accent/10 transition-all duration-200"
                  >
                    {/* Left side: Quantity + User */}
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatNumber(cut.quantity, 0)} ta kesildi
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cut.user?.employee?.name || "Noma’lum foydalanuvchi"}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Date + Time */}
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {cut.cut_at
                          ?.split(" ")[0]
                          ?.split("-")
                          ?.reverse()
                          ?.join(".")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cut.cut_at?.split(" ")[1]?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CuttingStart;
