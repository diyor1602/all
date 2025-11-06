import { Link, useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const DepartmenDetails = () => {
  const { toast } = useToast();
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [percentageOpen, setPercentageOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newPercentage, setNewPercentage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [editDepartmentDialogOpen, setEditDepartmentDialogOpen] =
    useState(false);
  const [budgetType, setBudgetType] = useState("minute_based"); // percentage_based
  const [isNew, setIsNew] = useState(false);
  const [budgetQuantity, setBudgetQuantity] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return (
      localStorage.getItem("qSelectedMonth") ||
      new Date().toISOString().slice(0, 7)
    );
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ceo/departments/${id}`, {
        params: {
          month: selectedMonth,
        },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleSubmit = async () => {
    const availablePercentage =
      100 -
      data?.employees?.reduce(
        (acc, emp) =>
          acc +
          (selectedEmployee?.id === emp?.id ? 0 : parseFloat(emp?.percentage)),
        0
      );

    if (newPercentage > availablePercentage) {
      toast({
        title: "Diqqat",
        description: `Jami foiz 100% dan oshib ketmoqda. Maksimum ${availablePercentage?.toFixed(
          2
        )}% kirita olasiz.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/ceo/employeePercentage/${selectedEmployee?.id}`, {
        percentage: newPercentage,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Ulush muvaffaqiyatli o'zgartirildi",
      });
      fetchData();
      setPercentageOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ulushni o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDepartmentSubmit = async () => {
    if (budgetQuantity < 0) {
      toast({
        title: "Diqqat",
        description: "Budjet miqdori 0 dan kichik bo'lmaydi!",
        variant: "destructive",
      });
      return;
    }
    if (!budgetType) {
      toast({
        title: "Diqqat",
        description: "Budjet turi bo'lishi shart!",
        variant: "destructive",
      });
      return;
    }
    if (budgetType === "percentage_based" && budgetQuantity > 100) {
      toast({
        title: "Diqqat",
        description: "Foiz 100 dan kichik bo'lishi shart",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (isNew) {
        await api.post(`/ceo/departmentBudgets`, {
          type: budgetType,
          quantity: budgetQuantity,
          department_id: data?.id,
        });
      } else {
        await api.patch(`/ceo/departmentBudgets/${data?.budget?.id}`, {
          type: budgetType,
          quantity: budgetQuantity,
        });
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Bo'lim muvaffaqiyatli yangilandi",
      });
      fetchData();
      setEditDepartmentDialogOpen(false);
      setSubmitting(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Bo'lim yangilashda xatolik",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="flex items-center gap-2">
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            localStorage.setItem("qSelectedMonth", e.target.value);
          }}
          className="w-fit bg-white"
          disabled={loading}
        />
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {data?.name || "-"}
          </h2>
          <div
            className="text-xl font-semibold cursor-pointer"
            onClick={() => {
              setEditDepartmentDialogOpen(true);
              setBudgetType(data?.budget?.type);
              setBudgetQuantity(data?.budget?.quantity);
            }}
          >
            {data?.budget?.quantity}{" "}
            {data?.budget?.type == "percentage_based" ? "%" : "so'm"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" /> Yuklanmoqda
              </span>
            ) : (
              "Yangilash"
            )}
          </Button>
        </div>

        <div className="overflow-auto rounded-lg border border-gray-200">
          <table
            className={`w-full text-sm text-gray-700 ${
              loading ? "opacity-50" : ""
            }`}
          >
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">№</th>
                <th className="py-3 px-4 text-left">Rasm</th>
                <th className="py-3 px-4 text-left">Xodim</th>
                <th className="py-3 px-4 text-left">Lavozimi</th>
                <th className="py-3 px-4 text-left">Oyligi</th>
                <th className="py-3 px-4 text-center">Ulushi (%)</th>
                <th className="py-3 px-4 text-center">Topdi</th>
                <th className="py-3 px-4 text-center">Topa oladi</th>
                <th className="py-3 px-4 text-center">Mavsumda</th>
              </tr>
            </thead>
            <tbody>
              {data?.employees
                ?.sort((a, b) => b?.percentage - a?.percentage)
                ?.map((emp, index) => (
                  <tr
                    key={emp?.id || index}
                    className="hover:bg-gray-50 transition-colors border-b last:border-none"
                  >
                    <td className="py-2 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-2 px-4">
                      {emp?.img ? (
                        <img
                          src={emp?.img}
                          alt={emp?.name}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setImgOpen(true);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-700">
                          {emp?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <Link
                        to={`/ceo/salary/${emp?.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {emp?.name}
                      </Link>
                    </td>
                    <td className="py-2 px-4">{emp?.position?.name}</td>
                    <td className="py-2 px-4">{formatNumber(emp?.salary)}</td>
                    <td
                      className="py-2 px-4 text-center cursor-pointer font-medium"
                      onClick={() => {
                        setNewPercentage(emp?.percentage);
                        setSelectedEmployee(emp);
                        setPercentageOpen(true);
                      }}
                    >
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition">
                        {emp?.percentage}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {formatNumber(emp?.totals?.total_earned)}
                    </td>
                    <td className="py-2 px-4">
                      {formatNumber(emp?.totals?.total_possible)}
                    </td>
                    <td className="py-2 px-4">
                      {formatNumber(emp?.totals?.total_possible_season)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-2 px-4 text-right" colSpan={4}>
                  Jami
                </td>
                <td className="py-2 px-4">
                  {formatNumber(
                    data?.employees?.reduce(
                      (acc, e) => acc + parseFloat(e?.salary || 0),
                      0
                    )
                  )}
                </td>
                <td
                  className={`py-2 px-4 text-center ${
                    data?.employees?.reduce(
                      (acc, e) => acc + parseFloat(e?.percentage || 0),
                      0
                    ) > 100
                      ? "text-red-600"
                      : "text-gray-800"
                  }`}
                >
                  {data?.employees
                    ?.reduce(
                      (acc, e) => acc + parseFloat(e?.percentage || 0),
                      0
                    )
                    ?.toFixed(2)}
                </td>
                <td className="py-2 px-4">
                  {formatNumber(
                    data?.employees?.reduce(
                      (acc, e) =>
                        acc + parseFloat(e?.totals?.total_earned || 0),
                      0
                    )
                  )}
                </td>
                <td className="py-2 px-4">
                  {formatNumber(
                    data?.employees?.reduce(
                      (acc, e) =>
                        acc + parseFloat(e?.totals?.total_possible || 0),
                      0
                    )
                  )}
                </td>
                <td className="py-2 px-4">
                  {formatNumber(
                    data?.employees?.reduce(
                      (acc, e) =>
                        acc + parseFloat(e?.totals?.total_possible_season || 0),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Employee Image Dialog */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedEmployee?.position?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <img
              src={selectedEmployee?.img}
              alt={selectedEmployee?.name}
              className="max-h-[60vh] rounded-lg shadow-sm"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Percentage Edit Dialog */}
      <Dialog open={percentageOpen} onOpenChange={setPercentageOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedEmployee?.position?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Input
              value={newPercentage}
              type="number"
              onChange={(e) => setNewPercentage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPercentageOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog
        open={editDepartmentDialogOpen}
        onOpenChange={setEditDepartmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{data?.name}</DialogTitle>
            <DialogDescription>
              Bo'limga berilgan ulushni tahrirlash
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Ulush"
              value={budgetQuantity}
              onChange={(e) => setBudgetQuantity(e.target.value)}
            />
            <Button
              variant={
                budgetType === "percentage_based" ? "default" : "outline"
              }
              onClick={() => setBudgetType("percentage_based")}
            >
              %
            </Button>
            <Button
              variant={budgetType === "minute_based" ? "default" : "outline"}
              onClick={() => setBudgetType("minute_based")}
            >
              so'm
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditDepartmentDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleEditDepartmentSubmit} disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmenDetails;
