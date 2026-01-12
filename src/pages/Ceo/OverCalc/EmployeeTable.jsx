import formatNumber from "@/utils/formatNumber";

const EmployeeTable = ({ data }) => {
  const employees = data?.employees;
  return (
    <div className="max-w-[90vw] w-full overflow-auto border border-gray-300 rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Ism
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Davomat
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Tarifikatsiya
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Oylik ustidan yozilgan
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Ishbay ustidan yozilgan
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
                <td className="border border-gray-200 px-3 py-2">
                  {employee.employee_name}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.attendance_amount)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.tarification_amount)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.monthly_salary_override)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.piecework_override)}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {formatNumber(employee.total_amount)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
