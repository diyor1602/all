import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bo'limlar</h2>
      {loading ? (
        <div className="flex items-center justify-center w-full min-h-[calc(100vh-6rem)]">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-inherit">
          {data.map((item, index) => (
            <Link
              to={`/supervisor/plan/${item?.id}`}
              key={index}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              {item?.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanPage;
