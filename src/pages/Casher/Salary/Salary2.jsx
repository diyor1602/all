"use client";

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

const formatNumber = (num) => {
  return parseFloat(num)?.toLocaleString("ru-RU");
};

const Salary2 = () => {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [salary, setSalary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rawDepartmentData, setRawDepartmentData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [filters, setFilters] = useState({
    department_id: "",
    group_id: "",
    start_date: "",
    end_date: "",
  });

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initializeFilters = () => {
    const savedFilters = localStorage.getItem("salary2-filters");
    let parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};

    // Set default dates if not present
    if (!parsedFilters.start_date || !parsedFilters.end_date) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${month}`;

      const firstDay = `${value}-01`;
      const lastDayDate = new Date(year, Number.parseInt(month), 0);
      const lastDay = formatDateLocal(lastDayDate);

      parsedFilters = {
        department_id: parsedFilters.department_id || "",
        group_id: parsedFilters.group_id || "",
        start_date: firstDay,
        end_date: lastDay,
      };

      setSelectedMonth(value);
    } else {
      setSelectedMonth(parsedFilters.start_date.substring(0, 7));
    }

    setFilters(parsedFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(parsedFilters));
    return parsedFilters;
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/casher/departments");
      const rawData = response.data || [];
      setRawDepartmentData(rawData);

      const flatDepartments =
        rawData.flatMap((item) => item?.departments) || [];
      setDepartments(flatDepartments);

      return { rawData, flatDepartments };
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
      return { rawData: [], flatDepartments: [] };
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
    return selectedDepartmentGroups;
  };

  const fetchSalaryData = async (filtersToUse) => {
    if (
      !filtersToUse.department_id ||
      !filtersToUse.start_date ||
      !filtersToUse.end_date
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/casher/groups", {
        params: { ...filtersToUse, type: "simple" },
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

  // Initialize component on mount
  useEffect(() => {
    const initializeComponent = async () => {
      // Initialize filters first
      const initialFilters = initializeFilters();

      // Fetch departments
      const { rawData, flatDepartments } = await fetchDepartments();

      let finalFilters = { ...initialFilters };

      // Handle department selection logic
      if (!initialFilters.department_id && flatDepartments.length > 0) {
        // No saved department, select first one
        const firstDepartmentId = flatDepartments[0].id.toString();
        const groups = loadGroupsForDepartment(firstDepartmentId, rawData);

        finalFilters = {
          ...initialFilters,
          department_id: firstDepartmentId,
          group_id: groups.length === 1 ? groups[0].id.toString() : "",
        };
      } else if (initialFilters.department_id) {
        // Has saved department, load its groups
        const groups = loadGroupsForDepartment(
          initialFilters.department_id,
          rawData
        );

        // If there's only one group, auto-select it
        if (groups.length === 1 && !initialFilters.group_id) {
          finalFilters = {
            ...initialFilters,
            group_id: groups[0].id.toString(),
          };
        }
      }

      // Update filters if they changed
      if (JSON.stringify(finalFilters) !== JSON.stringify(initialFilters)) {
        setFilters(finalFilters);
        localStorage.setItem("salary2-filters", JSON.stringify(finalFilters));
      }

      // Fetch salary data
      await fetchSalaryData(finalFilters);

      setIsInitialized(true);
    };

    initializeComponent();
  }, []);

  // Update employees when salary data changes
  useEffect(() => {
    const employees = salary.flatMap((s) => s.employees || []);
    setEmployees(employees);
  }, [salary]);

  // Fetch salary data when filters change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      fetchSalaryData(filters);
    }
  }, [filters, isInitialized]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value);

    const [year, month] = value.split("-");
    const firstDay = `${value}-01`;
    const lastDayDate = new Date(
      Number.parseInt(year),
      Number.parseInt(month),
      0
    );
    const lastDay = formatDateLocal(lastDayDate);

    const newFilters = {
      ...filters,
      start_date: firstDay,
      end_date: lastDay,
    };

    updateFilters(newFilters);
  };

  const handleDepartmentChange = (departmentId) => {
    const groups = loadGroupsForDepartment(departmentId, rawDepartmentData);

    const newFilters = {
      ...filters,
      department_id: departmentId,
      group_id: groups.length === 1 ? groups[0].id.toString() : "",
    };

    updateFilters(newFilters);
  };

  const handleGroupChange = (groupId) => {
    const newFilters = {
      ...filters,
      group_id: groupId,
    };

    updateFilters(newFilters);
  };

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
              <th className="border p-1">Topgan puli</th>
              <th className="border p-1">To'langan pul</th>
              <th className="border p-1">Amallar</th>
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
                    {formatNumber(employee?.balance)}
                  </td>
                  <td className="border p-1 text-center">
                    {formatNumber(employee?.earning?.total_earned)}
                  </td>
                  <td className="border p-1 text-center">
                    {formatNumber(employee?.earning?.total_paid)}
                  </td>
                  <td className="border p-1 text-center">
                    <Input type="number" />
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
