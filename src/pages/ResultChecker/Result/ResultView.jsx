import api from "@/utils/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Check,
  CircleCheck,
  X,
  Loader2,
} from "lucide-react";
import { statuses } from "@/lib/status";

const isFutureTime = (timeString) => {
  // if (!timeString) return false;
  // const [hours, minutes] = timeString.split(":").map(Number);
  // const now = new Date();
  // const time = new Date();
  // time.setHours(hours, minutes, 0, 0);
  // return time > now;
  return false;
};

const getStatusVariant = (status) => {
  const statusConfig = statuses[status] || statuses.inactive;
  return `${statusConfig.secondaryBg} ${statusConfig.textColor}`;
};

const getStatusText = (status) => {
  return statuses[status]?.text || "Noma'lum";
};

const getCardBackground = (index) => {
  const colors = [
    "bg-blue-100 border-l-4 border-blue-400",
    "bg-emerald-100 border-l-4 border-emerald-400",
    "bg-amber-100 border-l-4 border-amber-400",
    "bg-violet-100 border-l-4 border-violet-400",
    "bg-rose-100 border-l-4 border-rose-400",
    "bg-cyan-100 border-l-4 border-cyan-400",
    "bg-lime-100 border-l-4 border-lime-400",
  ];
  return colors[index % colors.length];
};

