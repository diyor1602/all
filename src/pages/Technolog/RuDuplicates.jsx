import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const RuDuplicates = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("technologist/tarifications/duplicate");
      setData(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return loading ? (
    <div className="w-full h-[90vh] flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={36} />
    </div>
  ) : (
    <div>
      {Object.keys(data || {}).map((key) => (
        <div key={key}>
          <h2>{key}</h2>
          {data[key]?.map((subKey) => (
            <div key={subKey.id}>{subKey?.second}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default RuDuplicates;
