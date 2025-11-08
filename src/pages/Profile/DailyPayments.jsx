import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import api from "@/utils/api";

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

const CircularProgress = ({
  value = 0,
  size = 140,
  stroke = 10,
  color = "#007AFF",
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

const DailyPayments = ({ selectedMonth }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dailyPayments", {
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

  const earned = data?.total_earned || 0;
  const total = data?.total_remaining + data?.total_earned || 0;
  const progress = total ? Math.min((earned / total) * 100, 100) : 0;

  return (
    <div className="min-h-screen flex flex-col gap-8 text-gray-900">
      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
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
                <span className="text-sm text-gray-500">bajarildi</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center md:text-left">
              <div className="text-xl font-medium text-gray-700">
                Hozirgacha topilgan:
              </div>
              <div className="text-3xl font-semibold text-blue-600">
                {formatNumber(earned)} so'm
              </div>
              <div className="text-lg text-gray-600 mt-2">
                Oyning oxirida taxminan:{" "}
                <span className="font-semibold text-gray-800">
                  {formatNumber(total)} so'm
                </span>
              </div>
            </div>
          </div>

          {/* New global stats block */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-md border border-gray-200 text-center md:text-left">
            {(() => {
              const totalQuantity =
                data?.orders?.reduce(
                  (acc, item) => acc + (item?.planned_quantity || 0),
                  0
                ) || 0;
              const totalAmount =
                data?.total_remaining + data?.total_earned || 0;

              return (
                <div className="flex flex-col md:flex-row justify-around items-center gap-4 text-gray-700">
                  <div>
                    <div className="text-sm text-gray-500">Jami tikasiz:</div>
                    <div className="text-xl font-semibold">
                      {formatNumber(totalQuantity)} dona
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Jami topasiz:</div>
                    <div className="text-xl font-semibold">
                      {formatNumber(totalAmount)} so'm
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Orders list */}
          <div className="flex flex-col gap-4">
            {data?.orders
              ?.sort(
                (a, b) =>
                  b.earned_amount / b.possible_full_earn_amount -
                  a.earned_amount / a.possible_full_earn_amount
              )
              ?.map((item, index) => {
                const earnedItem = item.earned_amount || 0;
                const totalItem = item.possible_full_earn_amount || 0;
                const percent = totalItem
                  ? Math.round((earnedItem / totalItem) * 100)
                  : 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="text-lg font-semibold">
                        {item.order?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.order?.submodels?.join(", ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item?.produced_quantity} / {item.planned_quantity} dona
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatNumber(earnedItem)} / {formatNumber(totalItem)}{" "}
                        so'm
                      </div>
                    </div>

                    {/* Circle with percentage */}
                    <div className="relative flex items-center justify-center">
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

export default DailyPayments;
