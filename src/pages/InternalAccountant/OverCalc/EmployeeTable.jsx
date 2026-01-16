import { forwardRef, useImperativeHandle } from "react";
import ExcelJS from "exceljs";
import formatNumber from "@/utils/formatNumber";

const EmployeeTable = ({ data }, ref) => {
  const employees = data?.employees;

  const totals = employees?.reduce(
    (acc, employee) => {
      acc.attendance_amount += Number(employee.work_days) || 0;
      acc.total_amount += Number(employee.total_amount) || 0;
      acc.tarification_amount += Number(employee.tarification_amount) || 0;
      acc.monthly_salary_override +=
        Number(employee.monthly_salary_override) || 0;
      acc.piecework_override += Number(employee.piecework_override) || 0;
      return acc;
    },
    {
      attendance_amount: 0,
      total_amount: 0,
      tarification_amount: 0,
      monthly_salary_override: 0,
      piecework_override: 0,
    }
  );

  const exportToExcel = async () => {
    if (!employees?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Xodimlar");

    worksheet.columns = [
      { header: "Ism", key: "employee_name", width: 30 },
      { header: "Davomat", key: "attendance_amount", width: 18 },
      { header: "Jami", key: "total_amount", width: 18 },
      { header: "Imzo", key: "signature", width: 18 },
    ];

    employees
      ?.slice()
      .sort((a, b) => a.employee_name.localeCompare(b.employee_name))
      .forEach((employee) => {
        worksheet.addRow({
          employee_name: employee.employee_name,
          attendance_amount: Number(employee.work_days) || 0,
          total_amount: Number(employee.total_amount) || 0,
        });
      });

    worksheet.addRow({});
    worksheet.addRow({
      employee_name: "Jami",
      attendance_amount: totals?.attendance_amount || 0,
      total_amount: totals?.total_amount || 0,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data?.group_name}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({
    exportToExcel,
  }));

  return (
    <div className="max-w-[90vw] w-full overflow-auto border border-gray-300 rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
              №
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Ism
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Kelgan kuni
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Davomat
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Tarifikatsiya
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Oylik
              <br /> ustidan yozilgan
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Ishbay
              <br /> ustidan yozilgan
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Jami
            </th>
          </tr>
        </thead>
        <tbody>
          {employees
            ?.sort((a, b) => a.employee_name.localeCompare(b.employee_name))
            ?.map((employee, index) => (
              <tr
                key={index}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {employee.employee_name}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {employee.work_days}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.attendance_amount, 0)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.tarification_amount, 0)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.monthly_salary_override, 0)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.piecework_override, 0)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.total_amount, 0)}
                </td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td
              className="border border-gray-300 px-3 py-2 text-right"
              colSpan={3}
            >
              Jami:
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.attendance_amount, 0)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.tarification_amount, 0)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.monthly_salary_override, 0)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.piecework_override, 0)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.total_amount, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default forwardRef(EmployeeTable);
