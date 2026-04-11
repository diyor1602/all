import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const All = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);

  const getData = async () => {
    try {
      const response = await api.get("/trucks");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return <div>{JSON.stringify(data)}</div>;
};

export default All;
