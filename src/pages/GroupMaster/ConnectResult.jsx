import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { Check, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data.order || data.order.status !== "tailoring") {
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
                  {data.times?.map((time) => {
                    const output = submodel?.sewingOutputs?.find(
                      (output) => output?.time?.time === time?.time
                    );
                    const hasQuantity = output?.quantity > 0;
                    const disabled = isFutureTime(time?.time) || hasQuantity;

                    return (
                      <Button
                        key={time.id}
                        className={`flex items-center w-full justify-between bg-gray-200 text-black ${
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={disabled}
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
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
};

export default ConnectResult;
