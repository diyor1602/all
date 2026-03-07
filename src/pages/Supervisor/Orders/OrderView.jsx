import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowLeftRight,
  Globe2,
  Loader2,
  MessageSquareIcon,
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
  Package,
  Pencil,
  Download,
  Building2,
  FileDigit,
  PlaneTakeoff,
  Upload,
  FileSpreadsheet,
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

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Xatolik",
          description: "Iltimos, faqat Excel faylini tanlang (.xlsx, .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Xatolik",
        description: "Iltimos, avval faylni tanlang",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post(
        `/supervisor/orders/${id}/import-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      fetchOrder();
      toast({
        title: "Muvaffaqiyat",
        description: "Excel fayli muvaffaqiyatli yuklandi",
        duration: 1200,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Excel faylini yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
            PDF
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

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Asosiy ma'lumotlar
                </h4>
                <div className="space-y-3">
                  {order?.contragent && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/30 hover:bg-white/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Building2 className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          Kontragent
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {order?.contragent?.name || "Kontragent"}
                      </span>
                    </div>
                  )}
                  {order?.season_year && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/30 hover:bg-white/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                          <Calendar className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          Mavsum
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {order?.season_year}{" "}
                        {order?.season_type === "winter"
                          ? "Qish"
                          : order?.season_type === "summer"
                            ? "Bahor"
                            : "-"}
                      </span>
                    </div>
                  )}
                  {order?.quantity && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/30 hover:bg-white/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <FileDigit className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          Miqdori
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {order?.quantity} ta
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/30 hover:bg-white/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <Shirt className="h-3 w-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Submodel
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {order?.order_model?.submodels
                        ?.map((submodel) => submodel?.submodel?.name)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Time Information */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100 shadow-sm">
                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                  Sarflangan vaqt
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/70 transition-colors border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-indigo-500 rounded-lg shadow-sm">
                        <Globe2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-indigo-600 block">
                          O'zbekiston
                        </span>
                        <span className="text-base font-bold text-indigo-900">
                          {totalSpends?.toLocaleString("ru-RU", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          sekund
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-indigo-600 block">
                        Daqiqa
                      </span>
                      <span className="text-xs font-semibold text-indigo-800">
                        {parseFloat(totalSpends / 60)?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/70 transition-colors border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-500 rounded-lg shadow-sm">
                        <PlaneTakeoff className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-purple-600 block">
                          Buyurtmachi
                        </span>
                        <span className="text-base font-bold text-purple-900">
                          {parseFloat(
                            order?.order_model?.minute * 60,
                          )?.toLocaleString("ru-RU", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          sekund
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-purple-600 block">
                        Daqiqa
                      </span>
                      <span className="text-xs font-semibold text-purple-800">
                        {parseFloat(order?.order_model?.minute)?.toLocaleString(
                          "ru-RU",
                          {
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/70 transition-colors border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-500 rounded-lg shadow-sm">
                        <ArrowLeftRight className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-emerald-600 block">
                          Farq (O'zbekiston - Buyurtmachi)
                        </span>
                        <span className="text-base font-bold text-emerald-900">
                          {parseFloat(
                            (totalSpends || 0) -
                              (order?.order_model?.minute || 0) * 60,
                          )?.toLocaleString("ru-RU", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          sekund
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-600 block">
                        Daqiqa
                      </span>
                      <span className="text-xs font-semibold text-emerald-800">
                        {parseFloat(
                          ((totalSpends || 0) -
                            (order?.order_model?.minute || 0) * 60) /
                            60,
                        )?.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Section - Full Width */}
          {order?.comment && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm">
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                Izoh
              </h4>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <MessageSquareIcon className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs text-gray-700 leading-relaxed flex-1">
                  {order?.comment}
                </p>
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

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <Shirt className="h-4 w-4 text-white" />
              </div>
              Tikish ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {order?.order_model?.submodels.map((submodel) => (
                <Card
                  className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  key={submodel?.id}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold text-white">
                        {submodel.submodel.name}
                      </h4>
                      <div className="px-3 py-1 bg-white/20 rounded-full">
                        <span className="text-xs font-medium text-white">
                          {submodel?.total_quantity || 0} dona
                        </span>
                      </div>
                    </div>
                    {submodel.group && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          Patok: {submodel.group.group.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    {/* Progress Section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Bajarilgan
                        </span>
                        <span className="text-lg font-bold text-indigo-600">
                          {((submodel.total_quantity / order.quantity) * 100)
                            .toFixed(2)
                            .toString()}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min(
                              (submodel.total_quantity / order.quantity) * 100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {submodel.total_quantity} dona
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.quantity} dona
                        </span>
                      </div>
                    </div>

                    {/* Today's Results */}
                    {submodel.sewingOutputs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Bugungi natijalar
                          </h5>
                          <div className="px-2 py-1 bg-green-100 rounded-full">
                            <span className="text-xs font-bold text-green-700">
                              {submodel.sewingOutputs?.reduce(
                                (acc, output) => acc + output?.quantity,
                                0,
                              )}{" "}
                              dona
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {submodel.sewingOutputs.map((output) => (
                            <div
                              key={output.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <Timer className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">
                                    {output?.time?.time}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-green-700">
                                  {output?.quantity} dona
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {submodel.sewingOutputs.length === 0 && (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <InboxIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">
                          Bugungi natijalar mavjud emas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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

      {/* Excel Upload Section */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-none shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Excel faylini yuklash
              </h3>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100
                    cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Tanlangan fayl:{" "}
                    <span className="font-medium">{selectedFile.name}</span>
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex items-center bg-emerald-600 hover:bg-emerald-700"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Yuklanmoqda..." : "Yuklash"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderView;
