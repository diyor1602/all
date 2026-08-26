import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addDays, format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

const formatValue = (value) => {
  if (value === 0) {
    return 0;
  }
  if (!value) return "";
  return Number.parseInt(value).toLocaleString("en-EN");
};

const Attendance = () => {
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
    urlParams.year ? parseInt(urlParams.year) : today.getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    urlParams.month ? parseInt(urlParams.month) - 1 : today.getMonth(),
  );

  const [attendances, setAttendances] = useState([]);
  const [transports, setTransports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [currentSubmitPayment, setCurrentSubmitPayment] = useState({
    amount: 0,
    date: new Date(),
    type: "",
  });

  const [isExporting, setIsExporting] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState({
    transport_id: null,
    date: "",
    attendance_type: 1,
    salary: 0,
    attendanceId: null,
    hasAttendance: false,
  });

  // Mass attendance dialog state
  const [massDialogOpen, setMassDialogOpen] = useState(false);
  const [massAttendance, setMassAttendance] = useState({
    date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
    attendance_type: 1,
    transport_ids: [],
  });
  const [selectedDate, setSelectedDate] = useState(
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
  );
  const [transportSearchTerm, setTransportSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Small attendance dialog state (Kichik davomat)
  const [smallDialogOpen, setSmallDialogOpen] = useState(false);
  const [smallAttendance, setSmallAttendance] = useState({
    transport_id: "",
    dates: [],
    attendance_type: 1,
    salary: 0,
  });
  const [transportSearchResults, setTransportSearchResults] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
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
    // Update the mass attendance date when month/year changes
    setSelectedDate(
      `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
    );
    setMassAttendance((prev) => ({
      ...prev,
      date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
    }));

    // Update the date range for the calendar when month/year changes
    setDateRange({
      from: new Date(selectedYear, selectedMonth, 1),
      to: null,
    });
  }, [selectedMonth, selectedYear]);

  // When selectAll changes, update all transport IDs
  useEffect(() => {
    if (selectAll) {
      const filteredIds = filteredTransportsForSelection.map((t) => t.id);
      setMassAttendance((prev) => ({
        ...prev,
        transport_ids: filteredIds,
      }));
    } else {
      setMassAttendance((prev) => ({
        ...prev,
        transport_ids: [],
      }));
    }
  }, [selectAll]);

  // Filter transports for search results
  useEffect(() => {
    if (transportSearchTerm.trim() === "") {
      setTransportSearchResults([]);
      return;
    }

    const value = transportSearchTerm.toLowerCase();
    const results = transports.filter(
      (t) =>
        t.state_number?.toLowerCase().includes(value) ||
        t.driver_full_name?.toLowerCase().includes(value) ||
        t.name?.toLowerCase().includes(value),
    );
    setTransportSearchResults(results);
  }, [transportSearchTerm, transports]);

  // When a transport is selected in small attendance dialog, populate default values
  useEffect(() => {
    if (selectedTransport) {
      setSmallAttendance((prev) => ({
        ...prev,
        transport_id: selectedTransport.id,
        salary: selectedTransport.salary
          ? Number.parseInt(selectedTransport.salary)
          : 0,
      }));
    }
  }, [selectedTransport]);

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
        attendances.some((a) => a?.transport?.id === t?.id);

      return matchesSearch && isActiveMatch && hasAttendance;
    });
  }, [
    transports,
    searchTerm,
    showOnlyActive,
    showOnlyWithAttendance,
    attendances,
  ]);

  const filteredTransportsForSelection = transports.filter((t) => {
    const value = transportSearchTerm.toLowerCase();
    return (
      t.state_number?.toLowerCase().includes(value) ||
      t.driver_full_name?.toLowerCase().includes(value) ||
      t.name?.toLowerCase().includes(value)
    );
  });

  // Memoized calculations to avoid repetitive calculations
  const transportCalculations = useMemo(() => {
    const calculations = {};

    // Add daily attendance totals
    const dailyTotals = Array.from({ length: daysInMonth }).map(() => 0);

    const dailyMoneyTotals = Array.from({ length: daysInMonth }).map(() => 0);

    filteredTransports.forEach((transport) => {
      const transportId = transport.id;
      for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
        const date = `${selectedYear}-${String(selectedMonth + 1).padStart(
          2,
          "0",
        )}-${String(dayIndex + 1).padStart(2, "0")}`;
        const attendance = attendances.find(
          (a) => a.date === date && a.transport?.id === transportId,
        );
        if (attendance) {
          dailyMoneyTotals[dayIndex] +=
            (attendance.salary || 0) * (attendance.attendance_type || 0);
        }
      }
    });

    filteredTransports.forEach((transport) => {
      const transportId = transport.id;
      const workDays = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0",
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId,
          );

          // Add to daily totals
          const attendanceValue = attendance?.attendance_type || 0;
          dailyTotals[dayIndex] += attendanceValue;

          return total + attendanceValue;
        },
        0,
      );

      const totalSalary = Array.from({ length: daysInMonth }).reduce(
        (total, _, dayIndex) => {
          const attendance = attendances.find(
            (a) =>
              a.date ===
                `${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0",
                )}-${String(dayIndex + 1).padStart(2, "0")}` &&
              a.transport?.id === transportId,
          );
          return (
            total +
            (attendance?.salary * (attendance?.attendance_type || 0) || 0)
          );
        },
        0,
      );

      const totalTransportMoney = totalSalary;

      const totalPaid =
        transport?.payment?.reduce(
          (total, payment) => total + (Number.parseInt(payment?.amount) || 0),
          0,
        ) || 0;

      const debt = totalTransportMoney - totalPaid;

      const advance =
        transport?.payment
          ?.filter((p) => p.type === "advance")
          .reduce(
            (total, payment) => total + (Number.parseInt(payment?.amount) || 0),
            0,
          ) || 0;
      const salary =
        transport?.payment
          ?.filter((p) => p.type === "salary")
          .reduce(
            (total, payment) => total + (Number.parseInt(payment?.amount) || 0),
            0,
          ) || 0;

      calculations[transportId] = {
        workDays,
        totalSalary,
        totalTransportMoney,
        totalPaid,
        debt,
        advance,
        salary,
        balance: Number.parseInt(transport?.balance || 0),
      };
    });

    // Calculate totals for the summary row
    const totals = {
      workDays: 0,
      totalSalary: 0,
      totalTransportMoney: 0,
      totalPaid: 0,
      debt: 0,
      advance: 0,
      salary: 0,
      balance: 0,
      dailyTotals,
      dailyMoneyTotals,
    };

    Object.values(calculations).forEach((calc) => {
      totals.workDays += calc.workDays;
      totals.totalSalary += calc.totalSalary;
      totals.totalTransportMoney += calc.totalTransportMoney;
      totals.totalPaid += calc.totalPaid;
      totals.debt += calc.debt;
      totals.advance += calc.advance;
      totals.salary += calc.salary;
      totals.balance += calc.balance;
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

  const exportToExcel = async () => {
    setIsExporting(true);

    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `Davomat ${selectedMonth + 1}-${selectedYear}`,
      );

      // Add headers
      const headers = ["№", "Rusumi", "Davlat raqami", "Haydovchi"];

      // Add day columns
      for (let day = 1; day <= daysInMonth; day++) {
        headers.push(
          `${String(day).padStart(2, "0")}.${String(selectedMonth + 1).padStart(
            2,
            "0",
          )}.${selectedYear}`,
        );
      }

      // Add summary columns
      headers.push(
        "Kunlik yo'l kira",
        "Jami ish kuni",
        "Jami transport puli",
        "Avans",
        "Qoldiq",
      );

      // Add header row
      worksheet.addRow(headers);

      // Format header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add data rows
      filteredTransports.forEach((transport, index) => {
        const calculations =
          transportCalculations.transportData[transport.id] || {};

        const row = [
          index + 1,
          transport?.name || "",
          transport?.state_number || "",
          transport?.driver_full_name?.split(" ").slice(0, 2).join(" ") || "",
        ];

        // Add attendance data for each day
        for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
          const date = `${selectedYear}-${String(selectedMonth + 1).padStart(
            2,
            "0",
          )}-${String(dayIndex + 1).padStart(2, "0")}`;
          const attendance = attendances.find(
            (a) => a?.date === date && a?.transport?.id === transport.id,
          );
          row.push(attendance ? attendance.attendance_type : "");
        }

        // Add summary data
        row.push(
          transport?.salary || 0,
          calculations.workDays || 0,
          calculations.totalTransportMoney || 0,
          calculations.advance || 0,
          calculations.debt || 0,
        );

        worksheet.addRow(row);
      });

      // Add totals row
      const totalsRow = ["", "Jami:", "", ""];

      // Add daily totals
      for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
        totalsRow.push(
          transportCalculations.totals.dailyTotals[dayIndex].toFixed(1),
        );
      }

      // Add summary totals
      totalsRow.push(
        filteredTransports.reduce(
          (total, transport) => total + (parseInt(transport?.salary) || 0),
          0,
        ),
        transportCalculations.totals.workDays.toFixed(1),
        transportCalculations.totals.totalTransportMoney || 0,
        transportCalculations.totals.advance || 0,
        transportCalculations.totals.debt || 0,
      );

      worksheet.addRow(totalsRow);

      // Format totals row
      const lastRow = worksheet.rowCount;
      worksheet.getRow(lastRow).font = { bold: true };
      worksheet.getRow(lastRow).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F2F2F2" },
      };

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Davomat_${selectedMonth + 1}_${selectedYear}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Muvaffaqiyatli",
        description: "Excel fayl yuklandi",
        style: { backgroundColor: "green", color: "white" },
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Excel faylni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openAttendanceDialog = (transportId, day, attendance) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    // Find the transport to get its default salary
    const transport = transports.find((t) => t.id === transportId);

    setCurrentAttendance({
      transport_id: transportId,
      date: formattedDate,
      attendance_type: attendance ? attendance.attendance_type : 1,
      salary: attendance
        ? attendance.salary || 0
        : transport?.salary
          ? Number.parseInt(transport.salary)
          : 0,
      attendanceId: attendance ? attendance.id : null,
      hasAttendance: !!attendance,
    });

    setDialogOpen(true);
  };

  const openMassAttendanceDialog = () => {
    setMassAttendance({
      date: selectedDate,
      attendance_type: 1,
      transport_ids: [],
    });
    setTransportSearchTerm("");
    setSelectAll(false);
    setMassDialogOpen(true);
  };

  const openSmallAttendanceDialog = () => {
    setSmallAttendance({
      transport_id: "",
      dates: [],
      attendance_type: 1,
      salary: 0,
    });
    setDateRange({
      from: new Date(selectedYear, selectedMonth, 1),
      to: null,
    });
    setTransportSearchTerm("");
    setTransportSearchResults([]);
    setSelectedTransport(null);
    setSmallDialogOpen(true);
  };

  const handleAttendanceSubmit = async () => {
    try {
      if (currentAttendance.hasAttendance && currentAttendance.attendanceId) {
        await api.patch(
          `/transport/attendances/${currentAttendance.attendanceId}`,
          {
            transport_id: currentAttendance.transport_id,
            date: currentAttendance.date,
            attendance_type: currentAttendance.attendance_type,
            salary: currentAttendance.salary,
          },
        );
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli yangilandi",
          style: { backgroundColor: "green", color: "white" },
        });
      } else {
        await api.post("/transport/attendances", {
          transport_id: currentAttendance.transport_id,
          date: currentAttendance.date,
          attendance_type: currentAttendance.attendance_type,
          salary: currentAttendance.salary,
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli qo'shildi",
          style: { backgroundColor: "green", color: "white" },
        });
      }

      // Fetch updated data and update the UI
      await fetchAttendances();
      await fetchTransports();

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar bilan ishlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleMassAttendanceSubmit = async () => {
    setIsBulkUpdating(true);
    try {
      if (massAttendance.transport_ids.length === 0) {
        toast({
          title: "Xatolik",
          description: "Hech qanday transport tanlanmadi",
          variant: "destructive",
        });
        return;
      }

      await api.post("/transport/massStore", {
        date: massAttendance.date,
        attendance_type: massAttendance.attendance_type,
        transport_ids: massAttendance.transport_ids,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Ommaviy davomat muvaffaqiyatli qo'shildi",
        style: { backgroundColor: "green", color: "white" },
      });

      // Fetch updated data and update the UI
      await fetchAttendances();
      await fetchTransports();

      setMassDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ommaviy davomat qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleSmallAttendanceSubmit = async () => {
    setIsBulkUpdating(true);
    try {
      if (!smallAttendance.transport_id) {
        toast({
          title: "Xatolik",
          description: "Transport tanlanmadi",
          variant: "destructive",
        });
        return;
      }

      const selectedDates = getSelectedDatesArray();
      if (selectedDates.length === 0) {
        toast({
          title: "Xatolik",
          description: "Hech qanday sana tanlanmadi",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        transport_id: Number.parseInt(smallAttendance.transport_id),
        dates: selectedDates,
        attendance_type: smallAttendance.attendance_type,
        salary: smallAttendance.salary,
      };

      await api.post("/transport/massStoreByDates", payload);

      toast({
        title: "Muvaffaqiyatli",
        description: "Kichik davomat muvaffaqiyatli qo'shildi",
        style: { backgroundColor: "green", color: "white" },
      });

      // Fetch updated data and update the UI
      await fetchAttendances();
      await fetchTransports();

      setSmallDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kichik davomat qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleTransportSelection = (transportId) => {
    setMassAttendance((prev) => {
      if (prev.transport_ids.includes(transportId)) {
        return {
          ...prev,
          transport_ids: prev.transport_ids.filter((id) => id !== transportId),
        };
      } else {
        return {
          ...prev,
          transport_ids: [...prev.transport_ids, transportId],
        };
      }
    });
  };

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

  // Unified payment handler for both advance and salary
  const handlePaymentSubmit = async (type) => {
    const isAdvance = type === "advance";
    const dialogSetter = isAdvance ? setAdvanceDialogOpen : setSalaryDialogOpen;

    // Calculate max balance for validation based on payment type
    const transportData =
      transportCalculations.transportData[selectedTransport?.id] || {};
    const totalMoney = transportData.totalTransportMoney || 0;
    const otherPaymentAmount = isAdvance
      ? transportData.salary || 0
      : transportData.advance || 0;

    const maxBalance = totalMoney - otherPaymentAmount;

    if (Number.parseInt(currentSubmitPayment.amount) > maxBalance) {
      toast({
        title: "Diqqat",
        description: `${
          isAdvance ? "Avans" : "Maosh"
        } miqdori balansdan kam bo'lishi kerak`,
        variant: "destructive",
      });
      return;
    }

    setIsBulkUpdating(true);
    try {
      const payload = {
        transport_id: Number.parseInt(selectedTransport.id),
        amount: Number.parseInt(currentSubmitPayment.amount),
        type: type,
        month: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`,
      };

      payload.date = format(currentSubmitPayment.date, "yyyy-MM-dd");
      if (!currentSubmitPayment.date) {
        toast({
          title: "Diqqat",
          description: "Sanani tanlang!",
          variant: "destructive",
        });
        return;
      }
      await api.post("/transport/payment/", payload);
      toast({
        title: "Muvaffaqiyatli",
        description: `${
          isAdvance ? "Avans" : "Maosh"
        } muvaffaqiyatli qo'shildi`,
        style: { backgroundColor: "green", color: "white" },
      });

      // Fetch updated data and update the UI
      await fetchAttendances();
      await fetchTransports();

      // Force a re-render by updating a state value
      setCurrentSubmitPayment((prev) => ({ ...prev }));

      dialogSetter(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openPaymentDialog = (transport, type) => {
    setSelectedTransport(transport);

    const existingPayments =
      transport?.payment?.filter((p) => p.type === type) || [];
    const totalAmount = existingPayments.reduce(
      (total, payment) => total + (Number.parseInt(payment?.amount) || 0),
      0,
    );
    const lastPayment =
      existingPayments.length > 0
        ? existingPayments[existingPayments.length - 1]
        : null;
    const date = lastPayment?.date ? new Date(lastPayment.date) : new Date();

    setCurrentSubmitPayment({
      amount: totalAmount,
      date,
      type,
    });

    if (type === "advance") {
      setAdvanceDialogOpen(true);
    } else {
      setSalaryDialogOpen(true);
    }
  };

  // Keep the old handleAttendance for context menu compatibility
  const handleAttendance = async (
    transportId,
    day,
    hasAttendance,
    attendanceType,
    attendanceId = null,
  ) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    try {
      if (hasAttendance && attendanceId) {
        await api.patch(`/transport/attendances/${attendanceId}`, {
          transport_id: transportId,
          date: formattedDate,
          attendance_type: attendanceType,
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli yangilandi",
          style: { backgroundColor: "green", color: "white" },
        });
      } else {
        await api.post("/transport/attendances", {
          transport_id: transportId,
          date: formattedDate,
          attendance_type: attendanceType,
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli qo'shildi",
          style: { backgroundColor: "green", color: "white" },
        });
      }

      // Fetch updated data and update the UI
      await fetchAttendances();
      await fetchTransports();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar bilan ishlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          type="month"
          value={`${selectedYear}-${String(selectedMonth + 1).padStart(
            2,
            "0",
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
        <Button onClick={openSmallAttendanceDialog} className="w-fit">
          Kichik davomat qo'shish
        </Button>
        <Button onClick={openMassAttendanceDialog} className="w-fit">
          Ommaviy Davomat Qo'shish
        </Button>
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
        <Button
          onClick={exportToExcel}
          className="w-fit ml-auto"
          variant="ghost"
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
        </Button>
      </div>

      <div className="max-h-[84vh] overflow-auto mt-4">
        <table className="border w-full text-xs bg-white">
          <thead className="md:sticky top-0 bg-white shadow z-20">
            <tr>
              <th className="border-2 p-1 min-w-[40px] md:sticky left-0 bg-white z-10">
                №
              </th>
              <th className="border-2 p-1 min-w-[70px] md:sticky left-[38px] bg-white z-10">
                Rusumi
              </th>
              <th className="border-2 p-1 min-w-[70px] md:sticky left-[106px] bg-white z-10">
                Davlat raqami
              </th>
              <th className="border-2 p-1 min-w-[150px] md:sticky left-[174px] bg-white z-10">
                Haydovchi
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
              <th className="border-2 p-1 min-w-[70px]">Jami transport puli</th>
              <th className="border-2 p-1 min-w-[70px]">Avans</th>
              <th className="border-2 p-1 min-w-[70px]">Qoldiq</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransports.map((transport, index) => {
              const calculations =
                transportCalculations.transportData[transport.id] || {};
              return (
                <tr key={index} className="text-center">
                  <td className="border-2 p-1 min-w-[40px] md:sticky left-0 bg-white z-10">
                    {index + 1}
                  </td>
                  <td className="border-2 p-1 min-w-[70px] md:sticky left-[38px] bg-white z-10">
                    {transport?.name}
                  </td>
                  <td className="border-2 p-1 min-w-[70px] md:sticky left-[106px] bg-white z-10">
                    {transport?.state_number}
                  </td>
                  <td className="border-2 p-1 min-w-[150px] md:sticky left-[174px] bg-white z-10">
                    {transport?.driver_full_name
                      ?.split(" ")
                      .slice(0, 2)
                      .join(" ")}
                  </td>
                  {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                    const date = `${selectedYear}-${String(
                      selectedMonth + 1,
                    ).padStart(2, "0")}-${String(dayIndex + 1).padStart(
                      2,
                      "0",
                    )}`;
                    const attendance = attendances.find(
                      (a) =>
                        a.date === date && a.transport?.id === transport.id,
                    );

                    return (
                      <td
                        key={dayIndex}
                        className={`border-2 min-w-[40px] ${
                          new Date(
                            selectedYear,
                            selectedMonth,
                            dayIndex + 1,
                          ).getDay() === 0
                            ? "bg-orange-200"
                            : ""
                        } ${
                          attendance?.attendance_type == 0 ? "bg-red-200" : ""
                        }`}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger className="block w-full h-full cursor-context-menu">
                            <div
                              onClick={() =>
                                openAttendanceDialog(
                                  transport.id,
                                  dayIndex + 1,
                                  attendance,
                                )
                              }
                              className="cursor-pointer w-full h-full flex items-center justify-center"
                            >
                              <span className="font-bold">
                                {attendance
                                  ? attendance.attendance_type
                                  : "\u00A0"}
                              </span>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() =>
                                handleAttendance(
                                  transport.id,
                                  dayIndex + 1,
                                  !!attendance,
                                  1,
                                  attendance?.id,
                                )
                              }
                            >
                              Keldi
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() =>
                                handleAttendance(
                                  transport.id,
                                  dayIndex + 1,
                                  !!attendance,
                                  0.5,
                                  attendance?.id,
                                )
                              }
                            >
                              Yarim kun
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() =>
                                handleAttendance(
                                  transport.id,
                                  dayIndex + 1,
                                  !!attendance,
                                  0,
                                  attendance?.id,
                                )
                              }
                            >
                              Kelmadi
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </td>
                    );
                  })}
                  <td className="border-2 p-1 min-w-[100px]">
                    {formatValue(transport?.salary)}
                  </td>
                  <td className="border-2 p-1 min-w-[70px]">
                    {calculations.workDays || 0}
                  </td>
                  <td className="border-2 p-1 min-w-[70px]">
                    {formatValue(calculations.totalTransportMoney || 0)}
                  </td>
                  <td className="border-2 p-1 min-w-[70px]">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openPaymentDialog(transport, "advance")}
                    >
                      {formatValue(calculations.advance) || 0}
                    </Button>
                  </td>
                  <td className="border-2 p-1 min-w-[70px]">
                    <span className="text-red-500 font-semibold">
                      {formatValue(calculations.debt || 0)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {/* Summary row with totals */}
            <tr className="text-center font-bold bg-gray-100">
              <td
                className="border-2 p-1 md:sticky left-0 bg-gray-100 z-10"
                colSpan={4}
              >
                Jami:
              </td>
              {/* Daily attendance totals */}
              {Array.from({ length: daysInMonth }).map((_, index) => (
                <td key={index} className="border-2 min-w-[40px] bg-gray-100">
                  <div className="flex flex-col items-center">
                    {/* Workday total (current) */}
                    <span>
                      {transportCalculations.totals.dailyTotals[index].toFixed(
                        1,
                      )}
                    </span>

                    {/* Money total (NEW) */}
                    <span className="text-green-600 font-semibold text-[11px]">
                      {formatValue(
                        transportCalculations.totals.dailyMoneyTotals[index] ||
                          0,
                      )}
                    </span>
                  </div>
                </td>
              ))}

              <td className="border-2 p-1 min-w-[100px]">
                {formatValue(
                  filteredTransports.reduce(
                    (total, transport) =>
                      total + (parseInt(transport?.salary) || 0),
                    0,
                  ),
                )}
              </td>
              <td className="border-2 p-1 min-w-[70px]">
                {transportCalculations.totals.workDays.toFixed(1)}
              </td>
              <td className="border-2 p-1 min-w-[70px]">
                {formatValue(
                  transportCalculations.totals.totalTransportMoney || 0,
                )}
              </td>
              <td className="border-2 p-1 min-w-[70px]">
                {formatValue(transportCalculations.totals.advance || 0)}
              </td>
              <td className="border-2 p-1 min-w-[70px]">
                <span className="text-red-500">
                  {formatValue(transportCalculations.totals.debt || 0)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Individual Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Davomat ma'lumotlari</DialogTitle>
            <DialogDescription>{currentAttendance?.date}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-type">Davomat turi</Label>
              <RadioGroup
                id="attendance-type"
                value={currentAttendance.attendance_type.toString()}
                onValueChange={(val) =>
                  setCurrentAttendance((prev) => ({
                    ...prev,
                    attendance_type: Number.parseFloat(val),
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="full-day" />
                  <Label htmlFor="full-day">Keldi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0.5" id="half-day" />
                  <Label htmlFor="half-day">Yarim kun</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="absent" />
                  <Label htmlFor="absent">Kelmadi</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">
                Maosh ({formatValue(currentAttendance.salary)} so'm)
              </Label>
              <Input
                id="salary"
                type="number"
                value={currentAttendance.salary}
                onChange={(e) =>
                  setCurrentAttendance((prev) => ({
                    ...prev,
                    salary: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAttendanceSubmit}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Attendance Dialog */}
      <Dialog open={massDialogOpen} onOpenChange={setMassDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ommaviy Davomat Qo'shish</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mass-date">Sana</Label>
              <Input
                id="mass-date"
                type="date"
                value={massAttendance.date}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setMassAttendance((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }));
                }}
                min={`${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0",
                )}-01`}
                max={`${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0",
                )}-${String(daysInMonth).padStart(2, "0")}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mass-attendance-type">Davomat turi</Label>
              <RadioGroup
                id="mass-attendance-type"
                value={massAttendance.attendance_type.toString()}
                onValueChange={(val) =>
                  setMassAttendance((prev) => ({
                    ...prev,
                    attendance_type: Number.parseFloat(val),
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="mass-full-day" />
                  <Label htmlFor="mass-full-day">Keldi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0.5" id="mass-half-day" />
                  <Label htmlFor="mass-half-day">Yarim kun</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="mass-absent" />
                  <Label htmlFor="mass-absent">Kelmadi</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="transport-search">Transportlarni tanlang</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={setSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Hammasini tanlash
                  </Label>
                </div>
              </div>
              <Input
                id="transport-search"
                type="text"
                placeholder="Qidiring: davlat raqami, rusumi yoki haydovchi"
                value={transportSearchTerm}
                onChange={(e) => setTransportSearchTerm(e.target.value)}
              />

              <div className="text-xs mt-1 text-gray-500">
                Tanlangan: {massAttendance.transport_ids.length} /{" "}
                {filteredTransportsForSelection.length}
              </div>

              <ScrollArea className="h-60 border rounded-md p-2">
                <div className="space-y-2">
                  {filteredTransportsForSelection.map((transport) => (
                    <div
                      key={transport.id}
                      className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded"
                    >
                      <Checkbox
                        id={`transport-${transport.id}`}
                        checked={massAttendance.transport_ids.includes(
                          transport.id,
                        )}
                        onCheckedChange={() =>
                          toggleTransportSelection(transport.id)
                        }
                      />
                      <Label
                        htmlFor={`transport-${transport.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <span className="font-medium">
                          {transport.state_number}
                        </span>{" "}
                        - {transport.name} - {transport.driver_full_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMassDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleMassAttendanceSubmit}
              disabled={
                massAttendance.transport_ids.length === 0 || isBulkUpdating
              }
            >
              {isBulkUpdating ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Small Attendance Dialog (Kichik Davomat) */}
      <Dialog open={smallDialogOpen} onOpenChange={setSmallDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Kichik Davomat Qo'shish</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Transport tanlang</Label>
              <div className="flex flex-col space-y-4">
                {/* Fix for Command component error */}
                <div className="relative">
                  <Input
                    placeholder="Qidirish: davlat raqami, rusumi, haydovchi"
                    value={transportSearchTerm}
                    onChange={(e) => setTransportSearchTerm(e.target.value)}
                    className="w-full"
                  />

                  {transportSearchTerm.trim() !== "" &&
                    transportSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {transportSearchResults.map((transport) => (
                          <div
                            key={transport.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedTransport(transport);
                              setTransportSearchTerm("");
                            }}
                          >
                            <div className="font-medium">
                              {transport.state_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transport.name} - {transport.driver_full_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {transportSearchTerm.trim() !== "" &&
                    transportSearchResults.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-2 text-gray-500">
                        Hech qanday transport topilmadi
                      </div>
                    )}
                </div>

                {selectedTransport && (
                  <div className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
                    <div>
                      <div className="font-medium">
                        {selectedTransport.state_number}
                      </div>
                      <div className="text-sm">{selectedTransport.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedTransport.driver_full_name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransport(null)}
                    >
                      x
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="small-attendance-type">Davomat turi</Label>
              <RadioGroup
                id="small-attendance-type"
                value={smallAttendance.attendance_type.toString()}
                onValueChange={(val) =>
                  setSmallAttendance((prev) => ({
                    ...prev,
                    attendance_type: Number.parseFloat(val),
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="small-full-day" />
                  <Label htmlFor="small-full-day">Keldi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0.5" id="small-half-day" />
                  <Label htmlFor="small-half-day">Yarim kun</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="small-absent" />
                  <Label htmlFor="small-absent">Kelmadi</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="small-salary">
                Maosh ({formatValue(smallAttendance.salary)} so'm)
              </Label>
              <Input
                id="small-salary"
                type="number"
                value={smallAttendance.salary}
                onChange={(e) =>
                  setSmallAttendance((prev) => ({
                    ...prev,
                    salary: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sanalarni tanlang</Label>
                <div className="text-xs text-gray-500">
                  {dateRange && dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd.MM.yyyy")} - ${format(
                        dateRange.to,
                        "dd.MM.yyyy",
                      )}`
                    : dateRange && dateRange.from
                      ? `${format(dateRange.from, "dd.MM.yyyy")}`
                      : "Sana tanlanmagan"}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSmallDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSmallAttendanceSubmit}
              disabled={
                !selectedTransport ||
                !dateRange ||
                !dateRange.from ||
                isBulkUpdating
              }
            >
              {isBulkUpdating ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Payment Dialog for both Salary and Advance */}
      <Dialog
        open={advanceDialogOpen || salaryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAdvanceDialogOpen(false);
            setSalaryDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {currentSubmitPayment.type === "advance" ? "Avans" : "Maosh"}
            </DialogTitle>
            <DialogDescription></DialogDescription>
            <div className="flex items-center gap-2">
              Belgilangan transport:
              <div>{selectedTransport?.name}</div>
              <div>{selectedTransport?.state_number}</div>
            </div>

            {/* Display all existing payments of this type */}
            {selectedTransport?.payment?.filter(
              (p) => p.type === currentSubmitPayment.type,
            ).length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">
                  {currentSubmitPayment.type === "advance" ? "Avans" : "Maosh"}{" "}
                  tarixi:
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {selectedTransport?.payment
                    ?.filter((p) => p.type === currentSubmitPayment.type)
                    .map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                      >
                        <span>{payment.date}</span>
                        <span className="font-semibold">
                          {formatValue(payment.amount)} so'm
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <div>Balansi:</div>
              {formatValue(
                (transportCalculations.transportData[selectedTransport?.id]
                  ?.totalTransportMoney || 0) -
                  (currentSubmitPayment.type === "advance"
                    ? transportCalculations.transportData[selectedTransport?.id]
                        ?.salary || 0
                    : transportCalculations.transportData[selectedTransport?.id]
                        ?.advance || 0),
              )}{" "}
              so'm
            </div>
            <div className="text-sm text-muted-foreground">
              Jami {currentSubmitPayment.type === "advance" ? "avans" : "maosh"}
              : {formatValue(currentSubmitPayment.amount)} so'm
            </div>
            <Input
              value={currentSubmitPayment.amount}
              onChange={(e) =>
                setCurrentSubmitPayment((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAdvanceDialogOpen(false);
                  setSalaryDialogOpen(false);
                }}
              >
                Yopish
              </Button>
              <Button
                onClick={() => handlePaymentSubmit(currentSubmitPayment.type)}
                disabled={isBulkUpdating}
              >
                {isBulkUpdating ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
