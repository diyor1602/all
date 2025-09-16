import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CircleDollarSign,
  Clock7,
  Image,
  UserPlus,
  UserX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const getDayInUzbek = (day) => {
  const days = [
    "Yakshanba",
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
  ];
  return days[day];
};

const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    start_date: new Date(start.getTime() + 5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    end_date: new Date(end.getTime() + 5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  };
};

const generateDaysInMonth = (year, month) => {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getStatusText = (attendance) => {
  if (!attendance) return "Davomat olinmagan";
  if (attendance.status === "present") return "Kelgan";
  if (attendance.status === "absent") return "Kelmagan";
  return "Davomat olinmagan";
};

const formatTimeFromString = (datetimeStr) => {
  if (!datetimeStr) return "-";
  if (datetimeStr.includes(" ")) {
    const [, time] = datetimeStr.split(" ");
    return time ? time.slice(0, 5) : "-";
  }
  try {
    const d = new Date(datetimeStr);
    if (isNaN(d)) return "-";
    return d.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const NewAttendance = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const today = new Date();

  const now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const stored = localStorage.getItem("salary2-filters");
  const initialFilters = stored
    ? JSON.parse(stored)
    : getMonthRange(currentYear, currentMonth);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedMonth, setSelectedMonth] = useState(
    filters.start_date.substring(0, 7)
  );
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);

  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("07:30");
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeDialogType, setTimeDialogType] = useState("");

  useEffect(() => {
    localStorage.setItem("salary2-filters", JSON.stringify(filters));
  }, [filters]);

  const fetchSalaryDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/superhr/employees/casher/${id}`, {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
      });
      setEmployeeData(response.data?.employee || null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
      setEmployeeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSalaryDetails();
    }
  }, [id, filters, toast]);

  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = generateDaysInMonth(year, month - 1);

  const attendanceMap = {};
  if (employeeData?.attendances) {
    employeeData.attendances.forEach((att) => {
      if (att?.date) attendanceMap[att.date] = att;
    });
  }

  const todayKey = toDateKey(today);

  const handleAbsent = async (date) => {
    const isAbsent = window.confirm(
      `${employeeData.name} ni kelmadi qilishga rozimisiz?`
    );
    if (!date) {
      toast({
        title: "Xatolik",
        description: "Sana tanlang",
        variant: "destructive",
      });
      return;
    }
    if (isAbsent) {
      try {
        await api.post("/superhr/attendances", {
          employee_id: id,
          date,
          status: "absent",
        });
        fetchSalaryDetails();
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat muvaffaqiyatli belgilandi",
          style: {
            backgroundColor: "green",
            color: "white",
          },
          duration: 1000,
        });
      } catch (error) {
        toast({
          title: "Xatolik",
          description: error.response?.data?.message || "Xatolik yuz berdi",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAttendanceFast2 = async (date, dialogTime = "07:30") => {
    try {
      const [hours, minutes] = dialogTime.split(":").map(Number);
      const checkInDate = new Date(date);
      checkInDate.setHours(hours, minutes, 0);

      const localDate = new Date(checkInDate);
      const isoWithTimezone = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .replace("Z", "+05:00");

      setLoading(true);
      await api.post("/superhr/attendances", {
        employee_id: id,
        date,
        check_in: isoWithTimezone,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Davomat muvaffaqiyatli belgilandi",
        style: { backgroundColor: "green", color: "white" },
        duration: 1000,
      });
      fetchSalaryDetails();
      setTimeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOutAttendanceFast2 = async (date, dialogTime = "17:30") => {
    try {
      const [hours, minutes] = dialogTime.split(":").map(Number);
      const checkOutDate = new Date(date);
      checkOutDate.setHours(hours, minutes, 0);

      const localDate = new Date(checkOutDate);
      const isoWithTimezone = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .replace("Z", "+05:00");

      const attendanceRecord = employeeData.attendances.find(
        (a) => a.date === date
      );

      if (!attendanceRecord) {
        toast({
          title: "Xatolik",
          description: "Davomat ma'lumoti topilmadi",
          variant: "destructive",
        });
        return;
      }

      await api.patch(`/superhr/attendances/${attendanceRecord.id}`, {
        check_out: isoWithTimezone,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Ketish vaqti muvaffaqiyatli belgilandi",
        style: { backgroundColor: "green", color: "white" },
        duration: 1000,
      });
      fetchSalaryDetails();
      setTimeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleAttendance = async () => {
    if (timeDialogType === "check_in") {
      await handleMarkAttendanceFast2(selectedDate, selectedTime);
    } else {
      await handleCheckOutAttendanceFast2(selectedDate, selectedTime);
    }
  };

  return (
    <div>
      <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {timeDialogType === "check_in" ? "Kelgan" : "Ketgan"} vaqtni
              belgilash
            </DialogTitle>
            <DialogDescription>{employeeData?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 py-4 w-full">
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={loading || !selectedTime}
              onClick={handleAttendance}
            >
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Attendance"
                className="max-w-full max-h-[600px]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-").map(Number);
          const range = getMonthRange(y, m - 1);
          setSelectedMonth(e.target.value);
          setFilters(range);
        }}
        className="w-48 bg-white"
      />

      <div>
        <table
          className={`border-collapse border border-gray-300 mt-4 w-full text-sm ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <thead>
            <tr>
              <th className="border border-gray-300 p-1">Sana</th>
              <th className="border border-gray-300 p-1">Kun</th>
              <th className="border border-gray-300 p-1">Status</th>
              <th className="border border-gray-300 p-1">Kelgan vaqti</th>
              <th className="border border-gray-300 p-1">Ketgan vaqti</th>
              <th className="border border-gray-300 p-1">Topgan puli</th>
            </tr>
          </thead>
          <tbody>
            {daysInMonth
              .filter((d) => toDateKey(d) <= todayKey)
              .map((date, idx) => {
                const key = toDateKey(date);
                const attendance = attendanceMap[key];

                return (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-1 text-center">
                      {date.toLocaleDateString("ru-RU")}
                    </td>
                    <td className="border border-gray-300 p-1">
                      {getDayInUzbek(date.getDay())}
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <div className="flex items-center gap-2 w-full justify-center">
                        <div>{getStatusText(attendance)}</div>
                        <UserX
                          className={`text-red-500 cursor-pointer ${
                            loading ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          size={15}
                          onClick={() => {
                            if (loading) return;
                            handleAbsent(key);
                          }}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <div className="flex items-center gap-4 w-full justify-center">
                        {attendance
                          ? formatTimeFromString(attendance.check_in)
                          : "-"}
                        {attendance?.check_in_image && (
                          <Image
                            className="cursor-pointer"
                            size={15}
                            onClick={() => {
                              setSelectedImage(attendance.check_in_image);
                              setImgDialogOpen(true);
                            }}
                          />
                        )}
                        <UserPlus
                          className={`text-green-500 cursor-pointer ${
                            loading ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          onClick={() => {
                            if (loading) return;
                            setSelectedTime("07:30");
                            setSelectedDate(key);
                            setTimeDialogOpen(true);
                            setTimeDialogType("check_in");
                          }}
                          size={15}
                        />
                        {/* Add button for making it 7:30 */}
                        <Clock7
                          onClick={() => {
                            if (loading) return;
                            handleMarkAttendanceFast2(key);
                          }}
                          className={`text-blue-500 cursor-pointer ${
                            loading ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          size={15}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <div className="flex items-center gap-4 w-full justify-center">
                        {attendance
                          ? formatTimeFromString(attendance.check_out)
                          : "-"}
                        {attendance?.check_out_image && (
                          <Image
                            className="cursor-pointer"
                            size={15}
                            onClick={() => {
                              setSelectedImage(attendance.check_out_image);
                              setImgDialogOpen(true);
                            }}
                          />
                        )}
                        <CircleDollarSign
                          className={
                            attendance?.check_in
                              ? "text-yellow-500 cursor-pointer"
                              : "text-gray-500 cursor-not-allowed"
                          }
                          onClick={() => {
                            if (loading || !attendance?.check_in) return;
                            setSelectedTime("17:30");
                            setSelectedDate(key);
                            setTimeDialogOpen(true);
                            setTimeDialogType("check_out");
                          }}
                          size={15}
                        />

                        <Zap
                          onClick={() => {
                            if (!attendance?.check_in || loading) {
                              return;
                            }
                            handleCheckOutAttendanceFast2(key);
                          }}
                          className={
                            attendance?.check_in
                              ? "text-blue-500 cursor-pointer"
                              : "text-gray-500 cursor-not-allowed"
                          }
                          size={15}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      {employeeData?.salary_visible
                        ? employeeData?.attendance_salaries?.find(
                            (att) => att.date === key
                          )?.amount && (
                            <div>
                              {parseFloat(
                                employeeData?.attendance_salaries?.find(
                                  (att) => att.date === key
                                )?.amount
                              )?.toLocaleString("ru-RU", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              so'm
                            </div>
                          )
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            <tr className="font-semibold bg-gray-100">
              <td
                colSpan="2"
                className="border border-gray-300 p-1 text-right pr-4"
              >
                Jami:
              </td>
              <td className="border border-gray-300 p-1 text-center">
                {employeeData?.attendances?.filter(
                  (att) => att.status === "present"
                ).length || 0}
              </td>
              <td
                colSpan="2"
                className="border border-gray-300 p-1 text-right pr-4"
              >
                Jami:
              </td>
              <td className="border border-gray-300 p-1 text-center">
                {employeeData?.salary_visible
                  ? `${employeeData?.attendance_salaries
                      ?.reduce(
                        (sum, item) => sum + (parseFloat(item.amount) || 0),
                        0
                      )
                      .toLocaleString("ru-RU", {
                        maximumFractionDigits: 0,
                      })} so'm`
                  : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewAttendance;
