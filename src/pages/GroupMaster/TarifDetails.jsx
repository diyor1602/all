import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const TarifDetails = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/groupMaster/orders/all/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  return <div>TarifDetails</div>;
};

export default TarifDetails;
