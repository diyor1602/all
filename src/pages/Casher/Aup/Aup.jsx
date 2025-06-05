import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Aup = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/casher/employees/aup");
        setData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Ma'lumotlar olishda xatolik yuz berish mumkin",
        });
      }
    };
    fetchData();
  }, []);

  return <div></div>;
};

export default Aup;
