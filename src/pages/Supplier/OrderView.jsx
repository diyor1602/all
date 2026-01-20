import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const OrderView = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const getOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/supplier/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Buyurtma ma'lumotlari olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, []);

  return <div>OrderView</div>;
};

export default OrderView;
