const Work = ({ userData }) => {
  const logs = userData.employee_tarification_logs;
  return (
    <div className="mt-4 p-4 rounded-xl bg-green-50">
      <p className="font-medium text-green-700">
        Ish yozuvlari: {logs?.length || 0} ta
      </p>
    </div>
  );
};

export default Work;
