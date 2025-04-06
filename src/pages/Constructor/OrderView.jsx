import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ArrowLeft,
  Loader2,
  BoxIcon,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  RulerIcon,
  UserIcon,
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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function formatDateTime(input) {
  if (!input) return "";

  const [datePart, timePart] = input.split(" ");
  const [year, month, day] = datePart.split("-");

  return `${day}/${month}/${year} ${timePart}`;
}

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [specifications, setSpecifications] = useState([]);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/constructor/orders/${id}`);
        setOrder(response.data);
        setSelectedSubmodel(response.data?.orderModel?.submodels?.[0]);
        setSpecifications(
          response.data?.orderModel?.submodels?.[0]?.specificationCategories ||
            []
        );
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

  const toggleSpecifications = (selectedSubmodel) => {
    setSpecifications(selectedSubmodel?.specificationCategories || []);
  };

  useEffect(() => {
    toggleSpecifications(selectedSubmodel);
  }, [selectedSubmodel]);

  const approveOrder = async () => {
    try {
      setApproving(true);
      await api.post(
        `/constructor/orderPrintingTimes/${order?.order_printing_times?.id}`
      );
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma yakunlandi",
        variant: "default",
      });
      navigate(0);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma yakunlanmadi",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
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
                  {order?.orderModel?.model?.name || "Model"}
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
              </div>
            </div>

            {/* Material Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Material haqida</h4>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BoxIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material: {order?.orderModel?.material?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material kodi: {order?.orderModel?.material?.code || "N/A"}
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

          {order?.order_printing_times && (
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex flex-col gap-2">
              <div className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="mr-1">Rejalashtirilgan vaqt:</span>
                  {formatDateTime(order?.order_printing_times?.planned_time)}
                </div>{" "}
              </div>
              <div className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="mr-1">Haqiqiy vaqt:</span>
                  {formatDateTime(order?.order_printing_times?.actual_time)}
                </div>{" "}
              </div>
              <div className="text-sm flex items-center gap-2">
                <MessageSquareIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="mr-1">Izoh:</span>
                  {order?.order_printing_times?.comment}
                </div>{" "}
              </div>
              <div className="text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="mr-1">Xodim:</span>
                  {order?.order_printing_times?.user?.employee?.name}
                </div>{" "}
              </div>
            </div>
          )}

          {!order?.order_printing_times?.actual_time &&
          order?.order_printing_times?.status == "printing" ? (
            <Button
              className="mt-4"
              variant="destructive"
              onClick={() => setApproveDialogOpen(true)}
            >
              Yakunlash
            </Button>
          ) : (
            <Button className="mt-4 bg-green-500 hover:bg-green-600">
              Yakunlangan
            </Button>
          )}

          {order?.orderModel?.sizes && order.orderModel.sizes.length > 0 && (
            <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                <span>O'lchamlar</span>
              </h4>
              <div className="flex items-center flex-wrap gap-3">
                {order?.orderModel?.sizes?.map((size) => (
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

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-medium my-6 ml-2">Instruksiyalar</h2>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse bg-white text-left">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                  <th className="border-b border-gray-200 p-4 font-medium text-gray-700 w-1/2">
                    Nomi
                  </th>
                  <th className="border-b border-gray-200 p-4 font-medium text-gray-700 w-1/2">
                    Tavsif
                  </th>
                </tr>
              </thead>
              <tbody>
                {order?.instructions?.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border-b border-gray-200 p-4 text-gray-800 font-medium">
                      {item.title}
                    </td>
                    <td className="border-b border-gray-200 p-4 text-gray-600">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-medium ml-2">Submodellar</h2>
        </div>
      </div>

      {order?.orderModel?.submodels?.length > 0 && (
        <div className="w-full">
          <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg">
            {order?.orderModel?.submodels?.map((submodel) => (
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

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-medium my-6 ml-2">
                Spesifikatsiyalar
              </h2>
            </div>
            {/* Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="flex items-center gap-2 ">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buyurtma yakunlash</DialogTitle>
            <DialogDescription>
              Buyurtmani yakunlashni tasdiqlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={approveOrder} disabled={approving}>
              {approving ? "Yakunlanmoqda..." : "Yakunlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
