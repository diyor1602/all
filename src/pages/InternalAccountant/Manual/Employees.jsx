import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    tasks: [
      { id: 2, quantity: 20 },
      { id: 2, quantity: 20 },
      { id: 2, quantity: 20 },
      { id: 2, quantity: 20 },
    ],
  });

  return (
    <div>
      <Input placeholder="Ishchilar qidirish" />
    </div>
  );
};

export default Employees;
