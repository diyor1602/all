import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  User,
  AlarmClock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import formatNumber from "@/utils/formatNumber";

const deparmentKeywords = ["Kroy", "Крой"];

const Employees = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("newSeasonSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState(null);
  const [isGettingId, setIsGettingId] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [hideZeroPerMinute, setHideZeroPerMinute] = useState(() => {
    const saved = localStorage.getItem("departmentViewHideZeroPerMinute");
    return saved ? saved === "true" : false;
  });
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem("departmentViewSortConfig");
    return saved
      ? JSON.parse(saved)
      : {
          key: "employee",
          direction: "asc",
        };
  });

  const getDepartment = async () => {
    setIsGettingId(true);
    try {
      const res = await api.get("/departments");

      const mainDepartments = Array.isArray(res.data)
        ? res.data
        : res.data?.departments || [];

      const allSubDepartments = mainDepartments.flatMap(
        (main) => main.departments || [],
      );

      const findDepartment = allSubDepartments.find((d) =>
        deparmentKeywords.some((keyword) =>
          d.name?.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );

      setId(findDepartment?.id ?? null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik",
      });
    } finally {
      setIsGettingId(false);
    }
  };

  useEffect(() => {
    getDepartment();
  }, []);

  const getData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get("/cuttingMaster/calculateSeason", {
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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    localStorage.setItem(
      "departmentViewSortConfig",
      JSON.stringify(newSortConfig),
    );
  };

  const getSortedData = () => {
    if (!data?.items) return [];

    const sorted = [...data.items].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "employee":
          aValue = a?.employee?.name || "";
          bValue = b?.employee?.name || "";
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "per_minute_sum":
          aValue = Number(a?.per_minute_sum) || 0;
          bValue = Number(b?.per_minute_sum) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "total_minutes":
          aValue = Number(a?.total_minutes) || 0;
          bValue = Number(b?.total_minutes) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "total_amount":
          aValue = Number(a?.total_amount) || 0;
          bValue = Number(b?.total_amount) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "possible_minutes":
          aValue = Number(a?.possible_minutes) || 0;
          bValue = Number(b?.possible_minutes) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        case "possible_amount":
          aValue = Number(a?.possible_amount) || 0;
          bValue = Number(b?.possible_amount) || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const getDisplayedData = () => {
    const sorted = getSortedData();
    if (!hideZeroPerMinute) return sorted;
    return sorted.filter((item) => (Number(item?.per_minute_sum) || 0) !== 0);
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
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header Section */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  Bo'lim ma'lumotlari
                </h1>
                <p className="text-xs text-slate-500">
                  Xodimlarning oylik ma'lumotlari
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-7 w-7 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>

                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    localStorage.setItem(
                      "newSeasonSelectedMonth",
                      e.target.value,
                    );
                  }}
                  className="w-28 sm:w-auto h-7 text-xs border-0 bg-transparent shadow-none"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-7 w-7 p-0 hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        {!loading && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-end pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHideZeroPerMinute((prev) => {
                      const next = !prev;
                      localStorage.setItem(
                        "departmentViewHideZeroPerMinute",
                        String(next),
                      );
                      return next;
                    });
                  }}
                  className="text-xs"
                >
                  {hideZeroPerMinute
                    ? "Daqiqa uchun 0 ni ko'rsatish"
                    : "Daqiqa uchun 0 ni yashirish"}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-center py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs border border-slate-200">
                        #
                      </th>
                      <th
                        className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("employee")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Xodim</span>
                          {sortConfig.key === "employee" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("per_minute_sum")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Daqiqa uchun</span>
                          {sortConfig.key === "per_minute_sum" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("total_minutes")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Jami daqiqa</span>
                          {sortConfig.key === "total_minutes" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("total_amount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Topdi</span>
                          {sortConfig.key === "total_amount" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("possible_minutes")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Qolgan daqiqalar</span>
                          {sortConfig.key === "possible_minutes" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                        onClick={() => handleSort("possible_amount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Topa oladi</span>
                          {sortConfig.key === "possible_amount" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDisplayedData().map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 px-2 text-center border border-slate-200">
                          <span className="font-medium text-slate-600 text-xs">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 border border-slate-200">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {item?.employee?.img ? (
                              <img
                                src={item?.employee?.img}
                                alt={item?.employee?.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(item?.employee?.img);
                                  setImageDialogOpen(true);
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                              </div>
                            )}

                            <span className="font-medium text-slate-900 text-xs">
                              {item?.employee?.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {item?.per_minute_sum || 0} so'm
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.total_minutes, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.total_amount, 0)} so'm
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.possible_minutes, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatNumber(item?.possible_amount, 0)} so'm
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    {getDisplayedData().length > 0 && (
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                        <td className="py-3 px-2 text-center border border-slate-200">
                          <span className="text-slate-900 text-sm">#</span>
                        </td>
                        <td className="py-3 px-2 border border-slate-200">
                          <span className="text-slate-900 text-sm">Jami</span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.per_minute_sum) || 0),
                                0,
                              ),
                            )}{" "}
                            so'm
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.total_minutes) || 0),
                                0,
                              ),
                              0,
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-green-600 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.total_amount) || 0),
                                0,
                              ),
                              0,
                            )}{" "}
                            so'm
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-slate-900 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.possible_minutes) || 0),
                                0,
                              ),
                              0,
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right border border-slate-200">
                          <span className="text-green-600 text-sm">
                            {formatNumber(
                              getDisplayedData().reduce(
                                (sum, item) =>
                                  sum + (Number(item?.possible_amount) || 0),
                                0,
                              ),
                              0,
                            )}{" "}
                            so'm
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {isGettingId ? (
                  <div className="text-center py-8 text-slate-500">
                    Bo'lim ma'lumotlari olinmoqda
                  </div>
                ) : (
                  getDisplayedData().length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Xodimlar topilmadi
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-sm">Xodim rasmi</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Xodim rasmi"
                  className="max-w-full max-h-[60vh] rounded-lg object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-900">
                {selectedEmployee?.employee?.name}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Kunlik ish haqi ma'lumotlari
              </p>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              <div className="min-w-[600px]">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">
                      Kunlar soni
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {selectedEmployee?.days?.length || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      Jami topdi
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {formatNumber(
                        selectedEmployee?.days?.reduce(
                          (sum, day) => sum + (day?.amount || 0),
                          0,
                        ),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-purple-600 font-medium mb-1">
                      Jami daqiqa
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {formatNumber(
                        selectedEmployee?.days?.reduce(
                          (sum, day) => sum + (day?.minutes || 0),
                          0,
                        ),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      Daqiqasiga
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {selectedEmployee?.per_minute_sum || 0} so'm
                    </p>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                          Sana
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Topdi
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Daqiqa
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">
                          Daqiqasiga
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee?.days
                        ?.sort((a, b) => {
                          return new Date(a?.date) - new Date(b?.date);
                        })
                        .map((day, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="font-medium text-slate-900 text-sm">
                                  {day?.date?.split("-").reverse().join(".")}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-green-600 text-sm">
                                {formatNumber(day?.amount, 0)} so'm
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="font-semibold text-purple-600 text-sm">
                                  {formatNumber(day?.minutes, 0)}
                                </span>
                                <AlarmClock className="w-4 h-4 text-purple-600" />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-orange-600 text-sm">
                                {day?.per_minute_sum} so'm
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {selectedEmployee?.days?.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Ma'lumotlar topilmadi
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Employees;
