import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion } from "framer-motion";
import { CalendarDays, Briefcase, Wallet, Banknote } from "lucide-react";
import Advance from "./Advance";
import Attendance from "./Attendance";
import Salary from "./Salary";
import Work from "./Work";

// ---------- Helpers ----------
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatNumber = (number) => {
  return Number.parseFloat(number || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
};

// ---------- Card ----------
const Card = ({ title, value, color, Icon, isActive, onClick, ringColor }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`
      ${color} rounded-2xl p-5 text-white flex flex-col items-center justify-center min-h-[140px] transition-all cursor-pointer
      ${isActive ? `md:ring-2 md:ring-offset-2 ${ringColor} ring-0` : ""}
    `}
  >
    <Icon size={36} className="mb-2 opacity-90" />
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-2xl font-bold mt-1">{value} so'm</div>
  </motion.div>
);

const NewProfile = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      try {
        const response = await api.get("/profile", {
          params: {
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
          },
        });
        setUserData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Profil ma'lumotlarini olib bo'lmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const attendedDays =
    userData.attendances?.filter((a) => a.status === "present").length || 0;

  const baseCards = [
    {
      key: "davomat",
      title: "Davomat",
      value: formatNumber(
        userData.attendance_salaries?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount || 0),
          0
        )
      ),
      color: "bg-gradient-to-r from-indigo-500 to-blue-600",
      Icon: CalendarDays,
      ringColor: "ring-blue-400",
    },
    {
      key: "ish",
      title: "Ish",
      value: formatNumber(
        userData.employee_tarification_logs?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount || 0),
          0
        )
      ),
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      Icon: Briefcase,
      ringColor: "ring-green-400",
    },
    {
      key: "avans",
      title: "Olingan Avans",
      value: formatNumber(
        userData.salaryPayments?.find((p) => p.type === "advance")?.amount || 0
      ),
      color: "bg-gradient-to-r from-orange-500 to-red-500",
      Icon: Wallet,
      ringColor: "ring-orange-400",
    },
    {
      key: "maosh",
      title: "Olingan Maosh",
      value: formatNumber(
        userData.salaryPayments?.find((p) => p.type === "salary")?.amount || 0
      ),
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
      Icon: Banknote,
      ringColor: "ring-purple-400",
    },
  ];

  const cards =
    userData.payment_type === "piece_work"
      ? [
          baseCards.find((c) => c.key === "ish"),
          ...baseCards.filter((c) => c.key !== "ish"),
        ]
      : baseCards;

  // Map each card key to a component
  const cardComponents = {
    davomat: <Attendance userData={userData} />,
    ish: <Work userData={userData} />,
    avans: <Advance userData={userData} />,
    maosh: <Salary userData={userData} />,
  };

  return (
    <div className="w-full">
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="w-fit bg-white"
      />

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-4 gap-4 mt-5">
        {cards.map((c, i) => (
          <Card
            key={i}
            title={c.title}
            value={c.value}
            color={c.color}
            Icon={c.Icon}
            isActive={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            ringColor={c.ringColor}
          />
        ))}
      </div>

      {/* Mobile slider */}
      <div className="md:hidden mt-5">
        <Swiper
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        >
          {cards.map((c, i) => (
            <SwiperSlide key={i}>
              <Card
                title={c.title}
                value={c.value}
                color={c.color}
                Icon={c.Icon}
                isActive={i === activeIndex}
                ringColor={c.ringColor}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Render component of the active card */}
      <div className="mt-5">{cardComponents[cards[activeIndex]?.key]}</div>
    </div>
  );
};

export default NewProfile;
