import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, format } from "date-fns";
import { Switch } from "@/components/ui/switch";

const formatValue = (value) => {
  if (value === 0) {
    return 0;
  }
  if (!value) return "";
  return Number.parseInt(value).toLocaleString("en-EN");
};

const Employees = () => {
  const { toast } = useToast();

  // Function to get URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      year: params.get("year"),
      month: params.get("month"),
    };
  };

  // Get year and month from URL params or use current date as fallback
  const today = new Date();
  const urlParams = getUrlParams();

  const [selectedYear, setSelectedYear] = useState(
    urlParams.year ? parseInt(urlParams.year) : today.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    urlParams.month ? parseInt(urlParams.month) - 1 : today.getMonth()
  );

  const [attendances, setAttendances] = useState([]);
  const [transports, setTransports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize dateRange with valid default values
  const [dateRange, setDateRange] = useState({
    from: new Date(selectedYear, selectedMonth, 1),
    to: null,
  });

  const [showOnlyWithAttendance, setShowOnlyWithAttendance] = useState(true);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const updateUrlParams = (year, month) => {
    const params = new URLSearchParams(window.location.search);
    params.set("year", year.toString());
    params.set("month", (month + 1).toString()); // +1 because months are 0-indexed in JS

    // Update URL without causing full page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  // Handle month/year change
  const handleDateChange = (e) => {
    const [year, month] = e.target.value.split("-");
    const yearInt = parseInt(year);
    const monthInt = parseInt(month) - 1; // Convert to 0-based index

    setSelectedYear(yearInt);
    setSelectedMonth(monthInt);
    updateUrlParams(yearInt, monthInt);
  };

  // Add event listener for popstate (back/forward browser navigation)
  useEffect(() => {
    const handlePopState = () => {
      const params = getUrlParams();
      if (params.year && params.month) {
        setSelectedYear(parseInt(params.year));
        setSelectedMonth(parseInt(params.month) - 1);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const getDaysInMonth = (year, monthIndex) =>
    new Date(year, monthIndex + 1, 0).getDate();

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  const fetchAttendances = async () => {
    try {
      const response = await api.get("/transport/attendances", {
        params: {
          date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`,
        },
      });
      setAttendances(response.data.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchTransports = async () => {
    try {
      const response = await api.get("/transport/transports", {
        params: {
          date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`,
        },
      });
      // Store all transports without filtering
      setTransports(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Transportlarni olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAttendances();
    fetchTransports();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setDateRange({
      from: new Date(selectedYear, selectedMonth, 1),
      to: null,
    });
  }, [selectedMonth, selectedYear]);

  const filteredTransports = useMemo(() => {
    return transports.filter((t) => {
      // Apply search filter
      const matchesSearch =
        searchTerm === "" ||
        t.state_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_full_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply active filter
      const isActiveMatch = !showOnlyActive || t.is_active;

      // Apply attendance filter - show only transports that have attendance records
      const hasAttendance =
        !showOnlyWithAttendance ||
        attendances.some((a) => a.transport?.id === t.id);

      return matchesSearch && isActiveMatch && hasAttendance;
    });
  }, [
    transports,
    searchTerm,
    showOnlyActive,
    showOnlyWithAttendance,
    attendances,
  ]);

  // Memoized calculations to avoid repetitive calculations
  const transportCalculations = useMemo(() => {
    const calculations = {};

    // Add daily attendance totals
    const dailyTotals = Array.from({ length: daysInMonth }).map(() => 0);

    filteredTransports.forEach((transport) => {
      const transportId = transport.id;
      const workDays = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId
          );

          // Add to daily totals
          const attendanceValue = attendance?.attendance_type || 0;
          dailyTotals[dayIndex] += attendanceValue;

          return total + attendanceValue;
        },
        0
      );

      const totalSalary = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId
          );
          return (
            total +
            (attendance?.salary * (attendance?.attendance_type || 0) || 0)
          );
        },
        0
      );

      const fuelDays = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId
          );
          return (
            total +
            (attendance?.fuel_bonus > 0 ? attendance?.attendance_type || 0 : 0)
          );
        },
        0
      );

      const totalFuelBonus = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId
          );
          return (
            total +
            (attendance?.fuel_bonus * (attendance?.attendance_type || 0) || 0)
          );
        },
        0
      );

      const totalTransportMoney = totalSalary + totalFuelBonus;

      const totalPaid =
        transport?.payment?.reduce(
          (total, payment) => total + (Number.parseInt(payment?.amount) || 0),
          0
        ) || 0;

      const debt = totalTransportMoney - totalPaid;

      const advance = Number.parseInt(
        transport?.payment?.find((p) => p.type === "advance")?.amount || 0
      );
      const salary = Number.parseInt(
        transport?.payment?.find((p) => p.type === "salary")?.amount || 0
      );

      calculations[transportId] = {
        workDays,
        totalSalary,
        fuelDays,
        totalFuelBonus,
        totalTransportMoney,
        totalPaid,
        debt,
        advance,
        salary,
        capacity: Number.parseInt(transport?.capacity || 0),
        balance: Number.parseInt(transport?.balance || 0),
      };
    });

    // Calculate totals for the summary row
    const totals = {
      workDays: 0,
      totalSalary: 0,
      fuelDays: 0,
      totalFuelBonus: 0,
      totalTransportMoney: 0,
      totalPaid: 0,
      debt: 0,
      advance: 0,
      salary: 0,
      balance: 0,
      capacity: 0,
      dailyTotals,
    };

    Object.values(calculations).forEach((calc) => {
      totals.workDays += calc.workDays;
      totals.totalSalary += calc.totalSalary;
      totals.fuelDays += calc.fuelDays;
      totals.totalFuelBonus += calc.totalFuelBonus;
      totals.totalTransportMoney += calc.totalTransportMoney;
      totals.totalPaid += calc.totalPaid;
      totals.debt += calc.debt;
      totals.advance += calc.advance;
      totals.salary += calc.salary;
      totals.balance += calc.balance;
      totals.capacity += calc.capacity;
    });

    return { transportData: calculations, totals };
  }, [
    attendances,
    transports,
    filteredTransports,
    daysInMonth,
    selectedYear,
    selectedMonth,
  ]);

  // Convert date range to array of date strings in YYYY-MM-DD format
  const getSelectedDatesArray = () => {
    if (!dateRange || !dateRange.from) return [];
    if (!dateRange.to) return [format(dateRange.from, "yyyy-MM-dd")];

    const dates = [];
    let currentDate = dateRange.from;

    while (currentDate <= dateRange.to) {
      dates.push(format(currentDate, "yyyy-MM-dd"));
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  };

  return (
    <div>
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          type="month"
          value={`${selectedYear}-${String(selectedMonth + 1).padStart(
            2,
            "0"
          )}`}
          onChange={handleDateChange}
          className="px-2 py-1 rounded w-fit bg-white"
        />
        <Input
          type="text"
          placeholder="Qidirish"
          className="px-2 py-1 rounded bg-white w-fit"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center space-x-2">
          <Switch
            id="attendanceSwitch"
            checked={showOnlyWithAttendance}
            onCheckedChange={setShowOnlyWithAttendance}
          />
          <Label htmlFor="attendanceSwitch">Davomati borlar</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="activeSwitch"
            checked={showOnlyActive}
            onCheckedChange={setShowOnlyActive}
          />
          <Label htmlFor="activeSwitch">Faqat aktiv</Label>
        </div>
      </div>

      <div className="max-h-[84vh] overflow-auto mt-4">
        <table className="border w-full text-xs bg-white">
          <thead className="sticky top-0 bg-white shadow z-20">
            <tr>
              <th className="border-2 p-1 min-w-[40px] sticky left-0 bg-white z-10">
                №
              </th>
              <th className="border-2 p-1 min-w-[70px] sticky left-[38px] bg-white z-10">
                Rusumi
              </th>
              <th className="border-2 p-1 min-w-[70px] sticky left-[106px] bg-white z-10">
                Davlat raqami
              </th>
              <th className="border-2 p-1 min-w-[150px] sticky left-[174px] bg-white z-10">
                Haydovchi
              </th>
              <th className="border-2 p-1 min-w-[50px] sticky left-[310px] bg-white z-10">
                Sig'imi
              </th>
              {Array.from({ length: daysInMonth }).map((_, index) => (
                <th
                  key={index}
                  className="border-2 h-[120px] whitespace-nowrap"
                >
                  <div className="translate-x-[0px] translate-y-[20px] rotate-[270deg] w-[30px]">
                    <span className="font-normal">
                      <span className="font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      .{String(selectedMonth + 1).padStart(2, "0")}.
                      {selectedYear}
                    </span>
                  </div>
                </th>
              ))}
              <th className="border-2 p-1 min-w-[70px]">Kunlik yo'l kira</th>
              <th className="border-2 p-1 min-w-[70px]">Jami ish kuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransports.map((transport, index) => {
              const calculations =
                transportCalculations.transportData[transport.id] || {};
              return (
                <tr key={index} className="text-center">
                  <td className="border-2 p-1 min-w-[40px] sticky left-0 bg-white z-10">
                    {index + 1}
                  </td>
                  <td className="border-2 p-1 min-w-[70px] sticky left-[38px] bg-white z-10">
                    {transport?.name}
                  </td>
                  <td className="border-2 p-1 min-w-[70px] sticky left-[106px] bg-white z-10">
                    {transport?.state_number}
                  </td>
                  <td className="border-2 p-1 min-w-[150px] sticky left-[174px] bg-white z-10">
                    {transport?.driver_full_name
                      ?.split(" ")
                      .slice(0, 2)
                      .join(" ")}
                  </td>
                  <td className="border-2 p-1 min-w-[50px] sticky left-[310px] bg-white z-10">
                    {transport?.capacity}
                  </td>
                  {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                    const date = `${selectedYear}-${String(
                      selectedMonth + 1
                    ).padStart(2, "0")}-${String(dayIndex + 1).padStart(
                      2,
                      "0"
                    )}`;
                    const attendance = attendances.find(
                      (a) => a.date === date && a.transport?.id === transport.id
                    );

                    return (
                      <td
                        key={dayIndex}
                        className={`border-2 min-w-[40px] ${
                          transport?.capacity /
                            attendance?.transport?.employees?.reduce(
                              (total, employee) =>
                                total +
                                (employee.attendance_status === "present"
                                  ? 1
                                  : 0),
                              0
                            ) ===
                          1
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        <span className="font-bold">
                          {attendance ? attendance.attendance_type : "\u00A0"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-2 p-1 min-w-[100px]">
                    {formatValue(transport?.salary)}
                  </td>
                  <td className="border-2 p-1 min-w-[70px]">
                    {calculations.workDays || 0}
                  </td>
                </tr>
              );
            })}
            {/* Summary row with totals */}
            <tr className="text-center font-bold bg-gray-100">
              <td
                className="border-2 p-1 sticky left-0 bg-gray-100 z-10"
                colSpan={4}
              >
                Jami:
              </td>
              <td className="border-2 p-1 min-w-[50px] sticky left-[310px] bg-gray-100 z-10">
                {transportCalculations?.totals?.capacity?.toFixed(0)}
              </td>
              {/* Daily attendance totals */}
              {Array.from({ length: daysInMonth }).map((_, index) => (
                <td key={index} className="border-2 min-w-[40px] bg-gray-100">
                  {transportCalculations?.totals?.dailyTotals[index]?.toFixed(
                    1
                  )}
                </td>
              ))}
              <td className="border-2 p-1 min-w-[100px]">
                {formatValue(
                  filteredTransports.reduce(
                    (total, transport) =>
                      total + (parseInt(transport?.salary) || 0),
                    0
                  )
                )}
              </td>
              <td className="border-2 p-1 min-w-[70px]">
                {transportCalculations?.totals?.workDays?.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
