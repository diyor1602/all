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

const Departments = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rawDepartmentData, setRawDepartmentData] = useState([]);
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
    }

    setFilters(parsedFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(parsedFilters));
    return parsedFilters;
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/ceo/departments");
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

    // try {
    //   const response = await api.get("/ceo/groups", {
    //     params: {
    //       ...filtersToUse,
    //       type: "simple",
    //     },
    //   });
    // } catch (error) {
    //   toast({
    //     title: "Xatolik",
    //     description: "Bunday ma'lumot topilmadi",
    //     variant: "destructive",
    //   });
    // }
  };

  useEffect(() => {
    fetchSalaryData(filters);
  }, [filters]);

  useEffect(() => {
    const initializeComponent = async () => {
      const initialFilters = initializeFilters();
      const { rawData, flatDepartments } = await fetchDepartments();

      let finalFilters = { ...initialFilters };

      if (!initialFilters.department_id && flatDepartments.length > 0) {
        const firstDepartmentId = flatDepartments[0].id.toString();
        const groups = loadGroupsForDepartment(firstDepartmentId, rawData);

        finalFilters = {
          ...initialFilters,
          department_id: firstDepartmentId,
          group_id: groups.length === 1 ? groups[0].id.toString() : "",
        };
      } else if (initialFilters.department_id) {
        const groups = loadGroupsForDepartment(
          initialFilters.department_id,
          rawData
        );

        if (groups.length === 1 && !initialFilters.group_id) {
          finalFilters = {
            ...initialFilters,
            group_id: groups[0].id.toString(),
          };
        }
      }

      if (JSON.stringify(finalFilters) !== JSON.stringify(initialFilters)) {
        setFilters(finalFilters);
        localStorage.setItem("salary2-filters", JSON.stringify(finalFilters));
      }

      await fetchSalaryData(finalFilters);
      setIsInitialized(true);
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      fetchSalaryData(filters);
    }
  }, [filters, isInitialized]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    localStorage.setItem("salary2-filters", JSON.stringify(newFilters));
  };

  const handleStartDateChange = (e) => {
    const newFilters = {
      ...filters,
      start_date: e.target.value,
    };

    updateFilters(newFilters);
  };

  const handleEndDateChange = (e) => {
    const newFilters = {
      ...filters,
      end_date: e.target.value,
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
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          type="date"
          value={filters.start_date}
          onChange={handleStartDateChange}
          className="bg-white w-fit"
        />
        <Input
          type="date"
          value={filters.end_date}
          onChange={handleEndDateChange}
          className="bg-white w-fit"
        />

        <Select
          onValueChange={handleDepartmentChange}
          value={filters.department_id}
        >
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Bo'lim tanlang" />
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
            <SelectValue placeholder="Guruh tanlang" />
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
    </div>
  );
};

export default Departments;
