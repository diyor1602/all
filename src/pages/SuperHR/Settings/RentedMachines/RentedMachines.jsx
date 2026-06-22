import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const statusMap = {
  taken: "Olingan",
  returned: "Qaytarilgan",
};

const RentedMachines = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superhr/home-typewriter");
      setData(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <div>
          {data.map((item, index) => (
            <div key={index}>
              <div>Xodim: {item.employee?.name}</div>
              <div>Mashina: {item.type_writer?.name}</div>
              <div>
                Berilgan sana:{" "}
                {new Date(item.given_at).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </div>
              <div>Status: {statusMap[item.status]}</div>
              {item.status === "returned" && (
                <div>
                  Qaytarilgan sana:{" "}
                  {new Date(item.returned_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentedMachines;
