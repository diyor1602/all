"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import {
  Check,
  CircleCheck,
  Loader2,
  X,
  Package,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Scissors,
  BarChart3,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const ConnectResult = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState({
    order: null,
    times: [],
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState({
    order_submodel_id: null,
    time_id: null,
    quantity: "",
    comment: "",
    submodelName: "",
    timeValue: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleError = useCallback(
    (error) => {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [timesRes, orderRes] = await Promise.all([
        api.get("/groupMaster/times"),
        api.get(`/groupMaster/orders/show/${id}`),
      ]);

      setData({
        times: timesRes.data,
        order: orderRes.data,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [id, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isFutureTime = (time) => {
    const currentTime = format(new Date(), "HH:mm");
    return time > currentTime;
  };

  const handleOpenDialog = (submodel, time) => {
    setSelectedOutput({
      order_submodel_id: submodel.id,
      time_id: time.id,
      quantity: "",
      comment: "",
      submodelName: submodel.submodel.name,
      timeValue: time.time.slice(0, 5),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedOutput.quantity || Number(selectedOutput.quantity) <= 0) {
      toast({
        title: "Diqqat!",
        description: "Miqdor 0 dan katta bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    if (Number(selectedOutput.quantity) > data.order.quantity) {
      toast({
        title: "Diqqat!",
        description: `Miqdor ${data.order.quantity} dan oshmasin`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/groupMaster/sewingOutputs", {
        order_submodel_id: selectedOutput.order_submodel_id,
        time_id: selectedOutput.time_id,
        quantity: Number(selectedOutput.quantity),
        comment: selectedOutput.comment || null,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (
    !data.order ||
    !data.order.status === "tailoring" ||
    !data.order.status === "pending"
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-bold text-red-500 mb-2">
              Buyurtma topilmadi
            </h2>
            <p className="text-gray-600 mb-4">
              Ushbu buyurtma mavjud emas yoki tikuvda emas
            </p>
            <Button onClick={() => navigate("/groupMaster/result")}>
              Orqaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = Number.parseFloat(
    ((data.order?.quantity - data.order?.remainAmount) / data.order?.quantity) *
      100
  ).toFixed(2);

  return (
    <>
      {/* Existing Accordion Section */}
      <Accordion
        type="single"
        collapsible
        defaultValue={data.order?.orderModel?.submodels?.[0]?.id.toString()}
        className="bg-white rounded-xl shadow-md p-6 mb-6 flex flex-col gap-2"
      >
        {data.order?.orderModel?.submodels?.map((submodel) => {
          return (
            <AccordionItem value={submodel.id.toString()} key={submodel?.id}>
              <AccordionTrigger className="font-semibold text-lg text-primary">
                {submodel?.submodel?.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  {(() => {
                    let foundFirstEmpty = false;

                    const buttons = data.times?.map((time) => {
                      const output = submodel?.sewingOutputs?.find(
                        (output) => output?.time?.time === time?.time
                      );
                      const hasQuantity = output?.quantity > 0;
                      const isFuture = isFutureTime(time?.time);

                      let show = true;
                      let enabled = false;

                      if (hasQuantity) {
                        show = true;
                        enabled = false;
                      } else if (!foundFirstEmpty && !isFuture) {
                        foundFirstEmpty = true;
                        show = true;
                        enabled = true;
                      } else {
                        show = false;
                      }

                      return { time, output, show, enabled };
                    });

                    return buttons
                      .filter((btn) => btn.show)
                      .map(({ time, output, enabled }) => (
                        <Button
                          key={time.id}
                          className={`flex items-center w-full justify-between ${
                            enabled
                              ? "bg-gray-400 text-black"
                              : "bg-gray-200 text-black cursor-not-allowed"
                          }`}
                          disabled={!enabled}
                          onClick={() =>
                            enabled && handleOpenDialog(submodel, time)
                          }
                        >
                          <div>{time?.time?.slice(0, 5)}</div>
                          <div>{output?.quantity || ""}</div>
                          {output?.quantity ? (
                            <CircleCheck
                              className="text-green-500"
                              strokeWidth={2}
                              size={30}
                            />
                          ) : (
                            <Check strokeWidth={2} size={30} />
                          )}
                        </Button>
                      ));
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      {/* Enhanced Top Card Section */}
      <div className="mb-6">
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Hash className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    Buyurtma #{id}
                  </CardTitle>
                  <p className="text-blue-100 font-medium">
                    {data.order?.name}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-sm px-3 py-1"
              >
                <Package className="h-4 w-4 mr-1" />
                {data.order?.orderModel?.model?.name}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    Bajarilish holati
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {completionPercentage}%
                </Badge>
              </div>
              <Progress
                value={Number.parseFloat(completionPercentage)}
                className="h-3 mb-2"
              />
              <div className="flex justify-between text-sm text-green-700">
                <span>
                  Bajarildi: {data.order?.quantity - data.order?.remainAmount}{" "}
                  ta
                </span>
                <span>Qoldiq: {data.order?.remainAmount} ta</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Total Quantity */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Umumiy miqdor
                    </p>
                    <p className="text-xl font-bold text-blue-800">
                      {data.order?.quantity} ta
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Workers */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Bugungi ishchilar
                    </p>
                    <p className="text-xl font-bold text-purple-800">
                      {data.attendanceCount || 0} ta
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Production */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 font-medium">
                      Bugun tikildi
                    </p>
                    <p className="text-xl font-bold text-orange-800">
                      {data.order?.todaySewn || 0} ta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Today's Earnings */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-600 font-medium">
                      Bugungilik topilgan summa
                    </p>
                    <p className="text-lg font-bold text-emerald-800">
                      {Number.parseFloat(
                        data.order?.todayEarned || 0
                      ).toLocaleString("ru-RU")}{" "}
                      so'm
                    </p>
                  </div>
                </div>
              </div>

              {/* Average Monthly Earning */}
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl border border-teal-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-teal-600 font-medium">
                      O'rtacha oylik (1 ishchi)
                    </p>
                    <p className="text-lg font-bold text-teal-800">
                      {Number.parseFloat(
                        data.order?.perEmployeeEarning || 0
                      ).toLocaleString("ru-RU")}{" "}
                      so'm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOutput.submodelName} - {selectedOutput.timeValue}
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
                  Number(selectedOutput.quantity) <= 0
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

export default ConnectResult;
