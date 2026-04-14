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
        <>
          {/* Cost breakdown */}
          <div className="space-y-2">
            <div>Narxlar</div>
            <div>
              Yordamchilar:{" "}
              {formatNumber(data?.costs_breakdown?.assistant_salary_total)} so'm
            </div>
            <div>
              Davomat uchun:{" "}
              {formatNumber(data?.costs_breakdown?.attendance_salary_total)}{" "}
              so'm
            </div>{" "}
            <div>
              Kroy uchun:{" "}
              {formatNumber(data?.costs_breakdown?.cutting_salary_total)} so'm
            </div>{" "}
            <div>
              Jami: {formatNumber(data?.costs_breakdown?.grand_total)} so'm
            </div>{" "}
            <div>
              Bonus: {formatNumber(data?.costs_breakdown?.money_logs_total)}{" "}
              so'm
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
              {formatNumber(
                data?.costs_breakdown?.monthly_salary_override_total,
              )}{" "}
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
              {formatNumber(data?.costs_breakdown?.tarification_truck_only)}{" "}
              so'm
            </div>{" "}
            <div>
              Transport 1 kishi:{" "}
              {formatNumber(data?.costs_breakdown?.transport_allocated_total)}{" "}
              so'm
            </div>{" "}
            <div>
              Ombor:{" "}
              {formatNumber(data?.costs_breakdown?.warehouse_salary_total)} so'm
            </div>{" "}
          </div>
          {/* Summary breakdown */}
          <div className="space-y-2">
            <div>Summary</div>
            <div>
              Umumiy maosh: {formatNumber(data?.summary?.actual_total_cost_uzs)}{" "}
              so'm
            </div>
            <div>
              Farqi: {formatNumber(data?.summary?.excess_cost_uzs)} so'm
            </div>{" "}
            <div>
              Furadagi oylik: {formatNumber(data?.summary?.fair_share_cost_uzs)}{" "}
              so'm
            </div>{" "}
            <div>GAP: {formatNumber(data?.summary?.gap_uzs)} so'm</div>{" "}
            <div>
              Oylik o'zgarmas xarajatlar:{" "}
              {formatNumber(data?.summary?.monthly_expenses_total_uzs)} so'm
            </div>{" "}
            <div>
              Foiz: {formatNumber(data?.summary?.proportion_percent)} so'm
            </div>{" "}
            <div>
              Jami ishlab chiqarilgan mahsulot:{" "}
              {formatNumber(data?.summary?.total_produced_qty)} so'm
            </div>{" "}
            <div>
              Tushum: {formatNumber(data?.summary?.total_revenue_uzs)} so'm
            </div>{" "}
            <div>
              Jo'nab ketgan mahsulot:{" "}
              {formatNumber(data?.summary?.total_shipped_qty)} so'm
            </div>{" "}
            <div>
              Transport: {formatNumber(data?.summary?.transport_total_uzs)} so'm
            </div>{" "}
          </div>
        </>
      )}
    </div>
  );
};

export default Shipments;
