const Salary = ({ userData }) => {
  const salaryPayments = userData?.salaryPayments || [];

  // Calculate total salary
  const totalAmount = salaryPayments.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  );

  // Format amount
  const formatAmount = (amount) =>
    parseInt(amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  // Format date YYYY-MM-DD → DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0].split("-").reverse().join(".");
  };

  if (totalAmount === 0) {
    return <p className="font-medium text-orange-700">Avans olinmagan</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {salaryPayments.map((payment) => (
        <div
          key={payment.id}
          className="p-3 rounded-xl border border-orange-300 bg-orange-50 flex flex-col gap-1 shadow-sm"
        >
          {/* Amount */}
          <p className="font-semibold text-orange-800 text-lg">
            {formatAmount(payment.amount)} so'm
          </p>

          {/* Date */}
          <p className="text-orange-700 text-sm">
            Sana: {formatDate(payment.date)}
          </p>

          {/* Comment */}
          {payment.comment && (
            <p className="text-orange-600 text-sm">Izoh: {payment.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Salary;
