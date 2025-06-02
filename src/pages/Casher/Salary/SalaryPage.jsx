import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const SalaryPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const fetchSalary = async () => {
    try {
      setLoading(true);
      const response = await api.get("/casher/departments");
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
    fetchSalary();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-blue-800">
          Bo'limlar Maoshi
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : data?.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data
              .sort((a, b) => b.total_balance - a.total_balance)
              .map((item) => (
                <Link
                  to={`/casher/salary/${item.id}`}
                  key={item.id}
                  className="group relative bg-white rounded-3xl border border-gray-200 shadow-md hover:shadow-xl transition-all p-6 hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Wallet className="text-blue-600 w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      {item.name}
                    </h2>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {parseFloat(item.total_balance)?.toLocaleString("ru-RU")}{" "}
                    so'm
                  </p>
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">
            Ma'lumotlar mavjud emas
          </p>
        )}
      </div>
    </div>
  );
};

export default SalaryPage;
