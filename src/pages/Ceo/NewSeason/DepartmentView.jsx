import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DepartmentView = () => {
  const { toast } = useToast();

  const { id } = useParams();

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ceo/calculateSeason", {
        params: {
          department_id: id,
          month: selectedMonth,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [id, selectedMonth]);

  const handleSubmit = async () => {
    try {
      await api.post("/ceo/employeeSums", {
        month: selectedMonth,
        employee_id: selectedEmployee?.employee?.id,
        sum: editingValue,
      });
      getData();
      setEditDialogOpen(false);
      setEditingValue(null);
      setSelectedEmployee(null);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar saqlanmadi",
      });
    } finally {
      setSending(false);
    }
  };

  const navigateMonth = (direction) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear, newMonth;

    if (direction === "prev") {
      newMonth = month === 1 ? 12 : month - 1;
      newYear = month === 1 ? year - 1 : year;
    } else {
      newMonth = month === 12 ? 1 : month + 1;
      newYear = month === 12 ? year + 1 : year;
    }

    const newMonthString = `${newYear}-${newMonth.toString().padStart(2, "0")}`;
    setSelectedMonth(newMonthString);
    localStorage.setItem("newSeasonSelectedMonth", newMonthString);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth("prev")}
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
          className="w-auto"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div>
        {data?.items?.map((item) => (
          <div key={item?.id} className="flex items-center gap-2">
            <img
              src={item?.employee?.img}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div>{item?.employee?.name}</div>
            <div
              onClick={() => {
                setEditingValue(item?.per_minute_sum);
                setEditDialogOpen(true);
                setSelectedEmployee(item);
              }}
            >
              {item?.per_minute_sum || 0}
            </div>
          </div>
        ))}
      </div>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ma'lumot tahrirlash</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={sending}>
            {sending ? "Yuborilmoqda..." : "Saqlash"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DepartmentView;
