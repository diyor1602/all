const Salary = ({ userData }) => {
  const salaryPayment = userData.salaryPayments?.find(
    (p) => p.type === "advance"
  );

  return (
    <div className="mt-4 p-4 rounded-xl bg-orange-50 flex flex-col gap-3">
      {salaryPayment?.amount > 0 ? (
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <p className="font-medium text-orange-700">
            {parseInt(salaryPayment.amount).toLocaleString("ru-RU", {
              maximumFractionDigits: 0,
            })}{" "}
            so'm
          </p>
          <p className="font-medium text-orange-700">
            {salaryPayment?.date?.split("T")[0]?.split("-").reverse().join(".")}
          </p>
        </div>
      ) : (
        <p className="font-medium text-orange-700">Avans olinmagan</p>
      )}
      {salaryPayment?.comment && (
        <p className="text-orange-700 text-sm">
          Izoh: {salaryPayment?.comment}
        </p>
      )}
    </div>
  );
};

export default Salary;
