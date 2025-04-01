import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";

const CuttingStart = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [cuts, setcuts] = useState(null);
  const [selectedSubmodel, setSelectedSubmodel] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sending, setSending] = useState(false);

  const { id } = useParams();

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCuts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cuttingMaster/cuts/${id}`);
      setcuts(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSubmodel || !selectedSpec || !quantity) {
      toast({
        title: "Diqqat",
        description: "Barcha maydonlar to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }
    try {
      setSending(true);
      await api.post(`/cuttingMaster/markAsCut`, {
        order_id: id,
        category_id: selectedSpec,
        quantity,
      });
      toast({
        title: "Success",
        description: "Muvaffaqiyatli kesildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      fetchCuts();
      fetchOrder();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchCuts();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-1 bg-white rounded-lg p-3">
        <div>
          Buyurtma: <span className="font-semibold">{order?.name}</span>
        </div>
        <div>
          Miqdor: <span className="font-semibold">{order?.quantity} ta</span>
        </div>
        <div>
          Model:{" "}
          <span className="font-semibold">
            {order?.orderModel?.model?.name}
          </span>
        </div>
        <div>
          Material:{" "}
          <span className="font-semibold">
            {order?.orderModel?.material?.name}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 bg-white rounded-lg p-3 mt-4">
        <Select
          value={selectedSubmodel}
          onValueChange={(value) => {
            setSelectedSubmodel(value);
            setSelectedSpec("");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Submodelni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {order?.orderModel?.submodels?.map((submodel) => (
              <SelectItem
                key={submodel?.submodel?.id}
                value={submodel?.submodel?.id}
              >
                {submodel?.submodel?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSpec} onValueChange={setSelectedSpec}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Spetsifikatsiyani tanlang" />
          </SelectTrigger>
          <SelectContent>
            {order?.orderModel?.submodels
              ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
              ?.specification_categories?.map((spec) => (
                <SelectItem key={spec?.id} value={spec?.id}>
                  {spec?.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Miqdor"
          value={quantity}
          type="number"
          onChange={(e) => setQuantity(e.target.value)}
        />
        <Button onClick={handleSave} disabled={sending}>
          {sending ? "Yuborilmoqda..." : "Saqlash"}
        </Button>
      </div>
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuts?.map((cut, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                {cut?.submodel?.name}
              </h3>
              <div className="space-y-2">
                {cut?.cuts?.map((item) => (
                  <div
                    key={item?.id}
                    className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg shadow-sm"
                  >
                    <CircleCheck className="text-green-500 w-5 h-5" />
                    <div>
                      <div className="text-gray-700 font-medium">
                        {item?.category?.name}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {item?.quantity} ta
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CuttingStart;
