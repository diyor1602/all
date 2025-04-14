import { useState, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";

const formatValue = (value) => {
  if (!value) return "";
  return parseInt(value).toLocaleString("en-EN");
};

const Attendance = () => {
  const { toast } = useToast();

  const today = new Date();
  const [attendances, setAttendances] = useState([]);
  const [transports, setTransports] = useState([]);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState({
    transport_id: null,
    date: "",
    attendance_type: 1,
    salary: 0,
    fuel_bonus: 0,
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
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`
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
    fuel_bonus: 0,
  });
  const [transportSearchResults, setTransportSearchResults] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  // Initialize dateRange with valid default values
  const [dateRange, setDateRange] = useState({
    from: new Date(selectedYear, selectedMonth, 1),
    to: null,
  });

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
      const response = await api.get("/transport/transports");
      setTransports(response.data.filter((transport) => transport.is_active));
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
      `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`
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
        t.name?.toLowerCase().includes(value)
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
          ? parseInt(selectedTransport.salary)
          : 0,
        fuel_bonus: selectedTransport.fuel_bonus
          ? parseInt(selectedTransport.fuel_bonus)
          : 0,
      }));
    }
  }, [selectedTransport]);

  const filteredTransports = transports.filter((t) => {
    const value = searchTerm.toLowerCase();
    return (
      t.state_number?.toLowerCase().includes(value) ||
      t.driver_full_name?.toLowerCase().includes(value)
    );
  });

  const filteredTransportsForSelection = transports.filter((t) => {
    const value = transportSearchTerm.toLowerCase();
    return (
      t.state_number?.toLowerCase().includes(value) ||
      t.driver_full_name?.toLowerCase().includes(value) ||
      t.name?.toLowerCase().includes(value)
    );
  });

  const openAttendanceDialog = (transportId, day, attendance) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Find the transport to get its default salary and fuel_bonus
    const transport = transports.find((t) => t.id === transportId);

    setCurrentAttendance({
      transport_id: transportId,
      date: formattedDate,
      attendance_type: attendance ? attendance.attendance_type : 1,
      salary: attendance
        ? attendance.salary || 0
        : transport?.salary
        ? parseInt(transport.salary)
        : 0,
      fuel_bonus: attendance
        ? attendance.fuel_bonus || 0
        : transport?.fuel_bonus
        ? parseInt(transport.fuel_bonus)
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
      fuel_bonus: 0,
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
            fuel_bonus: currentAttendance.fuel_bonus,
          }
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
          fuel_bonus: currentAttendance.fuel_bonus,
        });
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli qo'shildi",
          style: { backgroundColor: "green", color: "white" },
        });
      }

      fetchAttendances();
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

      fetchAttendances();
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
        transport_id: parseInt(smallAttendance.transport_id),
        dates: selectedDates,
        attendance_type: smallAttendance.attendance_type,
        salary: smallAttendance.salary,
        fuel_bonus: smallAttendance.fuel_bonus,
      };

      await api.post("/transport/massStoreByDates", payload);

      toast({
        title: "Muvaffaqiyatli",
        description: "Kichik davomat muvaffaqiyatli qo'shildi",
        style: { backgroundColor: "green", color: "white" },
      });

      fetchAttendances();
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

  // Keep the old handleAttendance for context menu compatibility
  const handleAttendance = async (
    transportId,
    day,
    hasAttendance,
    attendanceType,
    attendanceId = null
  ) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
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

      fetchAttendances();
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={`${selectedYear}-${String(selectedMonth + 1).padStart(
              2,
              "0"
            )}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-");
              setSelectedYear(parseInt(year));
              setSelectedMonth(parseInt(month) - 1);
            }}
            className="px-2 py-1 rounded w-fit bg-white"
          />
          <Input
            type="text"
            placeholder="Qidirish"
            className="px-2 py-1 rounded bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={openSmallAttendanceDialog}>
            Kichik davomat qo'shish
          </Button>
          <Button onClick={openMassAttendanceDialog}>
            Ommaviy Davomat Qo'shish
          </Button>
        </div>
      </div>

      <div className="max-h-[85vh] overflow-auto mt-4">
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
              <th className="border-2 p-1 min-w-[70px]">
                Jami yo'l kira haqqi
              </th>
              <th className="border-2 p-1 min-w-[70px]">Jami benzinli kun</th>
              <th className="border-2 p-1 min-w-[70px]">Jami benzin uchun</th>
              <th className="border-2 p-1 min-w-[70px]">Qarzdorlik</th>
              <th className="border-2 p-1 min-w-[70px]">Jami transport puli</th>
              <th className="border-2 p-1 min-w-[70px]">Jami to'langan pul</th>
              <th className="border-2 p-1 min-w-[70px]">Avans</th>
              <th className="border-2 p-1 min-w-[70px]">Maosh</th>
              <th className="border-2 p-1 min-w-[70px]">Boshqa to'lov</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransports.map((transport, index) => (
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
                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                  const date = `${selectedYear}-${String(
                    selectedMonth + 1
                  ).padStart(2, "0")}-${String(dayIndex + 1).padStart(2, "0")}`;
                  const attendance = attendances.find(
                    (a) => a.date === date && a.transport.id === transport.id
                  );
                  return (
                    <td key={dayIndex} className="border-2 min-w-[40px]">
                      <ContextMenu>
                        <ContextMenuTrigger className="block w-full h-full cursor-context-menu">
                          <div
                            onClick={() =>
                              openAttendanceDialog(
                                transport.id,
                                dayIndex + 1,
                                attendance
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
                                attendance?.id
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
                                attendance?.id
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
                                attendance?.id
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Davomat ma'lumotlari</DialogTitle>
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
                    attendance_type: parseFloat(val),
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
                    salary: parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-bonus">
                Benzin uchun bonus ({formatValue(currentAttendance.fuel_bonus)}{" "}
                so'm)
              </Label>
              <Input
                id="fuel-bonus"
                type="number"
                value={currentAttendance.fuel_bonus}
                onChange={(e) =>
                  setCurrentAttendance((prev) => ({
                    ...prev,
                    fuel_bonus: parseInt(e.target.value),
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
                  "0"
                )}-01`}
                max={`${selectedYear}-${String(selectedMonth + 1).padStart(
                  2,
                  "0"
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
                    attendance_type: parseFloat(val),
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
                          transport.id
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
                      ❌
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
                    attendance_type: parseFloat(val),
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
                    salary: parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="small-fuel-bonus">
                Benzin uchun bonus ({formatValue(smallAttendance.fuel_bonus)}{" "}
                so'm)
              </Label>
              <Input
                id="small-fuel-bonus"
                type="number"
                value={smallAttendance.fuel_bonus}
                onChange={(e) =>
                  setSmallAttendance((prev) => ({
                    ...prev,
                    fuel_bonus: parseInt(e.target.value),
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
                        "dd.MM.yyyy"
                      )}`
                    : dateRange && dateRange.from
                    ? `${format(dateRange.from, "dd.MM.yyyy")}`
                    : "Sana tanlanmagan"}
                </div>
              </div>

              <div className="w-full flex items-center justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  className="border rounded-md"
                  month={new Date(selectedYear, selectedMonth)}
                  disabled={[
                    {
                      before: new Date(selectedYear, selectedMonth, 1),
                      after: new Date(selectedYear, selectedMonth + 1, 0),
                    },
                  ]}
                />
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
    </div>
  );
};

export default Attendance;
