import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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

  const [sortConfig, setSortConfig] = useState({
    key: "fail_pending",
    direction: "desc",
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

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

      setData(res.data?.data || []);
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
        setDepartments(res.data?.flatMap((d) => d.departments) || []);
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

  const handleImageClick = (imageSrc, title = "Rasm") => {
    setSelectedImage({ src: imageSrc, name: title });
    setIsImageDialogOpen(true);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeDialogOpen(true);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ArrowUpDown;
    return sortConfig.direction === "asc" ? ArrowUp : ArrowDown;
  };

  const sortedData = Array.isArray(data)
    ? [...data].sort((a, b) => {
        const key = sortConfig.key;
        const dir = sortConfig.direction === "asc" ? 1 : -1;
        const av = Number(a?.[key] ?? 0);
        const bv = Number(b?.[key] ?? 0);
        return (av - bv) * dir;
      })
    : [];

  const getStatusStyles = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-red-100 text-red-700";
    }
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
                  <button
                    type="button"
                    onClick={() => handleSort("fail_total")}
                    className="w-full inline-flex items-center justify-end gap-1"
                  >
                    <span>Jami braklar</span>
                    {(() => {
                      const Icon = getSortIcon("fail_total");
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                  </button>
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => handleSort("fail_approved")}
                    className="w-full inline-flex items-center justify-end gap-1"
                  >
                    <span>To'g'rilangan</span>
                    {(() => {
                      const Icon = getSortIcon("fail_approved");
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                  </button>
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => handleSort("fail_pending")}
                    className="w-full inline-flex items-center justify-end gap-1"
                  >
                    <span>Yakunlanmagan</span>
                    {(() => {
                      const Icon = getSortIcon("fail_pending");
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                  </button>
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
              ) : !sortedData?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                sortedData.map((employee, index) => (
                  <tr
                    key={employee?.employee_id || index}
                    className={
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-50 cursor-pointer"
                        : "bg-gray-50/40 hover:bg-gray-100/40 cursor-pointer"
                    }
                    onClick={() => handleEmployeeClick(employee)}
                  >
                    <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
                      {index + 1}
                    </td>

                    <td className="border-b border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {employee?.image ? (
                          <img
                            src={employee.image}
                            alt={employee.employee_name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(
                                employee.image,
                                employee.employee_name,
                              );
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 ring-1 ring-gray-200">
                            {employee?.employee_name?.[0] || "?"}
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

                    <td className="border-b border-gray-200 px-4 py-3 text-right text-sm text-gray-700">
                      {employee?.fail_total}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-right text-sm text-gray-700">
                      {employee?.fail_approved}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-right text-sm text-gray-700">
                      {employee?.fail_pending}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {!loading && sortedData?.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100/60 font-semibold">
                  <td className="border-t border-gray-300 px-4 py-3 text-sm text-gray-700">
                    Jami
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3" />
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm text-gray-700">
                    {sortedData.reduce(
                      (sum, e) => sum + (e?.fail_total || 0),
                      0,
                    )}
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm text-gray-700">
                    {sortedData.reduce(
                      (sum, e) => sum + (e?.fail_approved || 0),
                      0,
                    )}
                  </td>
                  <td className="border-t border-gray-300 px-4 py-3 text-right text-sm text-gray-700">
                    {sortedData.reduce(
                      (sum, e) => sum + (e?.fail_pending || 0),
                      0,
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Dialog
        open={isEmployeeDialogOpen}
        onOpenChange={setIsEmployeeDialogOpen}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee?.employee_name} - Quality Controls
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] pr-1">
            {!selectedEmployee?.quality_controls?.length ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Quality controls topilmadi
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedEmployee.quality_controls
                  .sort((a, b) => {
                    if (a.status === "pending" && b.status !== "pending") {
                      return -1;
                    }
                    if (a.status !== "pending" && b.status === "pending") {
                      return 1;
                    }
                    return 0;
                  })
                  .map((qc) => (
                    <div
                      key={qc.id}
                      className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        className="block w-full"
                        onClick={() =>
                          handleImageClick(
                            qc.image,
                            `${selectedEmployee.employee_name} - QC #${qc.id}`,
                          )
                        }
                      >
                        <img
                          src={qc.image}
                          alt={`QC ${qc.id}`}
                          className="w-full h-56 object-cover bg-gray-100"
                        />
                      </button>

                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-gray-900">
                            #{qc.id}
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyles(qc.status)}`}
                          >
                            {qc.status === "approved"
                              ? "To'g'irlangan"
                              : "To'g'irlanmagan"}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            Buyurtma:
                          </span>{" "}
                          {qc.order_id}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            Sana:
                          </span>{" "}
                          {qc.created_at}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            Izoh:
                          </span>{" "}
                          {qc.description || "-"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedImage && (
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="w-full max-h-[75vh] rounded-lg object-contain bg-gray-50"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualityRatings;
