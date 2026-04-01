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
  Loader2,
  Settings as SettingsIcon,
  DraftingCompass,
} from "lucide-react";
import Attendance from "./Attendance";
import Salary from "./Salary";
import Work from "./Work";
import Settings from "./Settings";
import Duty from "./Duty";
import Coefficient from "./Coefficient";

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

const calculateCoefficient = (userData) => {
  const logs = userData?.employee_tarification_logs || [];

  const grouped = logs.reduce((acc, log) => {
    const seconds =
      parseFloat(log.tarification?.second || 0) * (log.quantity || 0);

    acc.seconds = (acc.seconds || 0) + seconds;
    acc.days = (acc.days || 0) + 1;
    return acc;
  }, {});

  if (!grouped.days) return 0;

  // Average percentage per day
  return Math.round(
    (grouped.seconds /
      30000 /
      (userData?.attendances?.filter((a) => a.status === "present")?.length ||
        1)) *
      100,
  );
};

// ---------- Card ----------
const Card = ({
  title,
  value,
  color,
  Icon,
  isActive,
  hasAdditional,
  onClick,
  ringColor,
  loading,
  bgImage,
  prefix,
  visible,
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
      ${color} relative overflow-hidden cursor-
      rounded-3xl p-6 text-white w-full
      flex flex-col justify-between transition-all
      ${isActive ? `md:ring-2 md:ring-offset-2 ${ringColor}` : ""}
      ${visible ? "" : "hidden"}
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
            <div
              className={`text-2xl font-bold mt-1 flex items-center gap-1 ${
                hasAdditional ? "line-through" : ""
              }`}
            >
              {value ? (
                <>
                  {value}
                  <span className="text-xl font-normal">
                    {prefix || "so'm"}
                  </span>
                </>
              ) : (
                "-"
              )}
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

const Profile = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("profileMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [secondChecks, setSecondChecks] = useState([]);

  // ✅ Load activeIndex from localStorage
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem("activeIndex");
    return saved ? Number(saved) : 0;
  });

  // ✅ Save activeIndex to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeIndex", activeIndex);
  }, [activeIndex]);

  const role = localStorage.getItem("role");

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
        localStorage.setItem("imgUrl", response.data.img);
        localStorage.setItem("username", response.data.username);
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

    const getSecondChecks = async () => {
      if (role !== "qualityController") return;
      try {
        const response = await api.get("qualityController/mySecondChecks", {
          params: {
            month: selectedMonth,
          },
        });
        setSecondChecks(response.data);
      } catch (e) {
        setSecondChecks([]);
      }
    };

    fetchData();
    getSecondChecks();
  }, [selectedMonth]);

  const baseCards = [
    {
      key: "davomat",
      title: "Davomat",
      hasAdditional:
        userData.monthlySalaries?.length > 0 &&
        userData.monthlySalaries[0]?.amount >= 0,
      value: formatNumber(
        userData.attendance_salaries?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount || 0),
          0,
        ),
      ),
      color: "bg-gradient-to-r from-indigo-500 to-blue-600",
      Icon: CalendarDays,
      ringColor: "ring-blue-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1192&auto=format&fit=crop",
    },
    {
      key: "ish",
      title: "Ish",
      hasAdditional:
        userData.monthlyPieceworks?.length > 0 &&
        userData.monthlyPieceworks[0]?.amount >= 0,
      value: formatNumber(
        userData.employee_tarification_logs?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount_earned || 0),
          0,
        ) + (secondChecks?.total || 0),
      ),
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      Icon: Briefcase,
      ringColor: "ring-green-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1569411378499-565391f5ffe0?q=80&w=1070&auto=format&fit=crop",
    },
    {
      key: "avans",
      title: "Olingan Avans",
      value: formatNumber(
        userData.salaryPayments?.reduce(
          (sum, salary) => sum + Number.parseFloat(salary.amount || 0),
          0,
        ),
      ),
      color: "bg-gradient-to-r from-orange-500 to-red-500",
      Icon: Wallet,
      ringColor: "ring-orange-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1523199455310-87b16c0eed11?q=80&w=1170&auto=format&fit=crop",
    },
    {
      key: "koefitsient",
      title: "Koeffitsiyent",
      value: calculateCoefficient(userData),
      prefix: "%",
      color: "bg-gradient-to-r from-sky-500 to-blue-600",
      Icon: DraftingCompass,
      ringColor: "ring-blue-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1594616647927-2382fe456b07?q=80&w=1170&auto=format&fit=crop  ",
    },
    {
      key: "duty",
      title: "Sizning Vazifangiz!",
      value: null, // no value
      color: "bg-gray-900 text-gray-800", // neutral style
      Icon: SettingsIcon,
      ringColor: "ring-gray-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1170&auto=format&fit=crop",
    },
    {
      key: "sozlamalar",
      title: "Sozlamalar",
      value: null, // no value
      color: "bg-gray-900 text-gray-800", // neutral style
      Icon: SettingsIcon,
      ringColor: "ring-gray-400",
      visible: true,
      bgImage:
        "https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?q=80&w=1170&auto=format&fit=crop",
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
    ish: <Work userData={userData} secondChecks={secondChecks} />,
    avans: <Salary userData={userData} />,
    koefitsient: <Coefficient userData={userData} />,
    duty: <Duty userData={userData} />,
    sozlamalar: <Settings userData={userData} />,
  };

  return (
    <div className="w-full">
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("profileMonth", e.target.value);
        }}
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
            hasAdditional={c.hasAdditional}
            prefix={c.prefix}
            visible={c.visible}
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
                hasAdditional={c.hasAdditional}
                prefix={c.prefix}
                visible={c.visible}
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

export default Profile;
