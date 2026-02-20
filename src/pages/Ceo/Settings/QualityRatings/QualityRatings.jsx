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

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Boshlanish sana</div>
            <Input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="bg-white w-fit"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Tugash sana</div>
            <Input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="bg-white w-fit"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Bo'lim</div>
            <Select
              onValueChange={handleDepartmentChange}
              value={selectedDepartment?.toString() || "all"}
            >
              <SelectTrigger className="bg-white w-full">
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
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Guruh</div>
            <Select
              onValueChange={handleGroupChange}
              value={selectedGroup?.toString() || "all"}
              disabled={!selectedDepartment || groups.length === 0}
            >
              <SelectTrigger className="bg-white w-full">
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
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600">
                  №
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Xodim
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-600">
                  Jami braklar
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-600">
                  To'g'rilanganlar
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-600">
                  Yakunlanmagan
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : !data?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                data
                  ?.sort((a, b) => b.fail_pending - a.fail_pending)
                  .map((employee, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-white hover:bg-gray-50"
                          : "bg-gray-50/40 hover:bg-gray-100/40"
                      }
                    >
                      <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
                        {index + 1}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {employee?.image ? (
                            <img
                              src={employee?.image}
                              alt={employee?.employee_name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-gray-200"
                              onClick={() =>
                                handleImageClick(
                                  employee.image,
                                  employee.employee_name,
                                )
                              }
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 ring-1 ring-gray-200">
                              {employee?.employee_name?.[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {employee?.employee_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {employee?.group?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                        {employee?.fail_total}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                        {employee?.fail_approved}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                        {employee?.fail_pending}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
            {!loading && data?.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100/60 font-semibold">
                  <td className="border-t border-gray-300 px-4 py-3 text-sm text-gray-700">
                    Jami
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3" />
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                    {data.reduce((sum, e) => sum + (e?.fail_total || 0), 0)}
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                    {data.reduce((sum, e) => sum + (e?.fail_approved || 0), 0)}
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                    {data.reduce((sum, e) => sum + (e?.fail_pending || 0), 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
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
                className="w-full max-h-[70vh] rounded-lg object-contain bg-gray-50"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualityRatings;
