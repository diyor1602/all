import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";

const New = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/items");
      setItems(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return <div>New</div>;
};

export default New;
