import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const today = new Date().toISOString().split("T")[0];

const SalaryDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [startDate, setStartDate] = useState(
    localStorage.getItem("salaryStartDate") || today
  );
  const [endDate, setEndDate] = useState(
    localStorage.getItem("salaryEndDate") || today
  );

  const fetchSalary = useCallback(async () => {
    try {
      const { data } = await api.get("/casher/groups", {
        params: {
          department_id: id,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setData(data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    }
  }, [id, toast, startDate, endDate]);

  const toggleEmployee = useCallback((empId) => {
    setExpandedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  }, []);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  useEffect(() => {
    localStorage.setItem("salaryStartDate", startDate);
    localStorage.setItem("salaryEndDate", endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (data.length > 0) {
      const initialGroups = {};
      const initialEmployees = {};

      data.forEach((group) => {
        const shouldExpandGroup = data.length === 1;
        initialGroups[group.id] = expandedGroups[group.id] ?? shouldExpandGroup;

        group.employees?.forEach((emp) => {
          const shouldExpandEmployee =
            data.length === 1 && group.employees.length === 1;
          initialEmployees[emp.id] =
            expandedEmployees[emp.id] ?? shouldExpandEmployee;
        });
      });

      setExpandedGroups(initialGroups);
      setExpandedEmployees(initialEmployees);
    }
  }, [data]);

  return (
    <div className="space-y-4 bg-white shadow-md p-4 relative">
      <div className="w-full flex items-center gap-2 sticky top-0 z-10 bg-white p-2 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium">Boshlanish sanasi</Label>
          <Input
            type="date"
            value={startDate}
            className="w-fit"
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium">Tugash sanasi</Label>
          <Input
            type="date"
            value={endDate}
            className="w-fit"
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {data
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => (
          <div key={group.id ?? "no-group"} className="border rounded p-3">
            <div
              className="font-semibold text-lg mb-2 cursor-pointer flex justify-between items-center"
              onClick={() => toggleGroup(group.id)}
            >
              <span>
                {group.name} –{" "}
                <span className="text-green-700">
                  {parseFloat(group.total_balance).toLocaleString("ru-RU")} so'm
                </span>
              </span>
              <span>{expandedGroups[group.id] ? "−" : "+"}</span>
            </div>

            {expandedGroups[group.id] && (
              <table className="w-full table-auto border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">№</th>
                    <th className="p-2 border">Xodim</th>
                    <th className="p-2 border">Balansi</th>
                    <th className="p-2 border">Lavozimi</th>
                  </tr>
                </thead>
                <tbody>
                  {group.employees
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((emp, idx) => {
                      const isExpanded = expandedEmployees[emp.id];
                      const salaries = emp?.earning?.salaries || [];
                      const operations = emp?.earning?.operations || [];

                      return (
                        <React.Fragment key={idx}>
                          <tr
                            className="cursor-pointer hover:bg-gray-50 text-center"
                            onClick={() => toggleEmployee(emp.id)}
                          >
                            <td className="p-2 border">{idx + 1}</td>
                            <td className="p-2 border text-blue-700 font-medium">
                              {emp.name}
                            </td>
                            <td className="p-2 border">
                              {parseFloat(emp.balance).toLocaleString("ru-RU")}{" "}
                              so'm
                            </td>
                            <td className="p-2 border">{emp.position}</td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={3} className="p-2 border bg-gray-50">
                                {salaries.length > 0 ? (
                                  <div className="mb-4">
                                    <div className="font-semibold mb-1">
                                      Davomat
                                    </div>
                                    <table className="w-full table-auto border">
                                      <thead className="bg-gray-200">
                                        <tr>
                                          <th className="p-2 border">Sana</th>
                                          <th className="p-2 border">
                                            Miqdori
                                          </th>
                                          <th className="p-2 border">
                                            Ishlagan soati
                                          </th>
                                          <th className="p-2 border">Vaqti</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {salaries.map((sal, idx) => (
                                          <tr key={idx}>
                                            <td className="p-2 border text-center">
                                              {sal.date
                                                ?.split("-")
                                                .reverse()
                                                .join(".")}
                                            </td>
                                            <td className="p-2 border text-center">
                                              {parseFloat(
                                                sal.amount
                                              ).toLocaleString("ru-RU")}{" "}
                                              so'm
                                            </td>
                                            <td className="p-2 border text-center">
                                              {sal.worked_hours}
                                            </td>
                                            <td className="p-2 border text-center">
                                              {sal.check_in
                                                ?.split(" ")[1]
                                                ?.slice(0, 5)}{" "}
                                              -{" "}
                                              {sal.check_out
                                                ?.split(" ")[1]
                                                ?.slice(0, 5)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="mb-4 text-red-500 font-semibold">
                                    Davomat mavjud emas
                                  </div>
                                )}

                                {operations.length > 0 ? (
                                  <div>
                                    <div className="font-semibold mb-1">
                                      Ishlar
                                    </div>
                                    <table className="w-full table-auto border">
                                      <thead className="bg-gray-200">
                                        <tr>
                                          <th className="p-2 border">Sana</th>
                                          <th className="p-2 border">Summa</th>
                                          <th className="p-2 border">Ish</th>
                                          <th className="p-2 border">
                                            Miqdori
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {operations.map((op, idx) => (
                                          <tr key={idx}>
                                            <td className="p-2 border text-center">
                                              {op.date
                                                ?.split("-")
                                                .reverse()
                                                .join(".")}
                                            </td>
                                            <td className="p-2 border text-center">
                                              {parseFloat(
                                                op.amount_earned
                                              ).toLocaleString("ru-RU")}{" "}
                                              so'm
                                            </td>
                                            <td className="p-2 border text-center">
                                              {op.tarification?.code}
                                            </td>
                                            <td className="p-2 border text-center">
                                              {op.quantity}
                                            </td>
                                          </tr>
                                        ))}
                                        <tr>
                                          <td className="p-2 border text-center">
                                            Jami:
                                          </td>
                                          <td className="p-2 border text-center">
                                            {operations
                                              .reduce(
                                                (acc, op) =>
                                                  acc +
                                                  parseFloat(op.amount_earned),
                                                0
                                              )
                                              .toLocaleString("ru-RU")}{" "}
                                            so'm
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-red-500 font-semibold">
                                    Ish mavjud emas
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </div>
  );
};

export default SalaryDetails;
