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

  const filteredTransports = transports.filter((t) => {
    const value = searchTerm.toLowerCase();
    return (
      t.state_number?.toLowerCase().includes(value) ||
      t.driver_full_name?.toLowerCase().includes(value)
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
          placeholder="Qidiring: davlat raqami yoki haydovchi"
          className="px-2 py-1 rounded bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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

      {/* Attendance Dialog */}
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
                    salary: parseInt(e.target.value) || 0,
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
                    fuel_bonus: parseInt(e.target.value) || 0,
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
    </div>
  );
};

export default Attendance;
