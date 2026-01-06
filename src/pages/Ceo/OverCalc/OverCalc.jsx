import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Users,
  Calculator,
  Loader2,
} from "lucide-react";

const keywords = ["tikuv", "тикув"];

const formatNumber = (num) => {
  return Number.parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const StatCard = ({ icon: Icon, title, value, color, unit = "so'm" }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    orange: "from-orange-50 to-orange-100 border-orange-200",
    green: "from-green-50 to-green-100 border-green-200",
    red: "from-red-50 to-red-100 border-red-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200",
    gray: "from-gray-50 to-gray-100 border-gray-200",
  };

  const iconColors = {
    blue: "text-blue-600",
    orange: "text-orange-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
    gray: "text-gray-600",
  };

  const textColors = {
    blue: "text-blue-900",
    orange: "text-orange-900",
    green: "text-green-900",
    red: "text-red-900",
    purple: "text-purple-900",
    indigo: "text-indigo-900",
    gray: "text-gray-900",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 border`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
        <span className={`text-sm font-medium ${textColors[color]}`}>
          {title}
        </span>
      </div>
      <div className={`text-2xl font-bold ${textColors[color]}`}>
        {formatNumber(value)} {unit}
      </div>
    </div>
  );
};

const OverCalc = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("salaryMonth") || new Date().toISOString().slice(0, 7)
  );

  const filteredData = useMemo(
    () => data?.filter((item) => item.order_spend_sum > 0) || [],
    [data]
  );

  const totalStats = useMemo(() => {
    if (!filteredData.length) return { allocated: 0, spent: 0, remaining: 0 };

    const allocated = filteredData.reduce(
      (sum, item) => sum + item.order_spend_sum,
      0
    );
    const spent = filteredData.reduce(
      (sum, item) => sum + item.tarification_expense + item.attendance_expense,
      0
    );
    const remaining = allocated - spent;

    return { allocated, spent, remaining };
  }, [filteredData]);

  const getDateRange = (month) => {
    const [year, monthNum] = month.split("-");
    const yearNum = parseInt(year, 10);
    const monthIndex = parseInt(monthNum, 10) - 1;
    const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
    return {
      start_date: `${month}-01`,
      end_date: `${month}-${lastDay}`,
    };
  };

  const handleError = (error, defaultMessage) => {
    toast({
      variant: "destructive",
      title: "Xatolik!",
      description: error.response?.data?.message || defaultMessage,
    });
  };

  useEffect(() => {
    localStorage.setItem("salaryMonth", selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await api.get("/ceo/departments");
        const flatDepartments = response.data.flatMap(
          (item) => item.departments || []
        );

        setDepartments(flatDepartments);

        const selectedDept = flatDepartments?.find((dept) =>
          keywords.some((keyword) =>
            dept.name?.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (selectedDept) {
          setSelectedDepartment(String(selectedDept.id));
        }
      } catch (error) {
        handleError(error, "Bo'limlarni olishda xatolik yuz berdi!");
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start_date, end_date } = getDateRange(selectedMonth);

      const response = await api.get("/ceo/groupOverSpends", {
        params: {
          department_id: selectedDepartment,
          start_date,
          end_date,
        },
      });

      setData(response.data?.data);
    } catch (error) {
      handleError(error, "Bo'limni olishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDepartment) return;
    fetchData();
  }, [selectedDepartment, selectedMonth]);

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Bo'limlar Hisoboti
          </h1>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => setSelectedDepartment(value)}
                  disabled={departmentsLoading}
                >
                  <SelectTrigger className="w-64 bg-white border-gray-200">
                    <SelectValue
                      placeholder={
                        departmentsLoading
                          ? "Yuklanmoqda..."
                          : "Bo'limni tanlang"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                      </div>
                    ) : (
                      departments.map((department) => (
                        <SelectItem
                          key={department.id}
                          value={String(department.id)}
                        >
                          {department.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Loader */}
      {loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
              <p className="text-lg font-medium text-gray-600">
                Ma'lumotlar yuklanmoqda...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Statistics */}
      {!loading && filteredData.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              Umumiy Statistika
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Wallet}
                title="Jami ajratilgan"
                value={totalStats.allocated}
                color="blue"
              />
              <StatCard
                icon={Calculator}
                title="Jami sarflangan"
                value={totalStats.spent}
                color="orange"
              />
              <div
                className={`rounded-lg p-4 border ${
                  totalStats.remaining < 0
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp
                    className={`h-5 w-5 ${
                      totalStats.remaining < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      totalStats.remaining < 0
                        ? "text-red-900"
                        : "text-green-900"
                    }`}
                  >
                    Jami qoldiq
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold ${
                    totalStats.remaining < 0 ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {formatNumber(totalStats.remaining)} so'm
                </div>
              </div>
              <StatCard
                icon={Target}
                title="Guruhlar soni"
                value={filteredData.length}
                color="purple"
                unit=""
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Groups */}
      {!loading && (
        <div className="grid gap-6">
          {filteredData
            .sort((a, b) => a.group_name.localeCompare(b.group_name))
            .map((item, index) => {
              const totalExpense =
                item.tarification_expense + item.attendance_expense;
              const remaining = item.order_spend_sum - totalExpense;
              const remainingPercentage =
                (remaining / item.order_spend_sum) * 100;
              const expensePercentage =
                (totalExpense / item.order_spend_sum) * 100;

              return (
                <Card
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        {item.group_name}
                      </h2>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          remaining >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {remaining >= 0 ? "Ijobiy balans" : "Kamomad"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <StatCard
                        icon={Wallet}
                        title="Ajratilgan summa"
                        value={item.order_spend_sum}
                        color="blue"
                      />

                      <StatCard
                        icon={Calculator}
                        title="Jami sarflangan"
                        value={totalExpense}
                        color="orange"
                      />

                      <div
                        className={`rounded-lg p-4 border ${
                          remaining >= 0
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {remaining >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              remaining >= 0 ? "text-green-900" : "text-red-900"
                            }`}
                          >
                            Qoldiq
                          </span>
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            remaining >= 0 ? "text-green-900" : "text-red-900"
                          }`}
                        >
                          {formatNumber(remaining)} so'm
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            remaining >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {remainingPercentage.toFixed(1)}%
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">
                            Tarifikatsiya
                          </span>
                        </div>
                        <div className="text-xl font-bold text-purple-900">
                          {formatNumber(item.tarification_expense)} so'm
                        </div>
                        <div className="text-xs text-purple-700 mt-1">
                          {(
                            (item.tarification_expense / totalExpense) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-900">
                            Davomat
                          </span>
                        </div>
                        <div className="text-xl font-bold text-indigo-900">
                          {formatNumber(item.attendance_expense)} so'm
                        </div>
                        <div className="text-xs text-indigo-700 mt-1">
                          {(
                            (item.attendance_expense / totalExpense) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Calculator className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Sarf foizi
                          </span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {expensePercentage.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              expensePercentage > 95
                                ? "bg-red-500"
                                : expensePercentage > 85
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(expensePercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default OverCalc;
