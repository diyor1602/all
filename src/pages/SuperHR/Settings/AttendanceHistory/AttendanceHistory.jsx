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

const AttendanceHistory = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    url: "",
    title: "",
    description: "",
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
  };

  const openImageDialog = (url, title, description) => {
    setSelectedImage({ url, title, description });
    setImageDialogOpen(true);
  };

  const filterAttendance = () => {
    let filtered = [...attendance];

    if (selectedStatus !== "all") {
      filtered = filtered.filter((record) => record.status === selectedStatus);
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.employee?.department_id === Number.parseInt(selectedDepartment)
      );
    }

    // Search for employee name or ID
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      const latinSearchTerm = cyrillicToLatin(searchTerm);
      filtered = filtered.filter((record) => {
        const employee = record.employee;
        if (!employee) return false;

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

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superhr/attendances/history", {
        params: { date: selectedDate },
      });
      setAttendance(response.data);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      const allSubDepartments = response.data.flatMap(
        (main) => main.departments
      );
      setDepartments(allSubDepartments);
    } catch (error) {
      console.log(error);
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchDepartments();
  }, [selectedDate]);

  useEffect(() => {
    setFilteredAttendance(filterAttendance());
  }, [attendance, selectedStatus, selectedDepartment, searchQuery]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        {/* Date navigation - make full width on mobile */}
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <Button
            variant="outline"
            onClick={() => changeDateBy(-1)}
            className="rounded-r-none"
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-none border-x-0 w-full bg-white"
            disabled={loading}
          />
          <Button
            variant="outline"
            onClick={() => changeDateBy(1)}
            className="rounded-l-none"
            disabled={loading}
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
            disabled={loading}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="present">Kelganlar</SelectItem>
              <SelectItem value="absent">Kelmaganlar</SelectItem>
              <SelectItem value="late">Kech kelganlar</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            className="w-full sm:w-[180px]"
            disabled={loading}
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

          <Input
            placeholder="ID yoki ism bo'yicha qidirish"
            className="w-full bg-white"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-4 overflow-auto max-h-[84vh]">
        <table className="w-full border-2 border-collapse whitespace-nowrap bg-white text-sm">
          <thead>
            <tr>
              <th className="p-1 border-2">ID</th>
              <th className="p-1 border-2">
                Xodimlar ({filteredAttendance?.length})
              </th>
              <th className="p-1 border-2">Status</th>
              <th className="p-1 border-2">Kelgan vaqti</th>
              <th className="p-1 border-2">Ketgan vaqti</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance?.map((record) => {
              const employee = record.employee;
              return (
                <tr key={record.id}>
                  <td className="p-1 border-2 text-center">{employee?.id}</td>
                  <td className="p-1 border-2">{employee?.name}</td>
                  <td className="p-1 border-2 text-center">
                    {statusTranslation[record.status] || "-"}
                  </td>
                  <td className="p-1 border-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {record?.check_in ? (
                        <>
                          <span>
                            {new Date(record.check_in).toLocaleTimeString(
                              "ru-RU",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {record.check_in_image && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                openImageDialog(
                                  record.check_in_image,
                                  `${employee?.name} - Keldi rasmi`,
                                  `${new Date(record.date).toLocaleDateString(
                                    "ru-RU"
                                  )} -
                                    ${new Date(
                                      record.check_in
                                    ).toLocaleTimeString("ru-RU")}`
                                )
                              }
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>
                  <td className="p-1 border-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {record?.check_out ? (
                        <>
                          <span>
                            {new Date(record.check_out).toLocaleTimeString(
                              "ru-RU",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {record.check_out_image && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                openImageDialog(
                                  record.check_out_image,
                                  `${employee?.name} - Ketdi rasmi`,
                                  `${new Date(record.date).toLocaleDateString(
                                    "ru-RU"
                                  )} -
                                    ${new Date(
                                      record.check_out
                                    ).toLocaleTimeString("ru-RU")}`
                                )
                              }
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
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
            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  Ma'lumot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedImage.title}</DialogTitle>
            <DialogDescription>{selectedImage.description}</DialogDescription>
          </DialogHeader>
          <div>
            <img
              src={selectedImage.url || "/placeholder.svg"}
              alt="Attendance image"
              className="w-full rounded-md border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendanceHistory;
