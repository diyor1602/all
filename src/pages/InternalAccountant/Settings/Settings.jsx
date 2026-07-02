import { Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BaggageClaim,
  Box,
  HandCoins,
  History,
  Plane,
  QrCode,
  Siren,
  TreePalm,
  Lock,
  AlarmClockPlus,
  Wrench,
  Coins,
} from "lucide-react";
import AttendanceHistory from "./AttendanceHistory";
import Nakladnoy from "./Nakladnoy";
import NakladnoySkaner from "./NakladnoySkaner";
import SalaryOrders from "./SalaryOrders";
import TarifSearch from "./TarifSearch";
import Result from "./Result/Result";
import ResultView from "./Result/ResultView";
import Damages from "./Damages/Damages";
import SalaryPage from "./SalaryPage";

const Settings = () => {
  return (
    <Routes>
      <Route path="*" element={<SettingsPage />} />
      <Route path="attendance-history" element={<AttendanceHistory />} />
      <Route path="nakladnoy" element={<Nakladnoy />} />
      <Route path="nakladnoy-skaner" element={<NakladnoySkaner />} />
      <Route path="tarif-search" element={<TarifSearch />} />
      <Route path="salaryOrders" element={<SalaryOrders />} />
      <Route path="result" element={<Result />} />
      <Route path="result/:id" element={<ResultView />} />
      <Route path="damages" element={<Damages />} />
      <Route path="salary" element={<SalaryPage />} />
    </Routes>
  );
};

const SettingsPage = () => {
  const cardData = [
    {
      name: "Davomat tarixi",
      icon: History,
      link: "/internalAccountant/settings/attendance-history",
      color: "bg-green-500",
    },
    // {
    //   name: "Buyurtmalar",
    //   icon: Box,
    //   link: "/internalAccountant/work",
    //   color: "bg-red-500",
    // },
    // {
    //   name: "Ish",
    //   icon: BaggageClaim,
    //   link: "/internalAccountant/task",
    //   color: "bg-sky-500",
    // },
    // {
    //   name: "Skaner",
    //   icon: QrCode,
    //   link: "/internalAccountant/scanner",
    //   color: "bg-gray-500",
    // },
    // {
    //   name: "Oylik terish",
    //   icon: HandCoins,
    //   link: "/internalAccountant/manual",
    //   color: "bg-indigo-500",
    // },
    // {
    //   name: "Nakladnoy",
    //   icon: Plane,
    //   link: "/internalAccountant/settings/nakladnoy",
    //   color: "bg-orange-500",
    // },
    // {
    //   name: "Nakladnoy Skaner",
    //   icon: TreePalm,
    //   link: "/internalAccountant/settings/nakladnoy-skaner",
    //   color: "bg-emerald-500",
    // },
    {
      name: "Tarif qidirish",
      icon: Siren,
      link: "/internalAccountant/settings/tarif-search",
      color: "bg-red-500",
    },
    {
      name: "Oylik modellar",
      icon: Lock,
      link: "/internalAccountant/settings/salaryOrders",
      color: "bg-black",
    },
    {
      name: "Natijalar",
      icon: AlarmClockPlus,
      link: "/internalAccountant/settings/result",
      color: "bg-indigo-500",
    },
    {
      name: "Braklar",
      icon: Wrench,
      link: "/internalAccountant/settings/damages",
      color: "bg-yellow-500",
    },
    {
      name: "Oylik jadval",
      icon: Coins,
      link: "/internalAccountant/settings/salary",
      color: "bg-emerald-500",
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
