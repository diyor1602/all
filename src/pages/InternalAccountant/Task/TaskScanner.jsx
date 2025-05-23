import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TaskScanner = () => {
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [code, setCode] = useState("");
  const [data, setData] = useState(null);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchEmployees = async (term) => {
    if (!term || term.length <= 2) return;
    try {
      const response = await api.get("/internalAccountant/employees", {
        params: {
          search: term,
        },
      });
      setEmployees(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlar ro'yxatini olishda xatolik",
      });
    }
  };

  // Call API when debounce term changes
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      fetchEmployees(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handleBlur = () => {
    // Trigger immediate fetch on blur
    if (searchTerm.length > 2) {
      fetchEmployees(searchTerm);
    }
  };

  const handleScan = async () => {
    try {
      const response = await api.get(
        `/internalAccountant/boxTarifications/${code}`,
        {
          params: {
            employee_id: selectedEmployee,
          },
        }
      );
      setData(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kodni o'qishda xatolik",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code) {
        handleScan();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="flex flex-col gap-3 bg-white shadow-sm md:p-6">
      <Input
        placeholder="Xodimni qidirish"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onBlur={handleBlur}
      />
      <Select
        value={selectedEmployee}
        disabled={!employees?.length}
        onValueChange={(value) => setSelectedEmployee(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Xodimni tanlang" />
        </SelectTrigger>
        <SelectContent>
          {employees
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((employee) => (
              <SelectItem key={employee?.id} value={employee?.id}>
                {employee?.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Input
        disabled={!selectedEmployee}
        placeholder="Kodni kiriting"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
    </div>
  );
};

export default TaskScanner;
