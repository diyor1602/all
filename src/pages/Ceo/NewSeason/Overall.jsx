import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Overall = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/calculateSeasonWithCosts`, {
        params: {
          month: selectedMonth,
          dollar_rate: 12000,
        },
      });
      setData(response.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response.data.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear, newMonth;

    if (direction === "prev") {
      newMonth = month - 1;
      newYear = year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear = year - 1;
      }
    } else {
      newMonth = month + 1;
      newYear = year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear = year + 1;
      }
    }

    const newMonthString = `${newYear}-${newMonth.toString().padStart(2, "0")}`;
    setSelectedMonth(newMonthString);
    localStorage.setItem("newSeasonSelectedMonth", newMonthString);
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateMonth("prev")}
        disabled={loading}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("newSeasonSelectedMonth", e.target.value);
        }}
        className="w-fit bg-white"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateMonth("next")}
        disabled={loading}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Overall;
