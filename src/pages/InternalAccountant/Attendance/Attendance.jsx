"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const statusTranslation = {
  absent: "Kelmagan",
  present: "Vaqtida kelgan",
  late: "Kech kelgan",
};

const cyrillicToLatin = (text) => {
  const cyrillicToLatinMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "j",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "x",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sh",
    ъ: "",
    ы: "i",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    ў: "o",
    қ: "q",
    ғ: "g",
    ҳ: "h",
  };
  return text
    .toLowerCase()
    .split("")
    .map((char) => cyrillicToLatinMap[char] || char)
    .join("");
};

const Attendance = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [checkInTime, setCheckInTime] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkCheckInTime, setBulkCheckInTime] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    processing: false,
    total: 0,
    current: 0,
    success: [],
    failed: [],
  });

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const changeDateBy = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(formatDate(date));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Combined search is now handled in filterEmployees()
  };

  const openAttendanceDialog = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    // Find the employee details to display in the dialog
    const employee = employees.find((emp) => emp.id === employeeId);
    setSelectedEmployee(employee);

    // Set default time to current time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setCheckInTime(`${hours}:${minutes}`);
    setAttendanceDialogOpen(true);
  };

  const handleMarkAttendance = async () => {
    if (!selectedEmployeeId || !checkInTime) return;

    try {
      setLoading(true);

      // Create date from selected date and time
      const [hours, minutes] = checkInTime.split(":");
      const checkInDate = new Date(selectedDate);
      checkInDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0);

      // Add Uzbekistan timezone offset (GMT+5) by specifying proper ISO format with timezone
      // Use the timezone offset for Uzbekistan (+05:00)
      const localDate = new Date(checkInDate);
      const isoWithTimezone = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .replace("Z", "+05:00");

      await api.post("/internalAccountant/attendances", {
        employee_id: selectedEmployeeId,
        check_in: isoWithTimezone,
        date: selectedDate,
      });

      fetchAttendance();
      setAttendanceDialogOpen(false);
      setSelectedEmployeeId(null);

      toast({
        title: "Muvaffaqiyatli",
        description: "Davomat belgilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
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

  const filterEmployees = () => {
    let filtered = [...employees];

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (employee) =>
          employee.department_id === Number.parseInt(selectedDepartment)
      );

      if (selectedGroup !== "all") {
        filtered = filtered.filter(
          (employee) => employee.group_id === Number.parseInt(selectedGroup)
        );
      }
    }

    if (selectedStatus === "no_attendance") {
      filtered = filtered.filter(
        (employee) => !attendance.find((a) => a.employee_id === employee.id)
      );
    } else if (selectedStatus !== "all") {
      filtered = filtered.filter((employee) => {
        const attendanceRecord = attendance.find(
          (a) => a.employee_id === employee.id
        );
        return attendanceRecord?.status === selectedStatus;
      });
    }

    // Combined name and ID search logic
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      const latinSearchTerm = cyrillicToLatin(searchTerm);
      filtered = filtered.filter((employee) => {
        const latinName = cyrillicToLatin(employee.name.toLowerCase());
        const name = employee.name.toLowerCase();
        const id = employee.id.toString();
        return (
          name.includes(searchTerm) ||
          latinName.includes(latinSearchTerm) ||
          id.includes(searchQuery)
        );
      });
    }

    return filtered;
  };

  const handleCheckboxChange = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleBulkAttendance = async () => {
    if (selectedEmployees.length === 0 || !bulkCheckInTime) return;

    try {
      setProcessingStatus({
        processing: true,
        total: selectedEmployees.length,
        current: 0,
        success: [],
        failed: [],
      });

      // Create date from selected date and time
      const [hours, minutes] = bulkCheckInTime.split(":");
      const checkInDate = new Date(selectedDate);
      checkInDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0);

      // Use the timezone offset for Uzbekistan (+05:00)
      const localDate = new Date(checkInDate);
      const isoWithTimezone = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .replace("Z", "+05:00");

      // Process each employee one by one
      for (let i = 0; i < selectedEmployees.length; i++) {
        const employeeId = selectedEmployees[i];
        setProcessingStatus((prev) => ({
          ...prev,
          current: i + 1,
        }));

        try {
          await api.post("/internalAccountant/attendances", {
            employee_id: employeeId,
            check_in: isoWithTimezone,
            date: selectedDate,
          });

          setProcessingStatus((prev) => ({
            ...prev,
            success: [...prev.success, employeeId],
          }));
        } catch (error) {
          const employee = employees.find((emp) => emp.id === employeeId);
          setProcessingStatus((prev) => ({
            ...prev,
            failed: [
              ...prev.failed,
              {
                id: employeeId,
                name: employee?.name,
                error: error.response?.data?.message || "Xatolik yuz berdi",
              },
            ],
          }));
        }
      }

      // After all processing is done
      fetchAttendance();

      // Don't close dialog yet - user needs to see results
      // setBulkDialogOpen(false);
      // setSelectedEmployees([]);

      toast({
        title: "Muvaffaqiyatli",
        description: `Davomat muvaffaqiyatli belgilandi`,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus((prev) => ({
        ...prev,
        processing: false,
      }));
    }
  };

  const resetBulkAttendance = () => {
    setBulkDialogOpen(false);
    setSelectedEmployees([]);
    setProcessingStatus({
      processing: false,
      total: 0,
      current: 0,
      success: [],
      failed: [],
    });
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/internalAccountant/employees/working");
      setEmployees(response.data);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/internalAccountant/attendances", {
        params: { date: selectedDate },
      });
      setAttendance(response.data);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/internalAccountant/departments");
      const allSubDepartments = response.data.flatMap(
        (main) => main.departments
      );

      setDepartments(allSubDepartments);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedDepartment === "all") {
      setGroups([]);
      setSelectedGroup("all");
    } else {
      const selectedDept = departments.find(
        (dept) => dept.id === Number.parseInt(selectedDepartment)
      );
      if (selectedDept && selectedDept.groups) {
        setGroups(selectedDept.groups);
      } else {
        setGroups([]);
      }
      setSelectedGroup("all");
    }
  }, [selectedDepartment, departments]);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchDepartments();
  }, [selectedDate]);

  useEffect(() => {
    setFilteredEmployees(filterEmployees());
  }, [
    employees,
    attendance,
    selectedStatus,
    selectedDepartment,
    selectedGroup,
    searchQuery,
  ]);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        {/* Date navigation - make full width on mobile */}
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <Button
            variant="outline"
            onClick={() => changeDateBy(-1)}
            className="rounded-r-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-none border-x-0 w-full bg-white"
          />
          <Button
            variant="outline"
            onClick={() => changeDateBy(1)}
            className="rounded-l-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters row - each item full width on mobile */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            className="w-full sm:w-[180px]"
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="no_attendance">Davomat olinmagan</SelectItem>
              <SelectItem value="present">Kelganlar</SelectItem>
              <SelectItem value="absent">Kelmaganlar</SelectItem>
              <SelectItem value="late">Kech kelganlar</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            className="w-full sm:w-[180px]"
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Bo'lim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha bo'limlar</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedGroup}
            onValueChange={setSelectedGroup}
            className="w-full sm:w-[180px]"
            disabled={selectedDepartment === "all" || groups.length === 0}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Guruh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruhlar</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="ID yoki ism bo'yicha qidirish"
            className="w-full bg-white"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 overflow-auto max-h-[84vh]">
        <table className="w-full border-2 border-collapse whitespace-nowrap bg-white text-sm">
          <thead>
            <tr>
              <th className="p-1 border-2 w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={
                    selectedEmployees.length > 0 &&
                    selectedEmployees.length === filteredEmployees.length
                  }
                  onChange={() => {
                    if (selectedEmployees.length === filteredEmployees.length) {
                      setSelectedEmployees([]);
                    } else {
                      setSelectedEmployees(
                        filteredEmployees.map((emp) => emp.id)
                      );
                    }
                  }}
                />
              </th>
              <th className="p-1 border-2">ID</th>
              <th className="p-1 border-2">
                Xodimlar ({filteredEmployees?.length})
              </th>
              <th className="p-1 border-2">Status</th>
              <th className="p-1 border-2">Kelgan vaqti</th>
              <th className="p-1 border-2">Ketgan vaqti</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((employee) => {
                const attendanceRecord = attendance?.find(
                  (item) => item?.employee_id === employee?.id
                );
                return (
                  <tr key={employee.id}>
                    <td className="p-1 border-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleCheckboxChange(employee.id)}
                      />
                    </td>
                    <td className="p-1 border-2 text-center">{employee?.id}</td>
                    <td className="p-1 border-2">{employee?.name}</td>
                    <td className="p-1 border-2 text-center">
                      {attendanceRecord ? (
                        <div className="flex items-center justify-center gap-2">
                          <span>
                            {statusTranslation[attendanceRecord.status]}
                          </span>
                        </div>
                      ) : // Only show "Keldi" button for today's date
                      isToday ? (
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => openAttendanceDialog(employee.id)}
                        >
                          Keldi
                        </Button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-1 border-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {attendanceRecord?.check_in ? (
                          <>
                            <span>
                              {new Date(
                                attendanceRecord.check_in
                              ).toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {attendanceRecord.check_in_image && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 p-0"
                                  >
                                    <ImageIcon className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {employee?.name} - Keldi rasmi
                                    </DialogTitle>
                                    <DialogDescription>
                                      {new Date(
                                        attendanceRecord.date
                                      ).toLocaleDateString("ru-RU")}{" "}
                                      -
                                      {new Date(
                                        attendanceRecord.check_in
                                      ).toLocaleTimeString("ru-RU")}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div>
                                    <img
                                      src={
                                        attendanceRecord.check_in_image ||
                                        "/placeholder.svg"
                                      }
                                      alt="Check-in image"
                                      className="w-full rounded-md border"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="p-1 border-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {attendanceRecord?.check_out ? (
                          <>
                            <span>
                              {new Date(
                                attendanceRecord.check_out
                              ).toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {attendanceRecord.check_out_image && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 p-0"
                                  >
                                    <ImageIcon className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {employee?.name} - Ketdi rasmi
                                    </DialogTitle>
                                    <DialogDescription>
                                      {new Date(
                                        attendanceRecord.date
                                      ).toLocaleDateString("ru-RU")}{" "}
                                      -
                                      {new Date(
                                        attendanceRecord.check_out
                                      ).toLocaleTimeString("ru-RU")}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div>
                                    <img
                                      src={
                                        attendanceRecord.check_out_image ||
                                        "/placeholder.svg"
                                      }
                                      alt="Check-out image"
                                      className="w-full rounded-md border"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {selectedEmployees.length > 0 && isToday && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              // Set default time to current time
              const now = new Date();
              const hours = now.getHours().toString().padStart(2, "0");
              const minutes = now.getMinutes().toString().padStart(2, "0");
              setBulkCheckInTime(`${hours}:${minutes}`);
              setBulkDialogOpen(true);
            }}
          >
            {selectedEmployees.length} ta xodim uchun "Keldi" belgisini qo'yish
          </Button>
        </div>
      )}

      {/* Attendance Dialog */}
      <Dialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Davomat belgilash</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.name} uchun kelgan vaqtni kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="check-in-time" className="text-right col-span-1">
                Kelgan vaqti
              </label>
              <Input
                id="check-in-time"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={loading || !checkInTime}
            >
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Attendance Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onOpenChange={(open) => {
          if (!open && !processingStatus.processing) {
            resetBulkAttendance();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ommaviy davomat belgilash</DialogTitle>
            <DialogDescription>
              {selectedEmployees.length} ta xodim uchun kelgan vaqtni kiriting
            </DialogDescription>
          </DialogHeader>

          {!processingStatus.processing &&
            processingStatus.success.length === 0 &&
            processingStatus.failed.length === 0 && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="bulk-check-in-time"
                    className="text-right col-span-1"
                  >
                    Kelgan vaqti
                  </label>
                  <Input
                    id="bulk-check-in-time"
                    type="time"
                    value={bulkCheckInTime}
                    onChange={(e) => setBulkCheckInTime(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}

          {processingStatus.processing && (
            <div className="py-4">
              <div className="mb-2 flex justify-between">
                <span>
                  Jarayon: {processingStatus.current} / {processingStatus.total}
                </span>
                <span>
                  {Math.round(
                    (processingStatus.current / processingStatus.total) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      (processingStatus.current / processingStatus.total) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {!processingStatus.processing &&
            (processingStatus.success.length > 0 ||
              processingStatus.failed.length > 0) && (
              <div className="py-4 max-h-[300px] overflow-auto">
                {processingStatus.success.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-green-600 mb-2">
                      Muvaffaqiyatli ({processingStatus.success.length})
                    </h3>
                    <ul className="text-sm space-y-1">
                      {processingStatus.success.map((id) => {
                        const employee = employees.find((emp) => emp.id === id);
                        return (
                          <li key={`success-${id}`} className="text-gray-700">
                            {employee?.name || `ID: ${id}`}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {processingStatus.failed.length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-600 mb-2">
                      Muvaffaqiyatsiz ({processingStatus.failed.length})
                    </h3>
                    <ul className="text-sm space-y-2">
                      {processingStatus.failed.map((item) => (
                        <li key={`failed-${item.id}`} className="text-gray-700">
                          <div className="font-medium">
                            {item.name || `ID: ${item.id}`}
                          </div>
                          <div className="text-red-500 text-xs">
                            {item.error}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          <DialogFooter>
            {!processingStatus.processing && (
              <>
                <Button variant="outline" onClick={resetBulkAttendance}>
                  {processingStatus.success.length > 0 ||
                  processingStatus.failed.length > 0
                    ? "Yopish"
                    : "Bekor qilish"}
                </Button>

                {processingStatus.success.length === 0 &&
                  processingStatus.failed.length === 0 && (
                    <Button
                      onClick={handleBulkAttendance}
                      disabled={!bulkCheckInTime}
                    >
                      Saqlash
                    </Button>
                  )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Attendance;
