import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  RulerIcon,
  Timer,
  Shirt,
  CheckCircle,
  Calendar,
  InboxIcon,
  Scissors,
  Users,
  User,
  Filter,
  Package,
  Pencil,
  Download,
  Building2,
  FileDigit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";

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
  const [isDownloading, setIsDownloading] = useState(false);

  const totalSpends = order?.order_model?.submodels?.reduce(
    (acc, submodel) =>
      acc +
      parseFloat(
        submodel?.spends?.reduce(
          (acc, spend) =>
            acc + (spend?.region == "uz" ? parseFloat(spend?.seconds) : 0),
          0,
        ),
      ),
    0,
  );

  const totalSpendsRU = order?.order_model?.submodels?.reduce(
    (acc, submodel) =>
      acc +
      parseFloat(
        submodel?.spends?.reduce(
          (acc, spend) =>
            acc + (spend?.region == "ru" ? parseFloat(spend?.seconds) : 0),
          0,
        ),
      ),
    0,
  );

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/supervisor/orders/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `order_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "PDF yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/supervisor/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday buyurtma topilmadi",
          variant: "destructive",
        });
        navigate("/technolog/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, toast]);

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
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            className="flex items-center bg-green-500 hover:bg-green-600"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            className="flex items-center"
            onClick={() => navigate(`/supervisor/orders/edit/${id}`)}
          >
            <Pencil className="h-4 w-4" />
            Tahrirlash
          </Button>
        </div>
      </div>

      {/* Order info card */}
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
            {/* Order Details Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Buyurtma haqida</h4>

              <div className="space-y-2">
                {order?.contragent && (
                  <div className="flex gap-2 items-center">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Kontragent: {order?.contragent?.name || "Kontragent"}
                    </span>
                  </div>
                )}
                {order?.season_year && (
                  <div className="flex gap-2 items-center">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Mavsum: {order?.season_year || "0"}{" "}
                      {order?.season_type === "winter"
                        ? "Qish"
                        : order?.season_type === "summer"
                          ? "Bahor"
                          : "-"}
                    </span>
                  </div>
                )}
                {order?.quantity && (
                  <div className="flex gap-2 items-center">
                    <FileDigit className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Miqdori: {order?.quantity || "0"} ta
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
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Jami UZ:{" "}
                    {totalSpends?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    sekund /{" "}
                    {parseFloat(totalSpends / 60)?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    minut
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Jami RU:{" "}
                    {parseFloat(totalSpendsRU)?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    sekund /{" "}
                    {parseFloat(totalSpendsRU / 60)?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    minut
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
          {order?.order_model?.sizes && order.order_model.sizes.length > 0 && (
            <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Shirt className="h-4 w-4 mr-2 text-indigo-500" />
                <span>Submodellar</span>
              </h4>
              <div className="flex items-center flex-wrap gap-3">
                {order?.order_model?.submodels?.map((submodel) => (
                  <Badge
                    key={submodel?.id}
                    className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 text-base w-fit hover:bg-indigo-50"
                  >
                    <span className="font-bold">
                      {submodel?.submodel?.name}
                    </span>{" "}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
          {order?.instructions && order?.instructions?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Instruksiyalar
              </h4>
              <Card className="bg-green-50 border border-green-100">
                <div className="divide-y divide-green-100">
                  {order?.instructions?.map((instruction) => (
                    <div key={instruction.id} className="p-4 flex flex-col">
                      <div className="font-bold text-gray-800 text-lg mb-1">
                        {instruction?.title}
                      </div>
                      <div className="text-gray-700 text-base">
                        {instruction?.description}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          {order?.packageOutcomes?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2 text-emerald-600" />
                <span>Qadoqlash ma'lumotlari</span>
              </h4>

              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-none shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md text-emerald-800">
                      Jami:{" "}
                      {order.packageOutcomes.reduce(
                        (total, outcome) =>
                          total +
                          parseInt(outcome?.package_quantity) *
                            parseInt(outcome?.package_size),
                        0,
                      )}{" "}
                      dona
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order?.packageOutcomes?.map((outcome) => (
                      <div
                        key={outcome?.id}
                        className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="bg-emerald-100 p-2 rounded-full">
                            <Package className="h-5 w-5 text-emerald-600" />
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Paket #{outcome?.id}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center border-b border-dashed border-emerald-100 pb-2">
                            <span className="text-gray-600 font-medium">
                              Paket o'lchami:
                            </span>
                            <span className="font-bold text-emerald-700">
                              {outcome?.package_size} dona
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-b border-dashed border-emerald-100 pb-2">
                            <span className="text-gray-600 font-medium">
                              Paketlar soni:
                            </span>
                            <span className="font-bold text-emerald-700">
                              {outcome?.package_quantity} ta
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-600 font-medium">
                              Jami:
                            </span>
                            <span className="font-bold text-lg text-emerald-800">
                              {parseInt(outcome?.package_quantity) *
                                parseInt(outcome?.package_size)}{" "}
                              dona
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-6">
            {order?.order_model?.submodels.map((submodel) => (
              <Card
                className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm"
                key={submodel?.id}
              >
                <CardHeader className="pb-2 pt-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-purple-800">
                      {submodel.submodel.name} tikish ma'lumotlari
                    </CardTitle>
                  </div>
                  {submodel.group && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      Patok: {submodel.group.group.name}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Summary information */}
                  <div className="mt-4 bg-purple-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-purple-800 flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Jami:
                      </div>
                      <span className="font-bold text-purple-800">
                        {submodel.total_quantity} dona / {order.quantity} dona
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <div className="font-bold text-purple-800 flex items-center">
                      Bajarilgan foiz:
                    </div>
                    <div className="font-bold text-purple-800">
                      {((submodel.total_quantity / order.quantity) * 100)
                        .toFixed(2)
                        .toString()}
                      %
                    </div>
                  </div>
                  {submodel.sewingOutputs.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-purple-800 flex items-center mb-3">
                        Bugungi natijalar (
                        {submodel.sewingOutputs?.reduce(
                          (acc, output) => acc + output?.quantity,
                          0,
                        )}
                        )
                      </h5>
                      {submodel.sewingOutputs.map((output) => (
                        <div
                          key={output.id}
                          className="mt-2 bg-purple-100 p-3 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-purple-800 flex items-center">
                              {output?.time?.time}
                            </div>
                            <span className="font-bold text-purple-800">
                              {output?.quantity} dona
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {order?.specification_categories &&
            order.specification_categories.length > 0 && (
              <div className="mt-6">
                <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                  <Scissors className="h-5 w-5 mr-2 text-teal-600" />
                  Bichish ma'lumotlari
                </h4>
                <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-none shadow-sm">
                  <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full">
                      {order.specification_categories.map((category, index) => (
                        <AccordionItem
                          key={index}
                          value={`category-${index}`}
                          className="border-b border-teal-100 last:border-b-0"
                        >
                          <AccordionTrigger className="py-3 px-4 hover:no-underline hover:bg-teal-100/30">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center">
                                <TagIcon className="h-4 w-4 mr-2 text-teal-600" />
                                <span className="font-semibold text-gray-800">
                                  {category.name}
                                </span>
                              </div>
                              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                                {category.orderCuts.length} ta bichim
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 pt-2">
                            {category.orderCuts.length > 0 ? (
                              <div className="space-y-3">
                                {category.orderCuts.map((cut) => (
                                  <div
                                    key={cut.id}
                                    className="bg-white bg-opacity-60 rounded-lg p-3 border border-teal-100 transition-all hover:shadow-sm"
                                  >
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                        <span>
                                          Bichilgan vaqt:{" "}
                                          {new Date(cut.cut_at).toLocaleString(
                                            "ru-RU",
                                          )}
                                        </span>
                                      </div>

                                      <Badge className="bg-blue-100 text-blue-800 w-fit">
                                        {cut.quantity} dona
                                      </Badge>

                                      <div className="flex items-center">
                                        <User className="h-4 w-4 text-gray-500 mr-2" />
                                        <span>
                                          Ma'sul:{" "}
                                          {cut.user?.employee?.name ||
                                            "Belgilanmagan"}
                                        </span>
                                      </div>

                                      {cut.user?.group && (
                                        <div className="flex items-center md:col-span-2">
                                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                                          <span>
                                            Guruh: {cut.user.group.name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white bg-opacity-50 rounded-lg p-4 text-center text-gray-500 border border-teal-100">
                                <InboxIcon className="h-8 w-8 mx-auto mb-2 text-teal-300" />
                                <p>Bichim ma'lumotlari mavjud emas</p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderView;
