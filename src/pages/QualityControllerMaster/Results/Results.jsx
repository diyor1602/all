import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const Results = () => {
  const { toast } = useToast();

  const [results, setResults] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchResults = async () => {
    try {
      const response = await api.get("/qualityControllerMaster/results", {
        params: { date: selectedDate },
      });
      setResults(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Natijalar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedDate]);

  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button onClick={() => changeDateBy(-1)} variant="outline">
          <ArrowLeft />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-fit bg-white"
        />
        <Button onClick={() => changeDateBy(1)} variant="outline">
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default Results;
