import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  Eye,
  Plus,
  ArrowLeft,
  Loader2,
  BoxIcon,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  BarChartIcon,
  RulerIcon,
  Coins,
  Hourglass,
  Bitcoin,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [specifications, setSpecifications] = useState([]);
  const [specDownloading, setSpecDownloading] = useState(false);
  const [tarifDownloading, setTarifDownloading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [tarifDialogOpen, setTarifDialogOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [selectedTarification, setSelectedTarification] = useState(null);

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

  const totalSpendSumma = order?.order_model?.submodels?.reduce(
    (acc, submodel) =>
      acc +
      parseFloat(
        submodel?.spends?.reduce(
          (acc, spend) => acc + parseFloat(spend?.summa),
          0
        )
      ),
    0
  );

  const handleDownloadTarif = async (id) => {
    setTarifDownloading(true);
    try {
      const response = await api.get(`/technologist/export-tarification`, {
        params: { orderSubModelId: id },
        responseType: "blob", // Important: Expect binary data
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order?.id} ${order?.name} ${selectedSubmodel?.submodel?.name} tarifikatsiya.xlsx`;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link); // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tarification yuklab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setTarifDownloading(false);
    }
  };

  const handleDownloadSpec = async (id) => {
    setSpecDownloading(true);
    try {
      const response = await api.get(`/technologist/export-specification`, {
        params: { orderSubModelId: id },
        responseType: "blob", // Important: Expect binary data
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order?.id} ${order?.name} ${selectedSubmodel?.submodel?.name} spesifikatsiya.xlsx`;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link); // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyalarni yuklab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSpecDownloading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/technologist/orders/${id}`);
        setOrder(response.data);
        setSelectedSubmodel(response.data?.order_model?.submodels?.[0]);
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

  const fetchTarifications = async () => {
    setTabLoading(true);
    try {
      const response = await api.get(
        `/technologist/tarification/category/${selectedSubmodel?.id}`
      );
      setTarifications(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tariflarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setTabLoading(false);
    }
  };

  const fetchSpecifications = async () => {
    setTabLoading(true);
    try {
      const response = await api.get(
        `/technologist/specification/${selectedSubmodel?.id}`
      );
      setSpecifications(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyalarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    selectedSubmodel?.id && fetchTarifications();
    selectedSubmodel?.id && fetchSpecifications();
  }, [selectedSubmodel]);

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
                  <BarChartIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Limit:{" "}
                    {parseFloat(
                      order?.order_model?.rasxod || 0
                    ).toLocaleString() || "N/A"}{" "}
                    so'm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Bitcoin className="h-4 w-4 text-gray-500" />
                  <span
                    className={cn(
                      "font-bold",
                      totalSpendSumma > order?.order_model?.rasxod
                        ? "text-red-500 text-xl"
                        : "text-sm"
                    )}
                  >
                    Jami:{" "}
                    {totalSpendSumma?.toLocaleString("ru-RU", {
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
        </CardContent>
      </Card>

      {order?.order_model?.submodels?.length > 0 && (
        <div className="w-full space-y-4">
          {/* Submodel buttons with flex-wrap */}
          <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg">
            {order?.order_model?.submodels?.map((submodel) => (
              <Button
                key={submodel?.submodel?.id}
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

          {/* Content for selected submodel */}
          {tabLoading ? (
            <div className="mt-4 w-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={30} />
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-medium my-6 ml-2">
                  Spesifikatsiyalar
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full text-white bg-sky-500 hover:bg-sky-600"
                    disabled={tarifDownloading}
                    onClick={() =>
                      navigate(`/technologist/new-spec/${selectedSubmodel?.id}`)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full text-white"
                    disabled={specDownloading}
                    onClick={() => handleDownloadSpec(selectedSubmodel?.id)}
                  >
                    {specDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {/* Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {specifications?.map((spec) => (
                  <Card
                    key={spec.id}
                    className="overflow-hidden border-none shadow-md bg-white hover:shadow-lg transition-all duration-300"
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-gray-800">
                          {spec.name}
                        </CardTitle>
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          {spec.specifications.length} ta
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap justify-between gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => {
                            setSpecDialogOpen(true);
                            setSelectedSpec(spec);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ko'rish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => {
                            navigate(`/technologist/edit-spec/${spec?.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          O'zgartirish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-medium my-6 ml-2">
                  Tarifikatsiyalar
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full text-white bg-sky-500 hover:bg-sky-600"
                    disabled={tarifDownloading}
                    onClick={() =>
                      navigate(
                        `/technologist/new-tarif/${selectedSubmodel?.id}`
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full text-white"
                    disabled={tarifDownloading}
                    onClick={() => handleDownloadTarif(selectedSubmodel?.id)}
                  >
                    {tarifDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Tarifications */}
              {tarifications?.length > 0 && (
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
                                    0
                                  ) || 0),
                                0
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
                                    0
                                  ) || 0),
                                0
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
                      {tarifications.map((tarification) => (
                        <div
                          key={tarification.id}
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
                                  0
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
                                  0
                                )
                                ?.toLocaleString({
                                  minimumFractionDigits: 2,
                                })}{" "}
                              sekund
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-between gap-2 mt-4">
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                              onClick={() => {
                                navigate(
                                  `/technologist/edit-tarif/${tarification?.id}`
                                );
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              O'zgartirish
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
      {/* Spec Dialog - Fixed */}
      <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedSpec?.name}</DialogTitle>
            <DialogDescription>{selectedSpec?.description}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-center">
                  <th className="border border-gray-300 p-1">#</th>
                  <th className="border border-gray-300 p-1">Kod</th>
                  <th className="border border-gray-300 p-1">Nomi</th>
                  <th className="border border-gray-300 p-1">Miqdor</th>
                  <th className="border border-gray-300 p-1">Izoh</th>
                </tr>
              </thead>
              <tbody>
                {selectedSpec?.specifications?.map((spec, index) => (
                  <tr key={spec.id} className="text-center">
                    <td className="border border-gray-300 p-1">{index + 1}</td>
                    <td className="border border-gray-300 p-1">{spec?.code}</td>
                    <td className="border border-gray-300 p-1">{spec?.name}</td>
                    <td className="border border-gray-300 p-1">
                      {spec?.quantity}
                    </td>
                    <td className="border border-gray-300 p-1">
                      {spec?.comment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tarif Dialog - Fixed */}
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
                  <th className="border border-gray-300 p-1">Mashina</th>
                  <th className="border border-gray-300 p-1">Sekund</th>
                  <th className="border border-gray-300 p-1">Summa (so'm)</th>
                </tr>
              </thead>
              <tbody>
                {selectedTarification?.tarifications?.map((tarif, index) => (
                  <tr key={tarif.id} className="text-center">
                    <td className="border border-gray-300 p-1">{index + 1}</td>
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
                      {tarif?.typewriter?.name}
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
    </div>
  );
};

export default OrderView;
