import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Briefcase,
  Wallet,
  Banknote,
  Loader2,
} from "lucide-react";
import Attendance from "./Attendance";
import Salary from "./Salary";
import Work from "./Work";
import Kpi from "./Kpi";

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
const Card = ({
  title,
  value,
  color,
  Icon,
  isActive,
  onClick,
  ringColor,
  loading,
  bgImage,
}) => (
  <motion.div
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    style={
      bgImage
        ? {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }
        : {}
    }
    className={`
      ${color} relative overflow-hidden cursor-pointer
      rounded-3xl p-6 text-white w-full
      flex flex-col justify-between transition-all
      ${isActive ? `md:ring-2 md:ring-offset-2 ${ringColor}` : ""}
    `}
  >
    {/* 🔹 Overlay only if bgImage exists */}
    {bgImage && (
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    )}

    {/* Content above overlay */}
    <div className="relative z-10">
      {loading ? (
        <div className="animate-pulse flex flex-col justify-between h-full">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-white/30" />
            <div className="w-14 h-8 rounded bg-white/20" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 w-28 bg-white/30 rounded" />
            <div className="h-6 w-32 bg-white/30 rounded" />
            <div className="h-6 w-full bg-white/30 rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* Top row */}
          <div className="flex justify-between items-center">
            <Icon size={36} className="opacity-90" />
            <div className="text-sm font-bold tracking-wider uppercase">
              VIZZANO
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-6">
            <div className="text-sm uppercase">{title}</div>
            <div className="text-2xl font-bold mt-1">
              {value} <span className="text-xl font-normal">so'm</span>
            </div>
            <div className="text-sm mt-2 uppercase truncate">
              {localStorage.getItem("name")}
            </div>
          </div>
        </>
      )}
    </div>
  </motion.div>
);

const NewProfile = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // ✅ Load activeIndex from localStorage
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem("activeIndex");
    return saved ? Number(saved) : 0;
  });

  // ✅ Save activeIndex to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeIndex", activeIndex);
  }, [activeIndex]);

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
      bgImage:
        "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1192&auto=format&fit=crop",
    },
    {
      key: "ish",
      title: "Ish",
      value: formatNumber(
        userData.employee_tarification_logs?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount_earned || 0),
          0
        )
      ),
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      Icon: Briefcase,
      ringColor: "ring-green-400",
      bgImage:
        "https://images.unsplash.com/photo-1569411378499-565391f5ffe0?q=80&w=1070&auto=format&fit=crop",
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
      bgImage:
        "https://images.unsplash.com/photo-1523199455310-87b16c0eed11?q=80&w=1170&auto=format&fit=crop",
    },
    {
      key: "maosh",
      title: "Olingan Maosh",
      value: formatNumber(
        userData.salaryPayments?.find((p) => p.type === "salary")?.amount || 0
      ),
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
      Icon: Banknote,
      ringColor: "ring-blue-400",
      bgImage:
        "https://images.unsplash.com/photo-1618108345761-031721b1ca3c?q=80&w=1170&auto=format&fit=crop",
    },
    {
      key: "kpi",
      title: "KPI",
      value: formatNumber(userData.bonus || 0),
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
      Icon: Banknote,
      ringColor: "ring-gray-400",
      bgImage:
        "https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=1170&auto=format&fit=crop",
    },
  ];

  const cards =
    userData.payment_type === "piece_work"
      ? [
          baseCards.find((c) => c.key === "ish"),
          ...baseCards.filter((c) => c.key !== "ish"),
        ]
      : baseCards;

  const cardComponents = {
    davomat: <Attendance userData={userData} />,
    ish: <Work userData={userData} />,
    avans: <Salary userData={userData} type="advance" />,
    maosh: <Salary userData={userData} type="salary" />,
    kpi: <Kpi userData={userData} />,
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
      <div className="hidden md:grid grid-cols-3 gap-4 mt-5">
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
            loading={loading}
            bgImage={c.bgImage}
          />
        ))}
      </div>

      {/* Mobile slider */}
      <div className="md:hidden mt-5">
        <Swiper
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          initialSlide={activeIndex} // ✅ Restore last active slide
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
                loading={loading}
                bgImage={c.bgImage}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Render component of the active card */}
      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : (
          cardComponents[cards[activeIndex]?.key]
        )}
      </div>
    </div>
  );
};

export default NewProfile;
