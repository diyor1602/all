import formatNumber from "@/utils/formatNumber";

const EmployeeTable = ({ data }) => {
  const employees = data?.employees;

  const totals = employees?.reduce(
    (acc, employee) => {
      acc.attendance_amount += Number(employee.attendance_amount) || 0;
      acc.tarification_amount += Number(employee.tarification_amount) || 0;
      acc.monthly_salary_override +=
        Number(employee.monthly_salary_override) || 0;
      acc.piecework_override += Number(employee.piecework_override) || 0;
      acc.total_amount += Number(employee.total_amount) || 0;
      return acc;
    },
    {
      attendance_amount: 0,
      tarification_amount: 0,
      monthly_salary_override: 0,
      piecework_override: 0,
      total_amount: 0,
    }
  );

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
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2 text-right">
              Jami:
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.attendance_amount)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.tarification_amount)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.monthly_salary_override)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.piecework_override)}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {formatNumber(totals?.total_amount)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default EmployeeTable;
