import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

// Helper to get start and end dates of a month
const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0)); // last day of the month
  return {
    start_date: new Date(start.getTime() + 5 * 60 * 60 * 1000) // add GMT+5
      .toISOString()
      .slice(0, 10),
    end_date: new Date(end.getTime() + 5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  };
};

const SalaryDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  // Get current date in GMT+5
  const now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  // Get stored filters or default
  const stored = localStorage.getItem("salary2-filters");
  const initialFilters = stored
    ? JSON.parse(stored)
    : getMonthRange(currentYear, currentMonth);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedMonth, setSelectedMonth] = useState(
    filters.start_date.substring(0, 7)
  );

  useEffect(() => {
    localStorage.setItem("salary2-filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const fetchSalaryDetails = async () => {
      try {
        const response = await api.get(`/casher/employees/${id}`, {
          params: {
            start_date: filters.start_date,
            end_date: filters.end_date,
          },
        });
        console.log(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday ma'lumot topilmadi",
          variant: "destructive",
        });
      }
    };

    fetchSalaryDetails();
  }, [id, filters]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              const range = getMonthRange(year, month - 1);
              setSelectedMonth(e.target.value);
              setFilters(range);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SalaryDetails;
