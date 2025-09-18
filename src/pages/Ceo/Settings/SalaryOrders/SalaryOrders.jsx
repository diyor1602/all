import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const SalaryOrders = () => {
  const STORAGE_KEY = "salaryOrderSelectedMonth";
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEY) || new Date().toISOString().slice(0, 7)
    );
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/ceo/monthlySelectedOrders?month=${selectedMonth}`
      );
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/ceo/orders`);
      setOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleAdd = async (order) => {
    try {
      await api.post("ceo/monthlySelectedOrders", {
        month: selectedMonth,
        order_id: order.id,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar qo'shildi",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchData();
      fetchOrders();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleMinus = async (order) => {
    try {
      await api.delete(`ceo/monthlySelectedOrders/${order.id}`);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar o'chirildi",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchData();
      fetchOrders();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="w-fit bg-white"
      />
      <div className="bg-red-200 grid grid-cols-5 gap-2">
        {data.selected?.map((item, index) => (
          <div key={index}>
            <div>{item.id}</div>
            <div>{item.order_id}</div>
            <Button onClick={() => handleMinus(item)}>minus</Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 bg-green-200">
        {orders
          .filter((item) => !data.selected?.some((i) => i.order_id === item.id))
          .map((item, index) => (
            <div key={index}>
              <div>{item.id}</div>
              <div>{item.name}</div>
              <Button onClick={() => handleAdd(item)}>qo'shish</Button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SalaryOrders;
