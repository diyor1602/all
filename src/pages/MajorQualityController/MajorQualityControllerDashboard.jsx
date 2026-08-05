import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const MajorQualityControllerDashboard = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("majorQualityController/dashboard", {
        params: {
          date: selectedDate,
        },
      });
      setData(res.data);
    } catch {
      toast({
        title: "Diqqat",
        description: "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedDate]);

  return (
    <div>
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-fit bg-white"
      />

      {loading ? (
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={42} />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div>Bugungi braklar: {data?.summary?.total_today}</div>
            <div>Haftalik braklar: {data?.summary?.total_week}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MajorQualityControllerDashboard;
