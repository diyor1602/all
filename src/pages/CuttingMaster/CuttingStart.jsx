import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CuttingStart = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cuttingCount, setCuttingCount] = useState("");
  const [boxCount, setBoxCount] = useState("");

  const getOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
      if (response.data.order_model.submodels.length === 1) {
        setSelectedSubmodel(response.data.order_model.submodels[0].id);
      }
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtmani yuklashda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  const handleCutting = async () => {
    // check if selectedSubmodel and selectedSize are not empty
    if (!selectedSubmodel) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Submodelni tanlang",
      });
      return;
    }
    if (!selectedSize) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "O'lchamni tanlang",
      });
      return;
    }
    if (!cuttingCount) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Kesish sonini kiriting",
      });
      return;
    }
    if (!boxCount) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Quti sig'imi kiriting",
      });
      return;
    }
    try {
      setIsSending(true);
      const response = await api.get(`/cuttingMaster/markAsCut`, {
        params: {
          order_id: id,
          quantity: cuttingCount,
          submodel_id: selectedSubmodel,
          size_id: selectedSize,
          box_capacity: boxCount,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${order?.id} ${order?.name} kesish.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // optional cleanup
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kesish PDF fayl yuklab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex items-center justify-center w-full h-screen">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div>Buyurtma nomi: {order?.name}</div>
              <div>Buyurtma raqami: {order?.id}</div>
              <div>Izoh: {order?.comment}</div>
              <div>Miqdori: {order?.quantity} ta</div>
              <div>Model: {order?.order_model?.model?.name}</div>
              <div>Material: {order?.order_model?.material?.name || "-"}</div>
              {order?.start_date && (
                <div>
                  Boshlanish vaqti:{" "}
                  {order?.start_date
                    ?.split(" ")[0]
                    .split("-")
                    .reverse()
                    .join(".")}
                </div>
              )}
              {order?.end_date && (
                <div>
                  Tugash vaqti:{" "}
                  {order?.end_date
                    ?.split(" ")[0]
                    .split("-")
                    .reverse()
                    .join(".")}
                </div>
              )}
              <div>
                Submodellar:{" "}
                <div className="flex flex-wrap gap-2">
                  {order?.order_model?.submodels.map((submodel) => (
                    <span key={submodel.id}>{submodel.submodel?.name}</span>
                  ))}
                </div>
              </div>
              <div>
                O'lchamlar:{" "}
                <div className="flex flex-wrap gap-2">
                  {order?.order_model?.sizes.map((size) => (
                    <span key={size.id}>
                      {size.size?.name} & {size?.quantity} ta
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex flex-col gap-4">
              <div>Submodellar:</div>
              <div className="flex flex-wrap gap-2 items-center">
                {order?.order_model?.submodels.map((submodel) => (
                  <Button
                    key={submodel.id}
                    onClick={() => setSelectedSubmodel(submodel.id)}
                    variant={
                      selectedSubmodel === submodel.id ? "default" : "outline"
                    }
                  >
                    {submodel.submodel?.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>O'lchamlar:</div>
              <div className="flex flex-wrap gap-2 items-center">
                {order?.order_model?.sizes.map((size) => (
                  <Button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    variant={selectedSize === size.id ? "default" : "outline"}
                  >
                    {size.size?.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cutting_count">Kesish soni</Label>
              <Input
                id="cutting_count"
                placeholder="Kesish soni"
                value={cuttingCount}
                onChange={(e) => setCuttingCount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="box_count">Quti sig'imi</Label>
              <Input
                id="box_count"
                placeholder="Quti sig'imi"
                value={boxCount}
                onChange={(e) => setBoxCount(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCutting} disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""}
            {isSending ? "Yuklanmoqda" : "Kesish"}
          </Button>
        </>
      )}
    </div>
  );
};

export default CuttingStart;
