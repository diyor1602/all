import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const ExcelOrders = () => {
  const [data, setData] = useState([]);
  const { toast } = useToast();

  const sendFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/orderManager/import-orders", formData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtmalar Excell faylga yuklandi",
        variant: "success",
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmalar Excell faylga yuklashda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div>
      <Input type="file" onChange={(e) => sendFile(e.target.files[0])} />
    </div>
  );
};

export default ExcelOrders;
