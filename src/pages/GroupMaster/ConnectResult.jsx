import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { Check, CircleCheck, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

      // Close dialog and refresh data
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
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Buyurtma topilmadi
          </h2>
          <p className="text-gray-600">
            Ushbu buyurtma mavjud emas yoki tikuvda emas
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/groupMaster/result")}
          >
            Orqaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex flex-col gap-2">
        <div className="font-semibold text-lg">
          <span className="text-primary">#{id}</span>
          <span> / {data.order?.name}</span>
        </div>
        <div>
          Model:{" "}
          <span className="font-semibold">
            {data.order?.orderModel?.model?.name}
          </span>
        </div>
        <div>
          Miqdor:{" "}
          <span className="font-semibold">{data.order?.quantity} ta</span>
        </div>
      </div>
      <Accordion
        type="single"
        collapsible
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
                    const buttons = data.times?.map((time) => {
                      const output = submodel?.sewingOutputs?.find(
                        (output) => output?.time?.time === time?.time
                      );
                      const hasQuantity = output?.quantity > 0;
                      const disabled = isFutureTime(time?.time) || hasQuantity;

                      return { time, output, disabled };
                    });

                    // Find the first button without quantity to enable
                    const buttonToEnable = buttons.find((btn) => !btn.disabled);

                    return buttons.map(({ time, output, disabled }) => {
                      const isEnabled =
                        buttonToEnable && buttonToEnable.time === time;
                      return (
                        <Button
                          key={time.id}
                          className={`flex items-center w-full justify-between bg-gray-400 text-black ${
                            !isEnabled ? "bg-gray-200 cursor-not-allowed" : ""
                          }`}
                          disabled={!isEnabled}
                          onClick={() =>
                            isEnabled && handleOpenDialog(submodel, time)
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
                      );
                    });
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Sewing Output Dialog */}
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
