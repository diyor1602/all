import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import ModelImages from "@/components/ModelImages";

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const translateDate = (date) => {
  if (!date) return "";

  const months = [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentyabr",
    "oktyabr",
    "noyabr",
    "dekabr",
  ];

  const [year, month, day] = date?.split("-") || [];
  const monthName = months[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)}-${monthName}, ${year}`;
};

const CircularProgress = ({
  value = 0,
  size = 140,
  stroke = 10,
  color = "#8B5CFF", //purple
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="drop-shadow-md">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
};

const Salary = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("salarySelectedMonth") ||
      new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/groupMaster/myOrders", {
          params: { month: selectedMonth },
        });
        setData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description:
            error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  const earned =
    data?.orders?.reduce((acc, item) => acc + item.amount_from_sewing, 0) || 0;
  const total =
    data?.orders?.reduce(
      (acc, item) => acc + item.amount_from_order_quantity,
      0
    ) || 0;
  const progress = total ? Math.min((earned / total) * 100, 100) : 0;

  return (
    <div className="min-h-screen flex flex-col gap-8 text-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            localStorage.setItem("salarySelectedMonth", e.target.value);
          }}
          className="w-fit bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-2"
          disabled={loading}
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Progress summary section */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-lg border border-gray-200">
            <div className="relative flex items-center justify-center">
              <CircularProgress value={progress} size={160} />
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-gray-800">
                  {Math.round(progress)}%
                </span>
                <span className="text-sm text-gray-500 font-semibold mt-2">
                  {data?.orders?.reduce(
                    (acc, item) => acc + item.sewn_quantity,
                    0
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center md:text-left">
              <div className="text-xl font-medium text-gray-700">
                Hozirgacha topilgan:
              </div>
              <div className="text-3xl font-semibold text-purple-600">
                {formatNumber(earned)} so'm
              </div>
              <div className="text-lg text-gray-600 mt-2">
                Oyning oxirida taxminan:{" "}
                <span className="font-semibold text-gray-800">
                  {formatNumber(total)} so'm
                </span>
              </div>
              <div className="text-lg text-gray-600 mt-2">
                Jami tikasiz:{" "}
                <span className="font-semibold text-gray-800">
                  {formatNumber(
                    data?.orders?.reduce(
                      (acc, item) => acc + (item.order?.quantity || 0),
                      0
                    ) || 0
                  )}{" "}
                  dona
                </span>
              </div>
            </div>
          </div>

          {/* Deadline Details Section */}
          {data?.seasonOrders?.deadline && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-purple-50 to-white border border-purple-200/60 rounded-3xl shadow-md p-6 md:p-8 flex flex-col gap-4 text-gray-700"
            >
              <h2 className="text-xl font-semibold text-purple-700 mb-2 text-center md:text-left">
                📅 Deadline Tafsilotlari
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Target Deadline */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">Deadline</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {translateDate(data.seasonOrders.deadline.target_date)}
                  </span>
                </div>

                {/* Estimated Completion */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">
                    Kunlik chiqarishiz kerak
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    {
                      data.seasonOrders.deadline
                        .required_daily_quantity_for_deadline
                    }
                  </span>
                </div>

                {/* Days Remaining */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">
                    Qolgan ish kunlari
                  </span>
                  <span className="text-lg font-semibold text-gray-800">
                    {data.seasonOrders.deadline.working_days_until_deadline} kun
                  </span>
                </div>

                {/* Required Workers */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">
                    Zarur ishchilar soni
                  </span>
                  <span className="text-lg font-semibold text-gray-800">
                    {data.seasonOrders.deadline.required_workers_for_deadline
                      ? data.seasonOrders.deadline.required_workers_for_deadline
                      : "—"}
                  </span>
                </div>

                {/* Current Average Workers */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">
                    O‘rtacha ishchilar
                  </span>
                  <span className="text-lg font-semibold text-gray-800">
                    {data.avgWorkersLast30Days?.toFixed(0)} ta
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-sm text-gray-500">Status</span>
                  <span
                    className={`text-lg font-semibold ${
                      data.seasonOrders.deadline.deadline_exceeded
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {data.seasonOrders.deadline.deadline_exceeded
                      ? "Xarakat qilish kerak"
                      : "Reja bo'yicha ketyabsiz"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders list */}
          <div className="flex flex-col gap-4">
            {data?.orders
              ?.sort((a, b) => b.sewn_quantity - a.sewn_quantity)
              ?.map((item, index) => {
                const earnedItem = item.amount_from_sewing || 0;
                const totalItem = item.amount_from_order_quantity || 0;
                const percent = totalItem
                  ? Math.round((earnedItem / totalItem) * 100)
                  : 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-5 flex gap-4 md:flex-row flex-col justify-between items-center md:items-center shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="text-lg font-semibold">
                        {item.order?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.order?.submodels?.join(", ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item?.sewn_quantity} / {item.order?.quantity} dona
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatNumber(earnedItem)} / {formatNumber(totalItem)}{" "}
                        so'm
                      </div>
                    </div>

                    {/* Model images */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start order-2 md:order-1">
                      <ModelImages modelCode={item.order?.model?.name} />
                    </div>

                    {/* Circle with percentage */}
                    <div className="relative flex items-center justify-center order-1 md:order-2">
                      <CircularProgress value={percent} size={70} />
                      <div className="absolute text-sm font-semibold text-gray-700">
                        {percent}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Salary;
