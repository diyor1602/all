import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  DollarSign,
  CreditCard,
  BadgeRussianRuble,
  BadgeDollarSign,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";

const currencyIcons = {
  Dollar: <BadgeDollarSign className="text-green-600 w-5 h-5" />,
  "So'm": <Wallet className="text-blue-600 w-5 h-5" />,
  Rubl: <BadgeRussianRuble className="text-red-600 w-5 h-5" />,
};

const Balance = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/casher/balances");
        setData(response.data.cashboxes);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Balans ma'lumotlari olishda xatolik yuz berdi.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kassalar balansi</h1>
      {data.map((cashbox) => (
        <motion.div
          key={cashbox.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: cashbox.id * 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            {cashbox.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cashbox.balance.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border"
              >
                {currencyIcons[item.currency] || (
                  <Wallet className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">{item.currency}</p>
                  <p className="font-semibold text-gray-700">{item.amount}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Balance;
