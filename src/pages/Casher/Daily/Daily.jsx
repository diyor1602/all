import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const formatNumber = (number) => {
  return parseFloat(number).toLocaleString("ru-RU");
};

const Daily = () => {
  const [daily, setDaily] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const response = await api.get("/casher/dailyReport", {
          params: {
            date: selectedDate,
          },
        });
        setDaily(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Kunlik ma'lumotlarni olishda xatolik",
        });
      }
    };

    const fetchMonthlyExpenses = async () => {
      try {
        const response = await api.get("/casher/monthlyExpense", {
          params: {
            month: selectedDate?.slice(0, -3),
          },
        });
        setMonthlyExpenses(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Oylik harajatlar ma'lumotlarni olishda xatolik",
        });
      }
    };

    fetchDaily();
    fetchMonthlyExpenses();
  }, [selectedDate]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon">
          <ArrowLeft />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-fit bg-white"
        />
        <Button variant="outline" size="icon">
          <ArrowRight />
        </Button>
      </div>
      <div>Dollar kursi: {formatNumber(daily.dollar_rate)} so'm</div>
      <div>
        Transport uchun: {formatNumber(daily.transport_attendance)} so'm
      </div>
      <div>Daromad: {formatNumber(daily.total_earned_uzs)} so'm</div>
      <div>Foyda: {formatNumber(daily.net_profit_uzs)} so'm</div>
      <div>
        Kunlik o'zgarmas harajatlar: {formatNumber(daily.daily_expenses)} so'm
      </div>
      <div>
        Jami harajatlar: {formatNumber(daily.total_fixed_cost_uzs)} so'm
      </div>
      <div>AUP: {formatNumber(daily.aup)} so'm</div>
      <div>KPI: {formatNumber(daily.kpi)} so'm</div>
      <div>Tikuvchilar: {formatNumber(daily.tarification)} so'm</div>

      <div className="w-full overflow-auto">
        <div>Oylik harajatlar</div>
        <table className="border border-collapse w-full whitespace-nowrap">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">N</th>
              <th className="border border-gray-300 p-2">Turi</th>
              <th className="border border-gray-300 p-2">Miqdori</th>
            </tr>
          </thead>
          <tbody>
            {monthlyExpenses?.expenses?.map((expense, i) => (
              <tr key={i}>
                <td className="border border-gray-300 p-2">{i + 1}</td>
                <td className="border border-gray-300 p-2">{expense.type}</td>
                <td className="border border-gray-300 p-2">
                  {formatNumber(expense.amount)} so'm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-full overflow-auto">
        <div>Buyurtmalar: </div>
        <table className="border border-collapse w-full whitespace-nowrap">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Id</th>
              <th className="border border-gray-300 p-2">Nomi</th>
              <th className="border border-gray-300 p-2">Model</th>
              <th className="border border-gray-300 p-2">Narxi</th>
              <th className="border border-gray-300 p-2">Chiqarilgan soni</th>
              <th className="border border-gray-300 p-2">Topgan puli</th>
              <th className="border border-gray-300 p-2">Harajat</th>
              <th className="border border-gray-300 p-2">Daromad</th>
            </tr>
          </thead>
          <tbody>
            {daily.orders?.map((order, i) => (
              <tr key={i}>
                <td className="border border-gray-300 p-2">
                  {order?.order?.id}
                </td>
                <td className="border border-gray-300 p-2">
                  {order?.order?.name}
                </td>
                <td className="border border-gray-300 p-2">
                  {order?.model?.name} &nbsp;
                  {order?.submodels
                    ?.map((submodel) => submodel.name)
                    .join(", ")}
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex flex-col gap-1 items-center">
                    <div>{formatNumber(order?.price_uzs)} so'm</div>
                    <div>{formatNumber(order?.price_usd)} $</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  {formatNumber(order?.total_quantity)} ta
                </td>
                <td className="border border-gray-300 p-2">
                  {formatNumber(order?.total_output_cost_uzs)} so'm
                </td>
                <td className="border border-gray-300 p-2">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger>
                        {formatNumber(order?.total_fixed_cost_uzs)} so'm
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <div>
                            AUP:{" "}
                            {formatNumber(order?.costs_uzs?.attendance_salary)}{" "}
                            so'm
                          </div>
                          <div>
                            KPI: {formatNumber(order?.costs_uzs?.bonuses)} so'm
                          </div>
                          <div>
                            Tikuvchilar:{" "}
                            {formatNumber(
                              order?.costs_uzs?.employee_tarification_logs
                            )}{" "}
                            so'm
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="border border-gray-300 p-2">
                  {formatNumber(order.net_profit_uzs)} so'm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Daily;
