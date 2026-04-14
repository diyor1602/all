import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const Shipments = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("shipmentsSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  const getData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
          {/* Cost breakdown */}
          <div>Narxlar</div>
          <div>
            Yordamchilar:{" "}
            {formatNumber(data?.costs_breakdown?.assistant_salary_total)} so'm
          </div>
          <div>
            Davomat uchun:{" "}
            {formatNumber(data?.costs_breakdown?.attendance_salary_total)} so'm
          </div>{" "}
          <div>
            Kroy uchun:{" "}
            {formatNumber(data?.costs_breakdown?.cutting_salary_total)} so'm
          </div>{" "}
          <div>
            Jami: {formatNumber(data?.costs_breakdown?.grand_total)} so'm
          </div>{" "}
          <div>
            Bonus: {formatNumber(data?.costs_breakdown?.money_logs_total)} so'm
          </div>{" "}
          <div>
            Yangi mavsum ustidan yozilgan:{" "}
            {formatNumber(
              data?.costs_breakdown?.monthly_daily_payment_override_total,
            )}{" "}
            so'm
          </div>{" "}
          <div>
            O'zgarmas xarajatlar:{" "}
            {formatNumber(
              data?.costs_breakdown?.monthly_expense_allocated_total,
            )}{" "}
            so'm
          </div>{" "}
          <div>
            Ishbay ustidan yozilgan:{" "}
            {formatNumber(
              data?.costs_breakdown?.monthly_piecework_override_total,
            )}{" "}
            so'm
          </div>
          <div>
            Oylik ustidan yozilgan:{" "}
            {formatNumber(data?.costs_breakdown?.monthly_salary_override_total)}{" "}
            so'm
          </div>{" "}
          <div>
            Yangi mavsum:{" "}
            {formatNumber(data?.costs_breakdown?.sewing_salary_total)} so'm
          </div>{" "}
          <div>
            Tarifikatsiyalar:{" "}
            {formatNumber(data?.costs_breakdown?.tarification_total)} so'm
          </div>{" "}
          <div>
            Fura ichidagi tarifikatsiyalar:{" "}
            {formatNumber(data?.costs_breakdown?.tarification_truck_only)} so'm
          </div>{" "}
          <div>
            Transport:{" "}
            {formatNumber(data?.costs_breakdown?.transport_allocated_total)}{" "}
            so'm
          </div>{" "}
          <div>
            Ombor: {formatNumber(data?.costs_breakdown?.warehouse_salary_total)}{" "}
            so'm
          </div>{" "}
        </div>
      )}
    </div>
  );
};

export default Shipments;
