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
import { cn } from "@/lib/utils";

const Salary2 = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [salary, setSalary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rawDepartmentData, setRawDepartmentData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem("salary2-filters");
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return {
      department_id: "",
      group_id: "",
      start_date: "",
      end_date: "",
    };
  });

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (filters.start_date) {
      const savedMonth = filters.start_date.substring(0, 7);
      setSelectedMonth(savedMonth);
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${month}`;
      setSelectedMonth(value);

      const firstDay = `${value}-01`;
      const lastDayDate = new Date(year, parseInt(month), 0);
      const lastDay = formatDateLocal(lastDayDate);

      const newFilters = {
        ...filters,
        start_date: firstDay,
        end_date: lastDay,
      };

      setFilters(newFilters);
      localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/casher/departments");
      const rawData = response.data || [];
      setRawDepartmentData(rawData);

      const flatDepartments =
        rawData.flatMap((item) => item?.departments) || [];
      setDepartments(flatDepartments);

      if (!filters.department_id && flatDepartments.length > 0) {
        const firstDepartmentId = flatDepartments[0].id.toString();
        const groups = loadGroupsForDepartment(firstDepartmentId, rawData);

        if (groups.length !== 1) {
          const newFilters = {
            ...filters,
            department_id: firstDepartmentId,
            group_id: "",
          };
          setFilters(newFilters);
          localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
        }
      } else if (filters.department_id) {
        loadGroupsForDepartment(filters.department_id, rawData);
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    }
  };

  const loadGroupsForDepartment = (departmentId, rawData) => {
    const selectedDepartmentGroups = [];

    rawData.forEach((mainDept) => {
      const department = mainDept.departments?.find(
        (dept) => dept.id.toString() === departmentId
      );
      if (department && department.groups) {
        selectedDepartmentGroups.push(...department.groups);
      }
    });

    setGroups(selectedDepartmentGroups);

    if (selectedDepartmentGroups.length === 1) {
      const singleGroupId = selectedDepartmentGroups[0].id.toString();
      const newFilters = {
        ...filters,
        department_id: departmentId,
        group_id: singleGroupId,
      };
      setFilters(newFilters);
      localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
    }

    return selectedDepartmentGroups;
  };

  const fetchSalary = async () => {
    if (!filters.department_id || !filters.start_date || !filters.end_date) {
      return;
    }
    try {
      setLoading(true);
      const response = await api.get("/casher/groups", {
        params: filters,
      });
      setSalary(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const employees = salary.flatMap((s) => s.employees || []);
    setEmployees(employees);
  }, [salary]);

  const fetchSalaryWithCustomFilters = async (customFilters) => {
    try {
      setLoading(true);
      console.log("Fetching salary with custom filters:", customFilters);
      const response = await api.get("/casher/groups", {
        params: customFilters,
      });
      setSalary(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSalary();
  }, [filters]);

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value);

    const [year, month] = value.split("-");
    const firstDay = `${value}-01`;
    const lastDayDate = new Date(parseInt(year), parseInt(month), 0);
    const lastDay = formatDateLocal(lastDayDate);

    const newFilters = {
      ...filters,
      start_date: firstDay,
      end_date: lastDay,
    };

    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
  };

  const handleDepartmentChange = (departmentId) => {
    const groups = loadGroupsForDepartment(departmentId, rawDepartmentData);

    if (groups.length !== 1) {
      const newFilters = {
        ...filters,
        department_id: departmentId,
        group_id: "",
      };

      setFilters(newFilters);
      localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
    }
  };

  const handleGroupChange = (groupId) => {
    const newFilters = {
      ...filters,
      group_id: groupId,
    };

    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));

    if (
      newFilters.department_id &&
      newFilters.start_date &&
      newFilters.end_date &&
      newFilters.group_id
    ) {
      fetchSalaryWithCustomFilters(newFilters);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("salary2-filters");
    let parsed = saved ? JSON.parse(saved) : {};

    const hasDates = parsed.start_date && parsed.end_date;

    if (!hasDates) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${month}`;

      const firstDay = `${value}-01`;
      const lastDayDate = new Date(year, parseInt(month), 0);
      const lastDay = formatDateLocal(lastDayDate);

      const fixedFilters = {
        ...parsed,
        start_date: firstDay,
        end_date: lastDay,
      };

      setFilters(fixedFilters);
      setSelectedMonth(value);
      localStorage.setItem("salary2-filters", JSON.stringify(fixedFilters));
    } else {
      setFilters(parsed);
      setSelectedMonth(parsed.start_date.substring(0, 7));
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="bg-white w-fit"
        />

        <Select
          onValueChange={handleDepartmentChange}
          value={filters.department_id}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'lim" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id.toString()}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={handleGroupChange}
          value={filters.group_id}
          disabled={!filters.department_id || groups.length === 0}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Guruh" />
          </SelectTrigger>
          <SelectContent>
            {groups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full whitespace-normal border text-sm bg-white">
          <thead>
            <tr>
              <th className="border p-1">№</th>
              <th className="border p-1">Xodim</th>
              <th className="border p-1">Balansi</th>
            </tr>
          </thead>
          <tbody className={cn("", loading && "cursor-not-allowed opacity-50")}>
            {employees
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((employee, index) => (
                <tr key={index}>
                  <td className="border p-1 text-center">{index + 1}</td>
                  <td className="border p-1">{employee?.name}</td>
                  <td className="border p-1 text-center">
                    {employee?.balance}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Salary2;
