import { Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, ChartPie, Palette, Star, Truck } from "lucide-react";
import Item from "./Items/Item";
import Balance from "./Balance/Balance";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import Colors from "./Additional/Colors";

const Settings = () => {
  return (
    <Routes>
      <Route path="*" element={<SettingsPage />} />
      <Route path="items/*" element={<Item />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="orders/" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="colors/" element={<Colors />} />
    </Routes>
  );
};

const SettingsPage = () => {
  const cardData = [
    {
      name: "Ombor holati",
      icon: ChartPie,
      link: "/warehouseManager/settings/balance",
      color: "bg-slate-500",
    },
    {
      name: "Mahsulotlar",
      icon: Box,
      link: "/warehouseManager/settings/items",
      color: "bg-blue-500",
    },
    {
      name: "Buyurtmalar",
      icon: Star,
      link: "/warehouseManager/settings/orders",
      color: "bg-yellow-500",
    },
    {
      name: "Ranglar",
      icon: Palette,
      link: "/warehouseManager/settings/colors",
      color: "bg-red-500",
    },
    {
      name: "Ta'minot",
      icon: Truck,
      link: "/warehouseManager/settings/delivery",
      color: "bg-green-500",
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
