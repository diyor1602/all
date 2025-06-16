import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Color palette for department cards
const cardColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-indigo-500 to-indigo-600",
  "from-cyan-500 to-cyan-600",
  "from-violet-500 to-violet-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-pink-500 to-pink-600",
];

// Function to get a color based on department ID
const getCardColor = (index) => {
  return cardColors[index % cardColors.length];
};

const Result = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/resultChecker/departments");
      setDepartments(response.data?.flatMap((item) => item?.departments));
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Bo'limlar
      </h1>

      {departments?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Hech qanday bo'lim topilmadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments
            ?.sort((a, b) => b?.groups?.length - a?.groups?.length)
            .map((department, index) => (
              <Link
                to={`/resultChecker/result/${department?.id}`}
                key={department?.id}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getCardColor(
                    index
                  )} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>
                <div className="relative p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
                      <span className="text-sm font-medium mr-1">Ko'rish</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {department?.name}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center text-white/90">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 mr-3">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {department?.groups?.length || 0} ta guruh
                        </p>
                        <p className="text-xs text-white/70">
                          Jami guruhlar soni
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default Result;
