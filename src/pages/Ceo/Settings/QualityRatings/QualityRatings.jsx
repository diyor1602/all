import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QualityRatings = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(
    localStorage.getItem("qcStartDate") ||
      new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("qcEndDate") || new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const getData = async (
    start = null,
    end = null,
    departmentId = null,
    groupId = null,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append("start_date", start);
      if (end) params.append("end_date", end);
      if (departmentId) params.append("department_id", departmentId);
      if (groupId) params.append("group_id", groupId);

      const res = await api.get(
        `/employeeQualityControls?${params.toString()}`,
      );
      setData(res.data?.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData(startDate, endDate, selectedDepartment, selectedGroup);
  }, [startDate, endDate, selectedDepartment, selectedGroup]);

  useEffect(() => {
    const getDepartments = async () => {
      try {
        const res = await api.get("/departments");
        setDepartments(res.data?.flatMap((d) => d.departments));
      } catch {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Bo'limlarni olishda xatolik yuz berdi",
        });
      }
    };
    getDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      const department = departments.find((d) => d.id === selectedDepartment);
      if (department && department.groups) {
        setGroups(department.groups);
      } else {
        setGroups([]);
      }
    } else {
      setGroups([]);
    }
  }, [selectedDepartment, departments]);

  const handleDepartmentChange = (value) => {
    const departmentId = value === "all" ? null : parseInt(value);
    setSelectedDepartment(departmentId);
    setSelectedGroup(null);
  };

  const handleGroupChange = (value) => {
    const groupId = value === "all" ? null : parseInt(value);
    setSelectedGroup(groupId);
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    localStorage.setItem("qcStartDate", value);
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    localStorage.setItem("qcEndDate", value);
  };

  const handleImageClick = (imageSrc, employeeName) => {
    setSelectedImage({ src: imageSrc, name: employeeName });
    setIsImageDialogOpen(true);
  };

  const closeImageDialog = () => {
    setIsImageDialogOpen(false);
    setSelectedImage(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="bg-white w-fit"
        />
        <Input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className="bg-white w-fit"
        />
        <Select
          onValueChange={handleDepartmentChange}
          value={selectedDepartment?.toString() || "all"}
        >
          <SelectTrigger className="bg-white w-48">
            <SelectValue placeholder="Bo'limni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha bo'limlar</SelectItem>
            {departments
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((department) => (
                <SelectItem
                  key={department.id}
                  value={department.id.toString()}
                >
                  {department.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={handleGroupChange}
          value={selectedGroup?.toString() || "all"}
          disabled={!selectedDepartment || groups.length === 0}
        >
          <SelectTrigger className="bg-white w-48">
            <SelectValue placeholder="Guruhni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha guruhlar</SelectItem>
            {groups
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full overflow-auto mt-4">
        <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 bg-gray-50">№</th>
              <th className="border border-gray-300 px-4 py-2 bg-gray-50">
                Xodim
              </th>
              <th className="border border-gray-300 px-4 py-2 bg-gray-50">
                Jami braklar
              </th>
              <th className="border border-gray-300 px-4 py-2 bg-gray-50">
                To'g'rilanganlar
              </th>
              <th className="border border-gray-300 px-4 py-2 bg-gray-50">
                Yakunlanmagan
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((employee, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex items-center gap-2">
                    {employee?.image ? (
                      <img
                        src={employee?.image}
                        className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          handleImageClick(
                            employee.image,
                            employee.employee_name,
                          )
                        }
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        {employee?.employee_name?.[0]}
                      </div>
                    )}
                    <div>
                      <div>{employee?.employee_name}</div>
                      <div className="text-xs">{employee?.group?.name}</div>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {employee?.fail_total}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {employee?.fail_approved}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {employee?.fail_pending}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedImage && (
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="max-w-full max-h-96 rounded-lg object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualityRatings;
