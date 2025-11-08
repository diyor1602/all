import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};

const formatAttendanceTime = (time) => {
  if (!time) return "00:00";
  const hours = time.split(" ")[1]?.slice(0, 5);
  return hours;
};

const DepartmentHistory = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    return (
      localStorage.getItem("departmentSelectedDay") ||
      new Date().toISOString().slice(0, 10)
    );
  });
  const [departmenDetails, setDepartmenDetails] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);

  useEffect(() => {
    fetchDepartmenDetails();
  }, [id]);

  const fetchDepartmenDetails = async () => {
    try {
      const response = await api.get(`/ceo/departments/${id}`);
      setDepartmenDetails(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDay]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/dailyPayments/daily`, {
        params: {
          date: selectedDay,
          department_id: id,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={() => {
                const date = new Date(selectedDay);
                date.setDate(date.getDate() - 1);
                setSelectedDay(date.toISOString().slice(0, 10));
                localStorage.setItem(
                  "departmentSelectedDay",
                  date.toISOString().slice(0, 10)
                );
              }}
            >
              <ChevronLeft />
            </Button>
            <Input
              type="date"
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value);
                localStorage.setItem("departmentSelectedDay", e.target.value);
              }}
              disabled={loading}
              className="w-fit bg-white"
            />
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={() => {
                const date = new Date(selectedDay);
                date.setDate(date.getDate() + 1);
                setSelectedDay(date.toISOString().slice(0, 10));
                localStorage.setItem(
                  "departmentSelectedDay",
                  date.toISOString().slice(0, 10)
                );
              }}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="text-lg font-semibold">{departmenDetails?.name}</div>
        </div>
        <div className="mt-6">
          <div
            className={`overflow-auto shadow-sm bg-white/70 backdrop-blur-md transition-all ${
              loading ? "opacity-50" : ""
            }`}
          >
            <table className="w-full text-xs border border-gray-200 border-collapse">
              <thead className="bg-gray-100/70">
                <tr>
                  {[
                    "№",
                    "Xodim",
                    "Kelgan",
                    "Ketgan",
                    "Topgan",
                    "100%",
                    "Qoldiq",
                  ].map((header, i) => (
                    <th
                      key={i}
                      className="border border-gray-200 p-2 font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data?.payments
                  ?.sort(
                    (a, b) =>
                      b.total_calculated_amount - a.total_calculated_amount
                  )
                  .map((payment, index) => {
                    const remaining =
                      payment.total_potential_earn -
                      payment.total_calculated_amount;
                    const cells = [
                      index + 1,
                      payment.employee_name,
                      formatAttendanceTime(
                        data?.attendances?.find(
                          (attendance) =>
                            attendance?.employee_id == payment?.employee_id
                        )?.check_in
                      ),
                      formatAttendanceTime(
                        data?.attendances?.find(
                          (attendance) =>
                            attendance?.employee_id == payment?.employee_id
                        )?.check_out
                      ),
                      formatNumber(payment.total_calculated_amount),
                      formatNumber(payment.total_potential_earn),
                      formatNumber(remaining),
                    ];

                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors cursor-default"
                      >
                        {cells.map((cell, i) => (
                          <td
                            key={i}
                            className={`border border-gray-200 p-2 ${
                              i === 1 ? "text-left" : "text-center"
                            }`}
                          >
                            {i === 4 ? (
                              <div
                                className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                                onClick={() => {
                                  setSelectedEmployee(payment);
                                  setEmployeeDialogOpen(true);
                                }}
                              >
                                {cell}
                              </div>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>

              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td
                    colSpan={4}
                    className="border border-gray-200 p-2 text-center text-gray-700"
                  >
                    Jami
                  </td>

                  {(() => {
                    const totalEarned = data?.payments?.reduce(
                      (sum, p) => sum + (p?.total_calculated_amount || 0),
                      0
                    );
                    const totalPotential = data?.payments?.reduce(
                      (sum, p) => sum + (p?.total_potential_earn || 0),
                      0
                    );
                    const totalRemaining = totalPotential - totalEarned;

                    return [totalEarned, totalPotential, totalRemaining].map(
                      (val, i) => (
                        <td
                          key={i}
                          className="border border-gray-200 p-2 text-center text-gray-700"
                        >
                          {formatNumber(val)}
                        </td>
                      )
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      {/* Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="w-full md:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.employee_name}</DialogTitle>
            <DialogDescription>
              {formatNumber(selectedEmployee?.total_calculated_amount)} so'm
            </DialogDescription>
          </DialogHeader>

          <div className="w-full overflow-auto whitespace-nowrap max-h-[70vh]">
            <table className="w-full border border-collapse text-xs">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "№",
                    "Buyurtma",
                    "Foiz",
                    "Topilgan summa",
                    "Tegishli son",
                    "Chiqarilgan son",
                    "Farq dona",
                    "Farq summa",
                  ].map((header, i) => (
                    <th key={i} className="border border-gray-300 p-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {selectedEmployee?.details
                  ?.sort((a, b) => b?.calculated_amount - a?.calculated_amount)
                  ?.map((item, index) => {
                    const difference =
                      item?.day_output_quantity - item?.daily_quantity;
                    const diffAmount =
                      (item?.calculated_amount / item?.daily_quantity) *
                      difference;

                    const cells = [
                      index + 1,
                      item?.order?.name,
                      item?.employee_percentage?.toFixed(2),
                      formatNumber(item?.calculated_amount),
                      formatNumber(item?.daily_quantity),
                      formatNumber(item?.day_output_quantity),
                      formatNumber(difference),
                      formatNumber(diffAmount),
                    ];

                    return (
                      <tr key={index}>
                        {cells.map((cell, i) => (
                          <td
                            key={i}
                            className={`border border-gray-300 p-2 ${
                              i === 1 ? "text-left" : "text-center"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>

              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td
                    colSpan={3}
                    className="border border-gray-300 p-2 text-center"
                  >
                    Jami
                  </td>
                  {(() => {
                    const totals = [
                      "calculated_amount",
                      "daily_quantity",
                      "day_output_quantity",
                    ].map((key) =>
                      selectedEmployee?.details?.reduce(
                        (sum, item) => sum + (item?.[key] || 0),
                        0
                      )
                    );

                    const totalDiff = selectedEmployee?.details?.reduce(
                      (sum, item) =>
                        sum +
                        (item?.day_output_quantity - item?.daily_quantity),
                      0
                    );

                    const totalDiffAmount = selectedEmployee?.details?.reduce(
                      (sum, item) =>
                        sum +
                        (item?.calculated_amount / item?.daily_quantity) *
                          (item?.day_output_quantity - item?.daily_quantity),
                      0
                    );

                    const totalCells = [
                      ...totals.map(formatNumber),
                      formatNumber(totalDiff),
                      formatNumber(totalDiffAmount),
                    ];

                    return totalCells.map((val, i) => (
                      <td
                        key={i}
                        className="border border-gray-300 p-2 text-center"
                      >
                        {val}
                      </td>
                    ));
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DepartmentHistory;
