import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  BoxIcon,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  BarChartIcon,
  RulerIcon,
  Bitcoin,
  Timer,
  Shirt,
  CheckCircle,
  Calendar,
  InboxIcon,
  Scissors,
  Users,
  User,
  Clock,
  Filter,
  Package,
  Files,
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
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          (acc, spend) => acc + parseFloat(spend?.seconds),
          0
        )
      ),
    0
  );

  const totalSpendSummaUZ = order?.order_model?.submodels?.reduce(
    (acc, submodel) =>
      acc +
      parseFloat(
        submodel?.spends?.reduce(
          (acc, spend) =>
            acc + (spend?.region == "uz" ? parseFloat(spend?.summa) : 0),
          0
        )
      ),
    0
  );

  const totalSpendSummaRU = order?.order_model?.submodels?.reduce(
    (acc, submodel) =>
      acc +
      parseFloat(
        submodel?.spends?.reduce(
          (acc, spend) =>
            acc + (spend?.region == "ru" ? parseFloat(spend?.summa) : 0),
          0
        )
      ),
    0
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

  const handleCopy = () => {
    // Create a new object with the required format
    const formattedOrder = {
      name: order?.name,
      quantity: order?.quantity,
      price: order?.price.toString(),
      start_date: order?.start_date ? order.start_date.split(" ")[0] : null,
      end_date: order?.end_date ? order.end_date.split(" ")[0] : null,
      rasxod: order?.rasxod,
      comment: order?.comment,
      model: {
        id: order?.order_model?.model?.id,
        material_id: order?.order_model?.material?.id,
        submodels: order?.order_model?.submodels?.map(
          (submodel) => submodel.submodel.id
        ),
        sizes: order?.order_model?.sizes?.map((size) => ({
          id: size.size.id,
          quantity: size.quantity,
        })),
      },
      instructions: order?.instructions,
      contragent_id: order?.contragent ? order.contragent.id : null,
    };

    // Copy the formatted order to clipboard
    navigator.clipboard.writeText(JSON.stringify(formattedOrder, null, 4));

    toast({
      title: "Nusxa olindi",
      description: "Buyurtmadan nusxa olindi",
      style: {
        backgroundColor: "green",
        color: "white",
      },
    });
  };
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
          <Button className="flex items-center" onClick={handleCopy}>
            <Files className="h-4 w-4" />
            Nusxa olish
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
                    Jami:{" "}
                    {totalSpends?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    sekund
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Jami:{" "}
                    {parseFloat(totalSpends / 60)?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    minut
                  </span>
                </div>
              </div>
            </div>

            {/* Material Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Material haqida</h4>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BoxIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material: {order?.order_model?.material?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material kodi: {order?.order_model?.material?.code || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BarChartIcon
                    className={cn(
                      "h-4 w-4",
                      order?.order_model?.status
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      order?.order_model?.status
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    Limit:{" "}
                    {parseFloat(
                      order?.order_model?.rasxod || 0
                    ).toLocaleString() || "N/A"}{" "}
                    so'm
                    <span className="text-sm ml-1">
                      {order?.order_model?.status
                        ? "(Qabul qilingan)"
                        : "(Qabul qilinmagan)"}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Bitcoin
                    className={cn(
                      "h-4 w-4",
                      totalSpendSummaUZ > order?.order_model?.rasxod
                        ? "text-red-500"
                        : "text-black"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      totalSpendSummaUZ > order?.order_model?.rasxod
                        ? "text-red-500 text-xl"
                        : "text-sm"
                    )}
                  >
                    Jami UZ:{" "}
                    {totalSpendSummaUZ?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    so'm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Bitcoin
                    className={cn(
                      "h-4 w-4",
                      totalSpendSummaRU > order?.order_model?.rasxod
                        ? "text-red-500"
                        : "text-black"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      totalSpendSummaRU > order?.order_model?.rasxod
                        ? "text-red-500 text-xl"
                        : "text-sm"
                    )}
                  >
                    Jami RU:{" "}
                    {totalSpendSummaRU?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    so'm
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
          {order?.order_model?.sizes && order.order_model.sizes.length > 0 && (
            <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                <span>O'lchamlar</span>
              </h4>
              <div className="flex items-center flex-wrap gap-3">
                {order?.order_model?.sizes?.map((size) => (
                  <Badge
                    key={size.id}
                    className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 text-base w-fit hover:bg-indigo-50"
                  >
                    <span className="font-bold">{size?.size?.name}</span>{" "}
                    {size?.quantity ? (
                      <span className="font-medium mx-1 text-black">
                        {size?.quantity} ta
                      </span>
                    ) : (
                      ""
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
                        0
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
          {/* OTK Order Group Section */}
          {order?.order_model?.submodels?.some(
            (submodel) => submodel.otkOrderGroup
          ) && (
            <div className="mt-6">
              <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                OTK Guruh ma'lumotlari
              </h4>

              <Tabs
                defaultValue={order?.order_model?.submodels[0]?.id?.toString()}
                className="w-full"
              >
                <TabsList className="mb-4 bg-white bg-opacity-50 p-1 border border-blue-100">
                  {order?.order_model?.submodels
                    ?.filter((submodel) => submodel.otkOrderGroup)
                    .map((submodel) => (
                      <TabsTrigger
                        key={submodel.id}
                        value={submodel.id.toString()}
                        className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
                      >
                        {submodel.submodel.name}
                      </TabsTrigger>
                    ))}
                </TabsList>

                {order?.order_model?.submodels
                  ?.filter((submodel) => submodel.otkOrderGroup)
                  .map((submodel) => (
                    <TabsContent
                      key={submodel.id}
                      value={submodel.id.toString()}
                    >
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-blue-800">
                              {submodel.submodel.name} OTK ma'lumotlari
                            </CardTitle>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="bg-white bg-opacity-70 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-gray-800">
                                OTK Guruh:{" "}
                                {submodel.otkOrderGroup?.group?.name ||
                                  "Belgilanmagan"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
              </Tabs>
            </div>
          )}
          <div className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              {/* Quality Checks Section */}
              {order?.order_model?.submodels?.some(
                (submodel) =>
                  submodel.qualityChecks && submodel.qualityChecks.length > 0
              ) && (
                <AccordionItem
                  value="quality-checks"
                  className="border border-indigo-100 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="py-3 px-4 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:no-underline hover:bg-indigo-100 data-[state=open]:bg-indigo-100">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                        <span className="font-bold text-gray-800">
                          Sifat tekshiruvi ma'lumotlari
                        </span>
                      </div>

                      {/* Counter badges */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          {order?.order_model?.submodels?.reduce(
                            (acc, submodel) =>
                              acc +
                              (submodel.qualityChecks_status_count?.true || 0),
                            0
                          )}{" "}
                          ta o'tgan
                        </Badge>
                        <Badge className="bg-red-100 text-red-800">
                          {order?.order_model?.submodels?.reduce(
                            (acc, submodel) =>
                              acc +
                              (submodel.qualityChecks_status_count?.false || 0),
                            0
                          )}{" "}
                          ta o'tmagan
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <Accordion type="multiple" className="w-full">
                      {order?.order_model?.submodels
                        ?.filter(
                          (submodel) =>
                            submodel.qualityChecks &&
                            submodel.qualityChecks.length > 0
                        )
                        .map((submodel) => (
                          <AccordionItem
                            key={submodel.id}
                            value={`submodel-${submodel.id}`}
                            className="border border-indigo-100 bg-white rounded-lg mb-3 overflow-hidden"
                          >
                            <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-indigo-50">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium text-indigo-800">
                                  {submodel.submodel.name}
                                </span>

                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                    {submodel.qualityChecks_status_count
                                      ?.true || 0}
                                  </Badge>
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                    {submodel.qualityChecks_status_count
                                      ?.false || 0}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-3 px-3">
                              <div className="space-y-4">
                                {/* Failed Quality Checks */}
                                {submodel.qualityChecks.filter(
                                  (check) => check.status === false
                                ).length > 0 && (
                                  <div className="space-y-3">
                                    <h5 className="font-medium text-red-800 flex items-center">
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="mr-1"
                                      >
                                        <path
                                          d="M7.5 11C7.22386 11 7 11.2239 7 11.5C7 11.7761 7.22386 12 7.5 12C7.77614 12 8 11.7761 8 11.5C8 11.2239 7.77614 11 7.5 11ZM7.5 3C7.22386 3 7 3.22386 7 3.5V8.5C7 8.77614 7.22386 9 7.5 9C7.77614 9 8 8.77614 8 8.5V3.5C8 3.22386 7.77614 3 7.5 3ZM7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 11.6421 11.6421 15 7.5 15ZM7.5 14C11.0899 14 14 11.0899 14 7.5C14 3.91015 11.0899 1 7.5 1C3.91015 1 1 3.91015 1 7.5C1 11.0899 3.91015 14 7.5 14Z"
                                          fill="#b91c1c"
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                        ></path>
                                      </svg>
                                      O'tmagan tekshiruvlar
                                    </h5>

                                    {submodel.qualityChecks
                                      .filter((check) => check.status === false)
                                      .map((check) => (
                                        <Card
                                          key={check.id}
                                          className="bg-white border border-red-200"
                                        >
                                          <CardHeader className="pb-2 pt-3">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center">
                                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                                <span className="text-sm text-gray-600">
                                                  ID: {check.id}
                                                </span>
                                              </div>
                                              <Badge className="bg-red-100 text-red-800">
                                                O'tmagan
                                              </Badge>
                                            </div>
                                          </CardHeader>
                                          <CardContent className="pt-0 pb-3">
                                            {check.user && (
                                              <div className="mb-3">
                                                <p className="text-sm text-gray-600 mb-1">
                                                  Tekshiruvchi:
                                                </p>
                                                <div className="flex items-center">
                                                  <User className="h-4 w-4 text-indigo-600 mr-2" />
                                                  <span className="font-medium">
                                                    {check.user.employee
                                                      ?.name || "Noma'lum"}
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                            {check.image && (
                                              <div className="mb-3">
                                                <p className="text-sm text-gray-600 mb-1">
                                                  Foto:
                                                </p>
                                                <div className="mt-1 rounded-lg overflow-hidden border border-gray-200 max-w-xs">
                                                  <img
                                                    src={check.image}
                                                    alt="Quality check"
                                                    className="w-full h-auto"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {check.qualityCheckDescriptions &&
                                              check.qualityCheckDescriptions
                                                .length > 0 && (
                                                <div>
                                                  <p className="text-sm text-gray-600 mb-1">
                                                    Nosozliklar:
                                                  </p>
                                                  <div className="flex flex-wrap gap-2">
                                                    {check.qualityCheckDescriptions.map(
                                                      (desc) => (
                                                        <Badge
                                                          key={desc.id}
                                                          className="bg-red-50 text-red-800 border border-red-200"
                                                        >
                                                          {desc.description}
                                                        </Badge>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                            {check.comment && (
                                              <div className="mt-3">
                                                <p className="text-sm text-gray-600 mb-1">
                                                  Izoh:
                                                </p>
                                                <div className="bg-gray-50 p-2 rounded-md text-sm">
                                                  {check.comment}
                                                </div>
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      ))}
                                  </div>
                                )}

                                {/* Passed Quality Checks */}
                                {submodel.qualityChecks.filter(
                                  (check) => check.status === true
                                ).length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-green-800 flex items-center mb-3">
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="mr-1"
                                      >
                                        <path
                                          d="M7.5 0.875C3.83152 0.875 0.875 3.83152 0.875 7.5C0.875 11.1685 3.83152 14.125 7.5 14.125C11.1685 14.125 14.125 11.1685 14.125 7.5C14.125 3.83152 11.1685 0.875 7.5 0.875ZM7.5 1.825C10.6459 1.825 13.175 4.3541 13.175 7.5C13.175 10.6459 10.6459 13.175 7.5 13.175C4.3541 13.175 1.825 10.6459 1.825 7.5C1.825 4.3541 4.3541 1.825 7.5 1.825ZM10.7888 5.2112L6.5 9.5L4.2112 7.2112L3.5 7.9224L6.5 10.9224L11.5 5.9224L10.7888 5.2112Z"
                                          fill="#16a34a"
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                        ></path>
                                      </svg>
                                      O'tgan tekshiruvlar
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {submodel.qualityChecks
                                        .filter(
                                          (check) => check.status === true
                                        )
                                        .slice(0, 6)
                                        .map((check) => (
                                          <div
                                            key={check.id}
                                            className="flex items-center gap-2 p-2 bg-green-50 rounded-md"
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">
                                              ID: {check.id} -
                                              {check.user?.employee?.name ||
                                                "Noma'lum"}
                                            </span>
                                          </div>
                                        ))}

                                      {submodel.qualityChecks.filter(
                                        (check) => check.status === true
                                      ).length > 6 && (
                                        <div className="flex items-center justify-center col-span-full p-2 bg-green-50 rounded-md">
                                          <span className="text-sm text-green-800">
                                            +
                                            {submodel.qualityChecks.filter(
                                              (check) => check.status === true
                                            ).length - 6}{" "}
                                            ta ko'proq
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          <div className="mt-6">
            <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
              <Shirt className="h-5 w-5 mr-2 text-purple-600" />
              Tikish ma'lumotlari
            </h4>

            <Tabs
              defaultValue={order?.order_model?.submodels[0]?.id?.toString()}
            >
              <TabsList className="mb-4 bg-white bg-opacity-50 p-1 border border-purple-100">
                {order?.order_model?.submodels
                  ?.filter(
                    (submodel) =>
                      submodel.sewingOutputs &&
                      submodel.sewingOutputs.length > 0
                  )
                  .map((submodel) => (
                    <TabsTrigger
                      key={submodel.id}
                      value={submodel.id.toString()}
                      className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
                    >
                      {submodel.submodel.name}
                    </TabsTrigger>
                  ))}
              </TabsList>

              {order?.order_model?.submodels.map((submodel) => (
                <TabsContent key={submodel.id} value={submodel.id.toString()}>
                  <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm">
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
                            {submodel.total_quantity} dona / {order.quantity}{" "}
                            dona
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
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
                            Bugungi natijalar:
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
                                  {output.quantity} dona
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
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
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center">
                                        <CheckCircle
                                          className={`h-4 w-4 ${
                                            cut.status
                                              ? "text-green-500"
                                              : "text-orange-500"
                                          } mr-2`}
                                        />
                                        <span
                                          className={`font-medium ${
                                            cut.status
                                              ? "text-green-700"
                                              : "text-orange-700"
                                          }`}
                                        >
                                          Status:{" "}
                                          {cut.status
                                            ? "Qabul qilingan"
                                            : "Qabul qilinmagan"}
                                        </span>
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        {cut.quantity} dona
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                        <span>
                                          Bichilgan vaqt:{" "}
                                          {new Date(cut.cut_at).toLocaleString(
                                            "ru-RU"
                                          )}
                                        </span>
                                      </div>

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
          {order?.orderPrintingTimes && (
            <div className="mt-6">
              <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Chop etish vaqti ma'lumotlari
              </h4>
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm">
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reja vaqti</p>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="font-medium">
                          {order.orderPrintingTimes.planned_time.toLocaleString(
                            "en-GB"
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge
                        className={`${
                          (statuses[order.orderPrintingTimes.status]?.textColor,
                          statuses[order.orderPrintingTimes.status]?.color)
                        } px-3 py-1 font-medium text-sm`}
                      >
                        {statuses[order.orderPrintingTimes.status]?.text}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Bajarilgan vaqti
                      </p>
                      <div className="flex items-center">
                        <CalendarCheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium">
                          {order.orderPrintingTimes.actual_time || (
                            <span className="text-orange-500">
                              Bajarilmagan
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ma'sul</p>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="font-medium">
                          {order.orderPrintingTimes.user?.employee?.name ||
                            "Belgilanmagan"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Izoh</p>
                    <div className="bg-white bg-opacity-70 p-3 rounded-lg border border-purple-100 flex items-start gap-2">
                      <MessageSquareIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">
                        {order.orderPrintingTimes.comment || "Izoh yo'q"}
                      </span>
                    </div>
                  </div>
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
