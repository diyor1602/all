import { Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HeartCrack,
  BadgePercent,
  BadgeDollarSign,
  CalendarClock,
  Flower,
  Calculator,
  Trees,
  SunSnow,
  ChartArea,
  Medal,
} from "lucide-react";

import SalaryOrders from "./SalaryOrders/SalaryOrders";
import Coefficient from "./Coefficient/Coefficient";
import SalaryHistory from "./History/SalaryHistory";
import GroupHistory from "./History/GroupHistory";
import QualityRatings from "./QualityRatings/QualityRatings";
import Levels from "./Levels/Levels";

const Settings = () => {
  return (
    <Routes>
      <Route path="*" element={<SettingsPage />} />
      <Route path="salary/orders" element={<SalaryOrders />} />
      <Route path="coefficient" element={<Coefficient />} />
      <Route path="salaryhistory" element={<SalaryHistory />} />
      <Route path="grouphistory" element={<GroupHistory />} />
      <Route path="qualityratings" element={<QualityRatings />} />
      <Route path="levels" element={<Levels />} />
    </Routes>
  );
};

const SettingsPage = () => {
  const cardData = [
    {
      name: "Oylik modellar",
      icon: HeartCrack,
      link: "/ceo/settings/salary/orders",
      color: "bg-orange-500",
    },
    {
      name: "Koeffitsiyent",
      icon: BadgePercent,
      link: "/ceo/settings/coefficient",
      color: "bg-blue-500",
    },
    {
      name: "Oylik tarixi",
      icon: BadgeDollarSign,
      link: "/ceo/settings/salaryhistory",
      color: "bg-green-500",
    },
    {
      name: "Guruhlar tarixi",
      icon: CalendarClock,
      link: "/ceo/settings/grouphistory",
      color: "bg-purple-500",
    },
    {
      name: "Yangi mavsum",
      icon: Flower,
      link: "/ceo/quantity",
      color: "bg-green-500",
    },
    {
      name: "Hisob",
      icon: Calculator,
      link: "/ceo/calc",
      color: "bg-gray-500",
    },
    {
      name: "Yangi mavsum",
      icon: Trees,
      link: "/ceo/newSeason",
      color: "bg-sky-500",
    },
    {
      name: "Yangi mavsum hisobot",
      icon: SunSnow,
      link: "/ceo/newSeason/overall",
      color: "bg-rose-500",
    },
    {
      name: "Yangiiiiiiiii",
      icon: SunSnow,
      link: "/ceo/newSeason/overall2",
      color: "bg-black",
    },
    {
      name: "Sifat reyting",
      icon: ChartArea,
      link: "/ceo/settings/qualityratings",
      color: "bg-red-500",
    },
    {
      name: "Reytinglar",
      icon: Medal,
      link: "/ceo/settings/levels",
      color: "bg-yellow-500",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Qo'shimcha
        </h2>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {cardData.map((card, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={card.link} className="block h-full">
              <div
                className={`${card.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20">
                  <card.icon size={128} />
                </div>
                <div className="relative z-10">
                  <card.icon size={40} className="mb-4" />
                  <h3 className="text-xl font-bold">{card.name}</h3>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

export default Settings;
