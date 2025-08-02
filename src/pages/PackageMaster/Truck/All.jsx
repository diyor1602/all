import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const All = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState([]);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        const response = await api.get("/packageMaster/shipmentPlans");
        setTrucks(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Iltimos, qayta urinib ko'ring",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, []);

  return (
    <>
      <div className="flex gap-2 justify-between items-center flex-wraps">
        <h1 className="text-2xl font-bold">Yuklanish planlari</h1>
        <Button asChild>
          <Link to="/packageMaster/truck/add">
            <Plus />
            Yangi qo'shish
          </Link>
        </Button>
      </div>
      <div className="space-y-6 mt-6">
        {trucks
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((truck) => (
            <div key={truck.id} className="bg-white rounded-lg p-4 shadow-sm">
              <h2>Muddat: {truck.date?.split("-").reverse().join(".")}</h2>
              <div>
                Umumiy Miqdor:{" "}
                {truck.items.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <div>
                Umumiy Bajarilgan:{" "}
                {truck.items.reduce((acc, item) => acc + item.completed, 0)}
              </div>
              <div>
                Umumiy Bajarilgan:{" "}
                {(
                  (truck.items.reduce((acc, item) => acc + item.completed, 0) /
                    truck.items.reduce((acc, item) => acc + item.quantity, 0)) *
                  100
                ).toFixed(0)}
                %
              </div>
              <Progress
                value={(
                  (truck.items.reduce((acc, item) => acc + item.completed, 0) /
                    truck.items.reduce((acc, item) => acc + item.quantity, 0)) *
                  100
                ).toFixed(0)}
              />
              <div className="grid grid-cols-2 gap-2 mt-4">
                {truck.items.map((item) => (
                  <div key={item.id} className="bg-green-100 p-2">
                    <div>Model: {item.model?.name}</div>
                    <div>Miqdori: {item.quantity}</div>
                    <div>Bajarilgan: {item.completed}</div>
                    <div>
                      {((item.completed / item.quantity) * 100).toFixed(0)}%
                    </div>
                    <Progress value={(item.completed / item.quantity) * 100} />
                    {item.details.map((detail, i) => (
                      <div key={i} className="mt-2 bg-gray-100 p-2">
                        <div>Buyurtma nomi: {detail.order?.name}</div>
                        <div>Submodel: {detail.submodel?.name}</div>
                        <div>Miqdori: {detail.quantity}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default All;