const ResultView = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [times, setTimes] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState({
    order_id: null,
    time_id: null,
    quantity: "",
    comment: "",
    order_submodel_id: null,
    modelName: "",
    timeValue: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/resultChecker/groups", {
          params: {
            department_id: id,
          },
        });
        setData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Natija ma'lumotlari olishda xatolik yuz berdi.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchTimes = async () => {
      setLoading(true);
      try {
        const response = await api.get("/resultChecker/times");
        setTimes(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Natija ma'lumotlari olishda xatolik yuz berdi.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleOpenDialog = (order, time) => {
    setSelectedOutput({
      order_id: order.id,
      order_submodel_id: order.submodel?.id,
      time_id: time.id,
      quantity: "",
      comment: "",
      modelName: `${order.model?.name} - ${order.submodel?.name}`,
      timeValue: time.time.slice(0, 5),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedOutput.quantity || Number(selectedOutput.quantity) < 0) {
      toast({
        title: "Diqqat!",
        description: "Miqdor 0 dan katta bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        order_id: selectedOutput.order_id,
        order_submodel_id: selectedOutput.order_submodel_id,
        time_id: selectedOutput.time_id,
        quantity: Number(selectedOutput.quantity),
        comment: selectedOutput.comment || null,
      };
      await api.post("/resultChecker/sewingOutputs", payload);

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      setDialogOpen(false);
      // Refresh data
      const response = await api.get("/resultChecker/groups", {
        params: { department_id: id },
      });
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni saqlashda xatolik yuz berdi",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Guruhlar</h1>

      <div className="grid grid-cols-1 gap-6">
        {data
          ?.sort((a, b) => a?.name?.localeCompare(b?.name))
          ?.map((group, index) => (
            <Card
              key={group?.id}
              className={`overflow-hidden transition-all duration-300 h-fit ${getCardBackground(
                index,
              )}`}
            >
              <CardHeader className="bg-gray-50 p-4 border-b">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">
                    {group?.name}
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Bugungi umumiy:{" "}
                    {group.orders?.reduce(
                      (sum, order) => sum + (order.todayTotalQuantity || 0),
                      0,
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Mas'ul: {group?.responsibleUser?.name}
                </p>
              </CardHeader>

              <CardContent className="p-0">
                {group?.orders?.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {group.orders?.map((order, index) => (
                      <div key={index} className="p-4 ">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              <span className="text-xs text-gray-500">
                                {order?.orderId}
                              </span>{" "}
                              {order.orderName} - {order.submodel?.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={getStatusVariant(order.status)}
                              >
                                {getStatusText(order.status)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {order.totalQuantity || 0} /{" "}
                                {order.orderQuantity}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Bugungi: {order.todayTotalQuantity}
                          </Badge>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>
                              {Math.round(
                                (order.totalQuantity / order.orderQuantity) *
                                  100,
                              ) || 0}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (order.totalQuantity / order.orderQuantity) *
                                100 || 0
                            }
                            className="h-2"
                          />
                        </div>

                        {order.sewingOutputs?.length >= 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">
                              Natijalar
                            </h4>
                            <div className="space-y-2">
                              {(() => {
                                let foundFirstEmpty = false;
                                const hasSewingOutputs =
                                  order.sewingOutputs?.length > 0;
                                const isExpanded =
                                  expandedOrders[order.id] || hasSewingOutputs;

                                const buttons =
                                  times
                                    ?.filter((time) => time.time !== "07:30:00")
                                    ?.map((time) => {
                                      const output = order.sewingOutputs?.find(
                                        (output) =>
                                          output?.time?.time === time?.time,
                                      );
                                      const hasQuantity = output?.quantity >= 0;
                                      const isFuture = isFutureTime(time?.time);

                                      let show = true;
                                      let enabled = false;

                                      if (hasQuantity) {
                                        show = true;
                                        enabled = false;
                                      } else if (
                                        !foundFirstEmpty &&
                                        !isFuture
                                      ) {
                                        foundFirstEmpty = true;
                                        show = true;
                                        enabled = true;
                                      } else if (isExpanded) {
                                        show = true;
                                        enabled = !isFuture;
                                      } else {
                                        show = false;
                                      }

                                      return { time, output, show, enabled };
                                    }) || [];

                                return (
                                  <>
                                    {buttons
                                      .filter((btn) => btn.show)
                                      .map(({ time, output, enabled }, i) => (
                                        <Button
                                          key={time.id}
                                          className={`flex items-center w-full justify-between ${
                                            enabled
                                              ? "bg-gray-400 text-black"
                                              : "bg-gray-200 text-black cursor-not-allowed"
                                          } py-2 px-4 rounded-md`}
                                          disabled={!enabled}
                                          onClick={() =>
                                            enabled &&
                                            handleOpenDialog(order, time)
                                          }
                                        >
                                          <span>
                                            {time?.time?.substring(0, 5)}
                                          </span>
                                          <span className="font-medium">
                                            {output?.quantity || ""}
                                          </span>
                                          {output?.quantity ? (
                                            <CircleCheck
                                              className="text-green-500"
                                              strokeWidth={2}
                                              size={20}
                                            />
                                          ) : (
                                            <Check strokeWidth={2} size={20} />
                                          )}
                                        </Button>
                                      ))}
                                    {!hasSewingOutputs &&
                                      buttons.some((btn) => btn.show) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full mt-2 text-xs text-gray-500"
                                          onClick={() =>
                                            setExpandedOrders((prev) => ({
                                              ...prev,
                                              [order.id]: !prev[order.id],
                                            }))
                                          }
                                        >
                                          {isExpanded ? (
                                            <>
                                              Yopish
                                              <ChevronUp className="ml-1 h-4 w-4" />
                                            </>
                                          ) : (
                                            <>
                                              Barcha vaqtlarni ko'rsatish
                                              <ChevronDown className="ml-1 h-4 w-4" />
                                            </>
                                          )}
                                        </Button>
                                      )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Bu guruhga tegishli buyurtmalar mavjud emas.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Submission Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOutput.modelName} - {selectedOutput.timeValue}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Miqdor
              </Label>
              <Input
                id="quantity"
                type="number"
                value={selectedOutput.quantity}
                onChange={(e) =>
                  setSelectedOutput({
                    ...selectedOutput,
                    quantity: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Miqdor kiriting"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Izoh
              </Label>
              <Textarea
                id="comment"
                value={selectedOutput.comment}
                onChange={(e) =>
                  setSelectedOutput({
                    ...selectedOutput,
                    comment: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Izoh qoldirish (majburiy emas)"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-end items-center gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="gap-2">
                  <X size={16} /> Bekor qilish
                </Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedOutput.quantity ||
                  Number(selectedOutput.quantity) < 0
                }
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Saqlash
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResultView;
