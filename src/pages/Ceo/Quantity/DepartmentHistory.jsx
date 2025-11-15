import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Loader2, Undo2 } from "lucide-react";
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
  if (!time) return "-";
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
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editBonusDialogOpen, setEditBonusDialogOpen] = useState(false);

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

  const handleUndo = (payment) => {
    setSelectedPayment(payment);
    setEditBonusDialogOpen(true);
  };

  const handleUndoSubmit = async () => {
    try {
      setSubmitting(true);

      const requests = selectedPayment?.details?.map((detail) => {
        return api.patch(`/ceo/dailyPayments/${detail.payment_id}`, {
          bonus: detail?.potential_earn - detail?.calculated_amount,
        });
      });

      await Promise.all(requests);

      toast({
        title: "Muvaffaqiyatli",
        description: "Qoldiq qayta qo'shildi",
        variant: "default",
      });

      fetchData();
      setEditBonusDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Qoldiq qayta qo'shishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
                  <th className="border border-gray-200 p-2 font-medium">№</th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Xodim
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Kelgan
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Ketgan
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Topgan
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    100%
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Qoldiq
                  </th>
                  <th className="border border-gray-200 p-2 font-medium">
                    Bonus
                  </th>
                </tr>
              </thead>

              <tbody>
                {data?.payments
                  ?.sort(
                    (a, b) =>
                      b.total_calculated_amount - a.total_calculated_amount
                  )
                  .map((payment, index) => {
                    const attendance = data?.attendances?.find(
                      (a) => a?.employee_id == payment?.employee_id
                    );

                    const checkIn = formatAttendanceTime(attendance?.check_in);
                    const checkOut = formatAttendanceTime(
                      attendance?.check_out
                    );

                    const total = payment.total_calculated_amount;
                    const potential = payment.total_potential_earn;
                    const remaining = potential - total;
                    const bonus = payment.details?.reduce(
                      (sum, detail) => sum + (detail?.bonus || 0),
                      0
                    );

                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors cursor-default"
                      >
                        <td className="border border-gray-200 p-2 text-center">
                          {index + 1}
                        </td>

                        <td className="border border-gray-200 p-2 text-left">
                          {payment.employee_name}
                        </td>

                        <td className="border border-gray-200 p-2 text-center">
                          {checkIn}
                        </td>

                        <td className="border border-gray-200 p-2 text-center">
                          {checkOut}
                        </td>

                        <td className="border border-gray-200 p-2 text-center">
                          <div
                            className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                            onClick={() => {
                              setSelectedEmployee(payment);
                              setEmployeeDialogOpen(true);
                            }}
                          >
                            {formatNumber(total)}
                          </div>
                        </td>

                        <td className="border border-gray-200 p-2 text-center">
                          {formatNumber(potential)}
                        </td>

                        <td className="border border-gray-200 p-2 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            {formatNumber(remaining)}
                            <Button
                              onClick={() => {
                                handleUndo(payment);
                              }}
                              variant="ghost"
                              size="icon"
                            >
                              <Undo2 className="text-orange-500" />
                            </Button>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          {formatNumber(bonus)}
                        </td>
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
                    const totalBonus = data?.payments?.reduce(
                      (sum, p) =>
                        sum +
                        (p?.details?.reduce((s, d) => s + (d?.bonus || 0), 0) ||
                          0),
                      0
                    );

                    return (
                      <>
                        <td className="border border-gray-200 p-2 text-center text-gray-700">
                          {formatNumber(totalEarned)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center text-gray-700">
                          {formatNumber(totalPotential)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center text-gray-700">
                          {formatNumber(totalRemaining)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center text-gray-700">
                          {formatNumber(totalBonus)}
                        </td>
                      </>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Absent employees */}

      <div className="w-full overflow-auto mt-5">
        <div className="text-lg font-medium mb-2">Hisoblanmagan xodimlar</div>
        <table className="border border-collapse text-xs w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-200 p-2">№</th>
              <th className="border border-gray-200 p-2">Ism</th>
              <th className="border border-gray-200 p-2">Lavozim</th>
            </tr>
          </thead>
          <tbody>
            {data?.working_employees
              ?.filter(
                (employee) =>
                  !data?.payments?.some(
                    (payment) => payment?.employee_id === employee?.id
                  )
              )
              ?.map((employee, index) => (
                <tr key={index}>
                  <td className="border border-gray-200 p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {employee.name}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {employee.position?.name}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Employee dialog */}
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
                    "Submodel",
                    "Foiz",
                    "Topilgan summa",
                    "Tegishli son",
                    "Chiqarilgan son",
                    "Farq dona",
                    "Qoldiq",
                    "Bonus",
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
                      item?.submodel?.name,
                      item?.employee_percentage?.toFixed(2),
                      formatNumber(item?.calculated_amount),
                      formatNumber(item?.daily_quantity),
                      formatNumber(item?.day_output_quantity),
                      formatNumber(difference),
                      formatNumber(diffAmount),
                      formatNumber(item?.bonus),
                    ];

                    return (
                      <tr key={index}>
                        {cells.map((cell, i) => (
                          <td
                            key={i}
                            className={`border border-gray-300 p-2 ${
                              i === 1 || i === 2 ? "text-left" : "text-center"
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
                    colSpan={4}
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

                    const totalBonus = selectedEmployee?.details?.reduce(
                      (sum, item) => sum + (item?.bonus || 0),
                      0
                    );

                    const totalCells = [
                      ...totals.map(formatNumber),
                      formatNumber(totalDiff),
                      formatNumber(totalDiffAmount),
                      formatNumber(totalBonus),
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
      {/* Bonus dialog */}
      <Dialog open={editBonusDialogOpen} onOpenChange={setEditBonusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPayment?.employee_name}</DialogTitle>
            <DialogDescription>
              <span className="font-bold">
                {formatNumber(
                  selectedPayment?.total_potential_earn -
                    selectedPayment?.total_calculated_amount
                )}
              </span>{" "}
              jarimala pullarini qaytarishni xohlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end flex-wrap gap-2">
            <Button variant="outline">Bekor qilish</Button>
            <Button
              onClick={handleUndoSubmit}
              disabled={submitting}
              className="w-fit"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" /> Tasdiqlanmoqda
                </>
              ) : (
                "Tasdiqlash"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DepartmentHistory;
