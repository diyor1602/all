import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Departments = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/departments");
        setData(response.data?.flatMap((item) => item?.departments));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Ma'lumotlar olishda xatolik",
        });
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const cardColors = [
    {
      bg: "from-blue-50 to-blue-100",
      border: "hover:border-blue-200",
      iconBg: "from-blue-10 to-blue-20",
      iconHover: "from-blue-20 to-blue-30",
      iconColor: "text-blue-600",
      textHover: "group-hover:text-blue-600",
      gradient: "from-blue-0 via-blue-20 to-blue-0",
    },
    {
      bg: "from-emerald-50 to-emerald-100",
      border: "hover:border-emerald-200",
      iconBg: "from-emerald-10 to-emerald-20",
      iconHover: "from-emerald-20 to-emerald-30",
      iconColor: "text-emerald-600",
      textHover: "group-hover:text-emerald-600",
      gradient: "from-emerald-0 via-emerald-20 to-emerald-0",
    },
    {
      bg: "from-purple-50 to-purple-100",
      border: "hover:border-purple-200",
      iconBg: "from-purple-10 to-purple-20",
      iconHover: "from-purple-20 to-purple-30",
      iconColor: "text-purple-600",
      textHover: "group-hover:text-purple-600",
      gradient: "from-purple-0 via-purple-20 to-purple-0",
    },
    {
      bg: "from-orange-50 to-orange-100",
      border: "hover:border-orange-200",
      iconBg: "from-orange-10 to-orange-20",
      iconHover: "from-orange-20 to-orange-30",
      iconColor: "text-orange-600",
      textHover: "group-hover:text-orange-600",
      gradient: "from-orange-0 via-orange-20 to-orange-0",
    },
    {
      bg: "from-pink-50 to-pink-100",
      border: "hover:border-pink-200",
      iconBg: "from-pink-10 to-pink-20",
      iconHover: "from-pink-20 to-pink-30",
      iconColor: "text-pink-600",
      textHover: "group-hover:text-pink-600",
      gradient: "from-pink-0 via-pink-20 to-pink-0",
    },
    {
      bg: "from-indigo-50 to-indigo-100",
      border: "hover:border-indigo-200",
      iconBg: "from-indigo-10 to-indigo-20",
      iconHover: "from-indigo-20 to-indigo-30",
      iconColor: "text-indigo-600",
      textHover: "group-hover:text-indigo-600",
      gradient: "from-indigo-0 via-indigo-20 to-indigo-0",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Bo'limlar</h1>
          </div>
        </motion.div>

        {loading ? (
          <div className="w-full h-96 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="animate-spin text-primary" size={48} />
            </motion.div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {data?.map((item, index) => {
              const colorScheme = cardColors[index % cardColors.length];
              return (
                <motion.div
                  key={item?.id || index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={`/ceo/newSeason/departmentView/${item?.id}`}
                    className="block group"
                  >
                    <div
                      className={`bg-gradient-to-br ${colorScheme.bg} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 ${colorScheme.border}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${colorScheme.iconBg} rounded-lg flex items-center justify-center group-hover:${colorScheme.iconHover} transition-colors`}
                        >
                          <Building2
                            className={`w-6 h-6 ${colorScheme.iconColor}`}
                          />
                        </div>
                        <ArrowRight
                          className={`w-5 h-5 text-gray-400 group-hover:${colorScheme.iconColor.replace("text-", "")} group-hover:translate-x-1 transition-all duration-300`}
                        />
                      </div>
                      <h3
                        className={`text-lg font-semibold text-gray-800 ${colorScheme.textHover} transition-colors line-clamp-2`}
                      >
                        {item?.name}
                      </h3>
                      <div
                        className={`mt-4 h-1 bg-gradient-to-r ${colorScheme.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      ></div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && data?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Departamentlar topilmadi
            </h3>
            <p className="text-gray-500">
              Hozircha hech qanday departament mavjud emas
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Departments;
