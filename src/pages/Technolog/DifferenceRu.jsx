import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const DifferenceRu = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/technologist/new/orders")
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        toast({
          title: "Xatolik",
          description: "Xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  return <div>DifferenceRu</div>;
};

export default DifferenceRu;
