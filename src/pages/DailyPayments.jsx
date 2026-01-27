import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/utils/api";
// import ModelImages from "@/components/ModelImages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatNumber = (num, fractionDigits = 0) => {
  return parseFloat(num).toLocaleString("ru-RU", {
    maximumFractionDigits: fractionDigits,
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

const DailyPayments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("dailyPaymentsSelectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dailyPayments", {
          params: { month: selectedMonth },
        });
        setData(response.data);
        localStorage.setItem("percentage", response.data?.employee?.percentage);
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

  const navigateMonth = (direction) => {
    const currentDate = new Date(selectedMonth + "-01");
    if (direction === "prev") {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    const newMonth = currentDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
    localStorage.setItem("dailyPaymentsSelectedMonth", newMonth);
  };

  const earned = data?.total_earned || 0;
  const total =
    data?.total_bonus + data?.total_earned + data?.total_remaining || 0;
  const progress = total ? Math.min((earned / total) * 100, 100) : 0;

  const role = localStorage.getItem("role");
  const quantityKey =
    role === "cuttingMaster"
      ? "total_cut_quantity"
      : "total_sewing_output_quantity";
  const textKey = role === "cuttingMaster" ? "kesasiz" : "tikasiz";

  return (
    <div className="flex flex-col gap-8 text-gray-900">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth("prev")}
          className="bg-white hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            localStorage.setItem("dailyPaymentsSelectedMonth", e.target.value);
          }}
          className="w-fit bg-white"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth("next")}
          className="bg-white hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        </div>
      ) : data?.employee?.percentage > 0 ? (
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
                <span className="text-sm text-gray-500">
                  {formatNumber(
                    data?.orders?.reduce(
                      (acc, order) => acc + order?.[quantityKey] || 0,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center md:text-left">
              <div className="text-xl font-medium text-gray-700">
                Hozirgacha topilgan:
              </div>
              <div className="text-3xl font-semibold text-blue-600">
                {formatNumber(earned + data?.total_bonus)} so'm
              </div>
              {data?.total_possible - total > 0.5 && (
                <>
                  <div className="text-lg text-gray-600">
                    Qolgan summa:{" "}
                    <span className="font-semibold text-blue-600">
                      {formatNumber(total)} so'm
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* New global stats block */}
          {/* <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-md border border-gray-200 text-center md:text-left">
            {(() => {
              const totalQuantity =
                data?.orders?.reduce(
                  (acc, item) => acc + (item?.planned_quantity || 0),
                  0,
                ) || 0;
              const totalAmount =
                data?.total_remaining + data?.total_earned || 0;

              return (
                <div className="flex flex-col md:flex-row justify-around items-center gap-4 text-gray-700">
                  <div>
                    <div className="text-sm text-gray-500">Jami {textKey}:</div>
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
          </div> */}

          {/* Orders list */}
          <div className="flex flex-col gap-4">
            {data?.orders
              ?.sort(
                (a, b) =>
                  b[quantityKey] / b.planned_quantity -
                  a[quantityKey] / a.planned_quantity,
              )
              ?.map((item, index) => {
                const totalItem = item.planned_quantity || 0;
                const percent = totalItem
                  ? Math.round(
                      (item?.total_sewing_output_quantity /
                        item?.planned_quantity) *
                        100,
                    )
                  : 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-5 flex gap-4 md:flex-row flex-col justify-between items-center md:items-center shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="w-fit">
                      <div className="text-lg font-semibold">
                        {index + 1}. {item.order?.name}
                      </div>
                      <div>{item?.groups?.[0]?.name}</div>
                      <div>{item?.groups?.[0]?.responsible_user_name}</div>
                      <div className="text-sm text-gray-500">
                        {item?.submodel?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item?.[quantityKey]} / {item.planned_quantity} dona
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatNumber(item?.earned_amount)} /{" "}
                        {formatNumber(item?.possible_full_earn_amount)} so'm
                      </div>
                    </div>

                    {/* Model images */}
                    {/* <div className="flex flex-wrap gap-2 justify-center md:justify-start order-2 md:order-1">
                      <ModelImages modelCode={item?.model?.name} />
                    </div> */}

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
      ) : (
        <div className="w-full h-[70vh] flex items-center justify-center text-4xl">
          Siz eski tizimdasiz 😀
        </div>
      )}
    </div>
  );
};

export default DailyPayments;
