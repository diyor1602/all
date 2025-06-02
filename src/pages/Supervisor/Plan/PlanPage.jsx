import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const PlanPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/supervisor/departments");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Bunday ma'lumot topilmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bo'limlar
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Tizimdagi barcha bo'limlar ro'yxati
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center w-full min-h-[50vh]">
          <div className="text-center">
            <Loader2
              className="animate-spin text-primary mx-auto mb-4"
              size={48}
            />
            <p className="text-gray-500">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data
            ?.sort((a, b) => b?.groups?.length - a?.groups?.length)
            .map((item, index) => (
              <motion.div
                key={item.id}
                custom={index % 6}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="h-full"
              >
                <Link
                  to={`/supervisor/plan/${item?.id}`}
                  className="block h-full group"
                >
                  <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-4">
                          <Building2 size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item?.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item?.groups?.length || 0} ta guruh
                        </span>
                        <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                          Ko'rish
                          <ArrowRight size={16} className="ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>
      )}

      {!loading && data.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <Building2 className="text-blue-500 dark:text-blue-400" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Bo'limlar topilmadi
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Hozircha hech qanday bo'lim mavjud emas yoki ulanishda xatolik yuz
            berdi
          </p>
          <Button
            onClick={fetchData}
            variant="outline"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-gray-800"
          >
            <RefreshCw size={18} className="shrink-0" />
            Qayta yuklash
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PlanPage;
