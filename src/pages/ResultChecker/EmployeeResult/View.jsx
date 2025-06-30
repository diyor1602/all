"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";

const View = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [times, setTimes] = useState([]);

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        setLoading(true);
        const response = await api.get("/resultChecker/times");
        setTimes(response.data?.filter((time) => time.time !== "07:30:00"));
      } catch (error) {
        toast({
          title: "Xatolik",
          description:
            error.response?.data?.message ||
            "Qabul qilish vaqti olishda xatolik",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await api.get("/resultChecker/employeeResults", {
        params: {
          group_id: id,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Xodim ma'lumotlari olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  // Helper function to find existing employee result for a specific time
  const findEmployeeResult = (employee, timeId) => {
    return employee.employee_results?.find(
      (result) => result.time?.id === timeId
    );
  };

  // Helper function to validate numeric input
  const validateNumericInput = (value, fieldName = "Qiymat") => {
    if (value === "" || value === null || value === undefined) {
      return { isValid: true, numValue: 0 };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      toast({
        title: "Xatolik",
        description: `${fieldName} son bo'lishi shart`,
        variant: "destructive",
        duration: 1500,
      });
      return { isValid: false, numValue: 0 };
    }

    if (numValue < 0) {
      toast({
        title: "Xatolik",
        description: `${fieldName} manfiy bo'lishi mumkin emas`,
        variant: "destructive",
        duration: 1500,
      });
      return { isValid: false, numValue: 0 };
    }

    return { isValid: true, numValue };
  };

  // Function to handle minute updates - updates ALL existing results for the employee
  const handleMinuteSubmit = async (employeeId, minute) => {
    const validation = validateNumericInput(minute, "Daqiqa");
    if (!validation.isValid) return;

    const minuteNum = validation.numValue;
    const employee = employees.find((emp) => emp.id === employeeId);

    if (!employee) {
      toast({
        title: "Xatolik",
        description: "Xodim topilmadi",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const existingResults = employee.employee_results || [];

      if (existingResults.length > 0) {
        // PATCH - Update ALL existing results with new minute value
        const updatePromises = existingResults.map((result) =>
          api.patch(`/resultChecker/employeeResults/${result.id}`, {
            minute: minuteNum,
            time_id: result.time?.id,
            quantity: result.quantity || 0,
          })
        );

        await Promise.all(updatePromises);
      } else {
        // POST - Create new result for the first time slot
        const firstTimeId = times[0]?.id;
        if (!firstTimeId) {
          toast({
            title: "Xatolik",
            description: "Vaqt ma'lumotlari topilmadi",
            variant: "destructive",
          });
          return;
        }

        await api.post(`/resultChecker/employeeResults`, {
          employee_id: employeeId,
          minute: minuteNum,
          time_id: firstTimeId,
          quantity: 0,
        });
      }

      await fetchEmployee();

      toast({
        title: "Muvaffaqiyat",
        description: "Daqiqa muvaffaqiyatli yangilandi",
        variant: "default",
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Daqiqa o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle quantity updates for any time slot
  const handleQuantitySubmit = async (employeeId, timeId, quantity) => {
    const validation = validateNumericInput(quantity, "Miqdor");
    if (!validation.isValid) return;

    const quantityNum = validation.numValue;
    const employee = employees.find((emp) => emp.id === employeeId);

    if (!employee) {
      toast({
        title: "Xatolik",
        description: "Xodim topilmadi",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const existingResult = findEmployeeResult(employee, timeId);

      if (existingResult) {
        // PATCH - Update existing result
        await api.patch(`/resultChecker/employeeResults/${existingResult.id}`, {
          minute: existingResult.minute || 0,
          time_id: timeId,
          quantity: quantityNum,
        });
      } else {
        // POST - Create new result
        // For new quantity entries, we need a default minute value
        const defaultMinute =
          employee.employee_results?.length > 0
            ? employee.employee_results[employee.employee_results.length - 1]
                .minute || 0
            : 0;

        await api.post(`/resultChecker/employeeResults`, {
          employee_id: employeeId,
          minute: defaultMinute,
          time_id: timeId,
          quantity: quantityNum,
        });
      }

      await fetchEmployee();

      toast({
        title: "Muvaffaqiyat",
        description: "Miqdor muvaffaqiyatli yangilandi",
        variant: "default",
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Miqdor o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to safely evaluate mathematical expressions
  const safeEval = (expression) => {
    try {
      // Remove any non-mathematical characters for security
      const cleanExpression = expression.replace(/[^-()\d/*+.\s]/g, "");
      if (!cleanExpression) return 0;

      // Use Function constructor instead of eval for better security
      const result = new Function(
        `"use strict"; return (${cleanExpression})`
      )();
      return isNaN(result) ? 0 : Number(result);
    } catch {
      return 0;
    }
  };

  const calculateProgress = (employee) => {
    const maxTime = 500;
    const empMinute = employee.employee_results?.at(-1)?.minute;

    if (!empMinute || empMinute === 0) return 0;

    const canDo = maxTime / empMinute;
    const totalQuantity = employee.employee_results?.reduce(
      (acc, result) => acc + (result.quantity || 0),
      0
    );

    if (canDo === 0) return 0;
    return (totalQuantity / canDo) * 100;
  };

  const calculateMaximum = (employee) => {
    const empMinute = employee.employee_results?.at(-1)?.minute;
    if (!empMinute || empMinute === 0) return 0;
    return (500 / Number.parseFloat(empMinute)).toFixed(2);
  };

  // Helper function to calculate total quantity for an employee
  const calculateTotalQuantity = (employee) => {
    return (
      employee.employee_results?.reduce(
        (acc, result) => acc + (result.quantity || 0),
        0
      ) || 0
    );
  };

  // Helper function to check if employee has minute entered
  const hasMinuteEntered = (employee) => {
    const lastResult = employee.employee_results?.at(-1);
    return lastResult && lastResult.minute && Number(lastResult.minute) > 0;
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-h-[90vh] overflow-auto">
      <style>{`
        .sticky-table {
          position: relative;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: white;
        }

        .sticky-left-1 {
          position: sticky;
          left: 0;
          z-index: 10;
          background: white;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        }

        .sticky-left-2 {
          position: sticky;
          left: 200px;
          z-index: 10;
          background: white;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        }

        .sticky-header.sticky-left-1 {
          z-index: 30;
          background: white;
        }

        .sticky-header.sticky-left-2 {
          z-index: 30;
          background: white;
        }

        tr:hover .sticky-left-1,
        tr:hover .sticky-left-2 {
          background: white;
        }
      `}</style>

      <table className="border-collapse border border-gray-200 w-full whitespace-nowrap sticky-table text-xs">
        <thead>
          <tr>
            <th className="border border-gray-200 p-2 sticky-header sticky-left-1 min-w-[200px]">
              Xodim
            </th>
            <th className="border border-gray-200 p-2 sticky-header sticky-left-2 min-w-[100px]">
              Daqiqa
            </th>
            <th className="border border-gray-200 p-2 sticky-header min-w-[100px]">
              Progress
            </th>
            <th className="border border-gray-200 p-2 sticky-header min-w-[100px]">
              Maximum
            </th>
            <th className="border border-gray-200 p-2 sticky-header min-w-[120px]">
              Jami miqdor
            </th>
            {times.map((time) => (
              <th
                key={time.id}
                className="border border-gray-200 p-2 sticky-header min-w-[100px]"
              >
                {time.time?.slice(0, 5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees
            ?.sort((a, b) => a.name.localeCompare(b.name))
            ?.map((employee, index) => (
              <tr key={index}>
                <td className="border border-gray-200 p-2 font-medium sticky-left-1 min-w-[200px]">
                  <i>{employee.name}</i>
                </td>
                <td className="border border-gray-200 p-2 sticky-left-2 min-w-[100px]">
                  <div className="w-full flex justify-center">
                    <input
                      type="text"
                      className="w-24 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={
                        employee.employee_results?.at(-1)?.minute ?? ""
                      }
                      disabled={loading}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (!value) {
                          handleMinuteSubmit(employee.id, "0");
                          e.target.value = "0";
                          return;
                        }

                        const result = safeEval(value);
                        e.target.value = result.toString();
                        handleMinuteSubmit(employee.id, result.toString());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                </td>
                <td className="border border-gray-200 p-2 text-center min-w-[100px]">
                  <span
                    className={`font-medium ${
                      calculateProgress(employee) >= 100
                        ? "text-green-600"
                        : calculateProgress(employee) >= 80
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {calculateProgress(employee)?.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    %
                  </span>
                </td>
                <td className="border border-gray-200 p-2 text-center font-medium min-w-[100px]">
                  {calculateMaximum(employee)}
                </td>
                <td className="border border-gray-200 p-2 text-center font-bold text-blue-600 min-w-[120px]">
                  {calculateTotalQuantity(employee).toLocaleString()}
                </td>
                {times.map((time) => {
                  const existingResult = findEmployeeResult(employee, time.id);
                  const isDisabled = !hasMinuteEntered(employee) || loading;

                  return (
                    <td
                      key={time.id}
                      className="border border-gray-200 p-2 text-center min-w-[100px]"
                    >
                      <input
                        type="text"
                        className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        defaultValue={existingResult?.quantity ?? ""}
                        disabled={isDisabled}
                        placeholder=""
                        onBlur={(e) => {
                          if (isDisabled) return;

                          const value = e.target.value.trim();
                          if (!value) {
                            handleQuantitySubmit(employee.id, time.id, "0");
                            e.target.value = "0";
                            return;
                          }

                          const result = safeEval(value);
                          e.target.value = result.toString();
                          handleQuantitySubmit(
                            employee.id,
                            time.id,
                            result.toString()
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.target.blur();
                          }
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>

      {employees.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">Xodimlar topilmadi</div>
      )}
    </div>
  );
};

export default View;
