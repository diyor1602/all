const Salary = ({ userData, type }) => {
  const salaryPayment = userData.salaryPayments?.find((p) => p.type === type);
  const colors = {
    salary: "bg-purple-50",
    advance: "bg-orange-50",
  };

  return (
    <div className={`mt-4 p-4 rounded-xl ${colors[type]} flex flex-col gap-3`}>
      {salaryPayment?.amount > 0 ? (
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <p
            className={`font-medium text-${
              type === "salary" ? "purple" : "orange"
            }-700`}
          >
            {parseInt(salaryPayment.amount).toLocaleString("ru-RU", {
              maximumFractionDigits: 0,
            })}{" "}
            so'm
          </p>
          <p
            className={`font-medium text-${
              type === "salary" ? "purple" : "orange"
            }-700`}
          >
            {salaryPayment?.date?.split("T")[0]?.split("-").reverse().join(".")}
          </p>
        </div>
      ) : (
        <p
          className={`font-medium text-${
            type === "salary" ? "purple" : "orange"
          }-700`}
        >
          {type === "salary" ? "Maosh olinmagan" : "Avans olinmagan"}
        </p>
      )}
      {salaryPayment?.comment && (
        <p
          className={`font-medium text-${
            type === "salary" ? "purple" : "orange"
          }-700`}
        >
          {salaryPayment?.comment}
        </p>
      )}
    </div>
  );
};

export default Salary;
