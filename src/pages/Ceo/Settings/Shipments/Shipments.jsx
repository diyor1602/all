import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const Shipments = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("shipmentsSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  const getData = async () => {
    try {
      const res = await api.get("monthly/trucks", {
        params: {
          month: selectedMonth,
        },
      });
      setData(res.data);
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
  }, [selectedMonth]);

  return (
    <div>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          localStorage.setItem("shipmentsSelectedMonth", e.target.value);
          setSelectedMonth(e.target.value);
        }}
        className="bg-white w-fit"
      />

      {loading ? (
        <div className="h-[90vh] flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <div>
          <h1>Shipments</h1>
        </div>
      )}
    </div>
  );
};

export default Shipments;
