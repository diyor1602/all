import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Box, Plus, Shirt, Tag, Trash2 } from "lucide-react";
import { statuses } from "@/lib/status";
import { Progress } from "@/components/ui/progress";

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
    if (
      !window.confirm(`${order.name} buyurtmani qo'shishni tasdiqlaysizmi?`)
    ) {
      return;
    }
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
    if (
      !window.confirm(
        `${order.order?.name} buyurtmani olib tashlayni tasdiqlaysizmi?`
      )
    ) {
      return;
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {data.selected?.map((item, index) => (
          <div key={index} className="rounded-xl bg-white shadow-xl">
            <div
              className={`h-2 ${
                statuses[item.order?.status]?.color
              } rounded-t-xl`}
            />
            <div className="p-2 pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 justify-between flex-wrap">
                <div
                  className={`${
                    statuses[item.order?.status]?.secondaryBg
                  } py-1 px-2 rounded-full w-fit text-xs font-semibold flex items-center gap-1 ${
                    statuses[item.order?.status]?.textColor
                  }`}
                >
                  <Tag
                    size={12}
                    className={statuses[item.order?.status]?.textColor}
                  />
                  <div>#{item.order?.id}</div>
                </div>
                <div
                  className={`${
                    statuses[item.order?.status]?.color
                  } py-1 px-2 rounded-full w-fit text-xs text-white`}
                >
                  {statuses[item.order?.status]?.text}
                </div>
              </div>
              <div
                className={`${
                  statuses[item.order?.status]?.border
                } bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
              >
                <h3 className="text-sm font-bold text-gray-800 truncate">
                  {item.order?.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 justify-between flex-wrap">
                <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                  <Box size={12} className="text-gray-800" />
                  <div className="font-semibold text-gray-800 text-xs">
                    {
                      orders?.find((order) => order.id === item.order_id)
                        ?.order_model?.model?.name
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                  {orders
                    ?.find((order) => order.id === item.order_id)
                    ?.order_model?.submodels?.map((submodel, idx) => (
                      <div
                        key={idx}
                        className="font-semibold text-gray-800 text-xs flex items-center gap-1"
                      >
                        <Shirt size={12} className="text-gray-800" />{" "}
                        {submodel.submodel?.name}
                      </div>
                    ))}
                </div>
              </div>

              <div className="relative flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-full text-xs overflow-hidden">
                {/* Progress fill */}
                <div
                  className={`${
                    statuses[item.order?.status]?.color
                  } absolute left-0 top-0 h-full rounded-full`}
                  style={{
                    width: `${
                      (item?.order?.order_model?.submodels?.reduce(
                        (total, submodel) =>
                          total +
                          parseInt(submodel.sewing_outputs_sum_quantity || 0),
                        0
                      ) /
                        item.order?.quantity) *
                      100
                    }%`,
                  }}
                ></div>

                {/* Text content (on top) */}
                <div
                  className={`relative z-10 flex items-center gap-1 ${
                    item?.order?.order_model?.submodels?.reduce(
                      (total, submodel) =>
                        total +
                        parseInt(submodel.sewing_outputs_sum_quantity || 0),
                      0
                    ) > 0
                      ? "text-white"
                      : ""
                  }`}
                >
                  {item?.order?.order_model?.submodels?.reduce(
                    (total, submodel) =>
                      total +
                      parseInt(submodel.sewing_outputs_sum_quantity || 0),
                    0
                  )}
                  /{item.order?.quantity}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleMinus(item)}
                className={`${
                  statuses[item.order?.status]?.color
                } text-white hover:text-white hover:bg-red-400 transition-all duration-300`}
              >
                <Trash2 />
                <div>Olib tashlash</div>
              </Button>
            </div>
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAdd(item)}
              >
                <Plus className="text-green-500 hover:text-green-600" />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SalaryOrders;
