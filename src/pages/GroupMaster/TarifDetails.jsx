import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ArrowLeft,
  Loader2,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  RulerIcon,
  Coins,
  Hourglass,
  FileDigit,
  Users,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [tarifications, setTarifications] = useState([]);
  const [tarifDialogOpen, setTarifDialogOpen] = useState(false);
  const [selectedTarification, setSelectedTarification] = useState(null);
  const [selectedTarifLang, setSelectedTarifLang] = useState(
    localStorage.getItem("tarifLang") || "uz",
  );
  const [imageDialog, setImageDialog] = useState({
    open: false,
    image: null,
    title: "",
  });

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groupMaster/orders/all/${id}`);
      setOrder(response.data);
      setSelectedSubmodel(response.data?.order_model?.submodels?.[0]);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Bunday buyurtma topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrder();
  }, [id, navigate, toast]);

  const fetchTarifications = () => {
    if (!order?.order_model?.submodels) return;

    const filteredTarifications = [];

    order.order_model.submodels.forEach((submodel) => {
      submodel?.tarification_categories?.forEach((tarification) => {
        if (tarification?.region === selectedTarifLang) {
          filteredTarifications.push(tarification);
        }
      });
    });

    setTarifications(filteredTarifications);
  };

  useEffect(() => {
    fetchTarifications();
  }, [order, selectedTarifLang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-lg text-gray-600">Yuklanyapti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">
          Buyurtma #{order?.id}
        </h2>
      </div>

      <Card className="bg-gradient-to-r from-sky-100 to-indigo-100 border-none shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {order?.name || "Buyurtma ma'lumotlari"}
                </h3>
                <p className="text-gray-600 text-sm">
                  {order?.order_model?.model?.name || "Model"}
                </p>
              </div>
              <Badge
                className={`${
                  statuses[order?.status]?.color
                } px-3 py-1 font-medium rounded-full text-sm hover:opacity-90`}
              >
                {statuses[order?.status]?.text}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Buyurtma haqida</h4>

              <div className="space-y-2">
                {order?.quantity && (
                  <div className="flex gap-2 items-center">
                    <FileDigit className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Miqdor: {order?.quantity} ta
                    </span>
                  </div>
                )}
                {order?.start_date && (
                  <div className="flex gap-2 items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Boshlash: {formatDate(order?.start_date)}
                    </span>
                  </div>
                )}

                {order?.end_date && (
                  <div className="flex gap-2 items-center">
                    <CalendarCheckIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Tugash: {formatDate(order?.end_date)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Tikayotgan guruh:{" "}
                    {selectedSubmodel?.group?.group?.name || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order?.comment && (
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap">
              <MessageSquareIcon className="h-4 w-4 text-gray-500 mt-1" />
              <span className="text-sm">{order?.comment}</span>
            </div>
          )}

          {order?.order_model?.sizes &&
            order.order_model.sizes.length > 0 &&
            (() => {
              // Get unique sizes and colors
              const sizes = [
                ...new Set(
                  order.order_model.sizes.map((size) => size.size_name),
                ),
              ].sort((a, b) => a.localeCompare(b));
              const colors = [
                ...new Set(
                  order.order_model.sizes.map((size) => size.color_name),
                ),
              ].sort((a, b) => a.localeCompare(b));

              // Create a map for quick lookup
              const sizeColorMap = new Map();
              order.order_model.sizes.forEach((item) => {
                const key = `${item.size_name}-${item.color_name}`;
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
                  colTotals.set(color, (colTotals.get(color) || 0) + quantity);
                });
                rowTotals.set(size, total);
              });

              const grandTotal = Array.from(rowTotals.values()).reduce(
                (sum, val) => sum + val,
                0,
              );

              return (
                <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                    <span>O'lchamlar</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse bg-white">
                      <thead>
                        <tr>
                          <th className="bg-yellow-100 border border-gray-300 p-2 text-center">
                            O'lcham
                          </th>
                          {colors.map((color, index) => (
                            <th
                              key={index}
                              className="border border-gray-300 p-2 text-center"
                            >
                              {color}
                            </th>
                          ))}
                          <th className="bg-blue-200 border border-gray-300 p-2 text-center font-semibold">
                            Jami
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map((size) => (
                          <tr key={size}>
                            <td className="bg-yellow-50 border border-gray-300 p-2 font-medium text-center">
                              {size}
                            </td>
                            {colors.map((color) => {
                              const quantity =
                                sizeColorMap.get(`${size}-${color}`) || 0;
                              return (
                                <td
                                  key={`${size}-${color}`}
                                  className="border border-gray-200 p-2 text-center"
                                >
                                  {quantity || ""}
                                </td>
                              );
                            })}
                            <td className="bg-blue-100 border border-gray-300 p-2 text-center font-medium">
                              {rowTotals.get(size) || 0}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="bg-green-50 border border-gray-300 p-2 font-semibold text-center">
                            Jami
                          </td>
                          {colors.map((color) => (
                            <td
                              key={`total-${color}`}
                              className="bg-green-50 border border-gray-300 p-2 text-center font-semibold"
                            >
                              {colTotals.get(color) || 0}
                            </td>
                          ))}
                          <td className="bg-blue-100 border border-gray-300 p-2 text-center font-bold">
                            {grandTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
        </CardContent>
      </Card>

      {order?.order_model?.submodels?.length > 0 && (
        <div className="w-full space-y-4">
          <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg">
            {order?.order_model?.submodels?.map((submodel, index) => (
              <Button
                key={index}
                variant={
                  selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                    ? "default"
                    : "outline"
                }
                className={
                  selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-blue-100"
                }
                onClick={() => setSelectedSubmodel(submodel)}
              >
                {submodel?.submodel?.name}
              </Button>
            ))}
          </div>

          {/* Recipes */}
          {order?.order_recipes && order.order_recipes.length > 0 && (
            <div className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="recipes"
                  className="border border-orange-200 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-orange-50/50 bg-orange-100/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800">
                          Detallar
                        </span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                        {order.order_recipes.length} ta
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.order_recipes.map((recipe, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 group relative h-fit"
                        >
                          <div className="flex items-start gap-3">
                            {/* Image */}
                            <div className="flex-shrink-0">
                              {recipe.item?.image ? (
                                <button
                                  onClick={() =>
                                    setImageDialog({
                                      open: true,
                                      image: recipe.item.image,
                                      title: recipe.item.name,
                                    })
                                  }
                                  className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                                >
                                  <img
                                    src={recipe.item.image}
                                    alt={recipe.item?.name || "Retsept"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </button>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-orange-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-gray-800 mb-1">
                                {recipe.item?.name || "Noma'lum retsept"}
                              </h5>

                              {/* Quantity Badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                                  <span className="text-xs font-bold text-white">
                                    {recipe.quantity}
                                  </span>
                                </div>
                                {recipe.item?.unit && (
                                  <span className="text-xs text-gray-600">
                                    {recipe.item.unit}
                                  </span>
                                )}
                              </div>

                              {/* Additional info if available */}
                              {recipe.item?.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {recipe.item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center gap-2 w-full mt-6">
              <Button
                onClick={() => {
                  setSelectedTarifLang("uz");
                  localStorage.setItem("tarifLang", "uz");
                }}
                variant={selectedTarifLang === "uz" ? "default" : "outline"}
              >
                O'zbek tarifikatsiya
              </Button>
              <Button
                onClick={() => {
                  setSelectedTarifLang("ru");
                  localStorage.setItem("tarifLang", "ru");
                }}
                variant={selectedTarifLang === "ru" ? "default" : "outline"}
              >
                Rus tarifikatsiya
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-medium my-6 ml-2">
                Tarifikatsiyalar
              </h2>
            </div>

            {tarifications?.length > 0 ? (
              <Card className="border-none shadow-md bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center gap-2 justify-between flex-wrap">
                      <div className="flex items-center gap-2">
                        <Coins size={20} />
                        <div>
                          {tarifications
                            .reduce(
                              (acc, item) =>
                                acc +
                                (item?.tarifications?.reduce(
                                  (acc, subitem) =>
                                    acc + parseFloat(subitem?.summa),
                                  0,
                                ) || 0),
                              0,
                            )
                            ?.toLocaleString("ru-RU", {
                              minimumFractionDigits: 2,
                            })}{" "}
                          so'm
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hourglass size={20} />
                        <div>
                          {tarifications
                            .reduce(
                              (acc, item) =>
                                acc +
                                (item?.tarifications?.reduce(
                                  (acc, subitem) =>
                                    acc + parseFloat(subitem?.second),
                                  0,
                                ) || 0),
                              0,
                            )
                            ?.toLocaleString("ru-RU", {
                              minimumFractionDigits: 2,
                            })}{" "}
                          sekund
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tarifications.map((tarification, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-gray-700">
                            {tarification?.name}{" "}
                          </span>

                          <Badge
                            variant="outline"
                            className="bg-indigo-100 text-indigo-800 border-indigo-200"
                          >
                            {tarification?.tarifications?.length} ta
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap text-sm ">
                          <div className="flex items-center gap-2">
                            <Coins size={20} />
                            {tarification?.tarifications
                              ?.reduce(
                                (acc, item) => acc + parseFloat(item?.summa),
                                0,
                              )
                              ?.toLocaleString({
                                minimumFractionDigits: 2,
                              })}{" "}
                            so'm
                          </div>
                          <div className="flex items-center gap-2">
                            <Hourglass size={20} />
                            {tarification?.tarifications
                              ?.reduce(
                                (acc, item) => acc + parseFloat(item?.second),
                                0,
                              )
                              ?.toLocaleString({
                                minimumFractionDigits: 2,
                              })}{" "}
                            sekund
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2 mt-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => {
                                setTarifDialogOpen(true);
                                setSelectedTarification(tarification);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ko'rish
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tarifikatsiyalar mavjud emas. Texnologga murojaat qiling!
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={tarifDialogOpen} onOpenChange={setTarifDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTarification?.name}</DialogTitle>
            <DialogDescription>
              {selectedTarification?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-center">
                  <th className="border border-gray-300 p-1">#</th>
                  <th className="border border-gray-300 p-1">Kod</th>
                  <th className="border border-gray-300 p-1">Nomi</th>
                  <th className="border border-gray-300 p-1">Xodim</th>
                  <th className="border border-gray-300 p-1">Razryad</th>
                  <th className="border border-gray-300 p-1">Sekund</th>
                  <th className="border border-gray-300 p-1">Summa (so'm)</th>
                </tr>
              </thead>
              <tbody>
                {selectedTarification?.tarifications
                  ?.sort((a, b) =>
                    a.code.localeCompare(b.code, undefined, {
                      numeric: true,
                      sensitivity: "base",
                    }),
                  )
                  ?.map((tarif, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-gray-300 p-1">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {tarif?.code}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {tarif?.name}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {tarif?.employee?.name || "-"}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {tarif?.razryad?.name}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {parseFloat(tarif?.second)?.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {parseFloat(tarif?.summa)?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      {/* Image View Dialog */}
      <Dialog
        open={imageDialog.open}
        onOpenChange={(open) => setImageDialog({ ...imageDialog, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{imageDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {imageDialog.image && (
              <img
                src={imageDialog.image}
                alt={imageDialog.title}
                className="max-w-full max-h-96"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
