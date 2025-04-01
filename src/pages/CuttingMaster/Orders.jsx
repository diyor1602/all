import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [comments, setComments] = useState({});
  const [planDates, setPlanDates] = useState({});
  const [sending, setSending] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cuttingMaster/orders", {
        params: { status: "active" },
      });
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(
      (order) =>
        order.name.toLowerCase().includes(search.toLowerCase()) ||
        order.quantity.toString().includes(search) ||
        order.comment.toLowerCase().includes(search.toLowerCase()) ||
        order.order_model.model.name
          .toLowerCase()
          .includes(search.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

  const handleCommentChange = (orderId, value) => {
    setComments((prev) => ({ ...prev, [orderId]: value }));
  };

  const handlePlanDateChange = (orderId, value) => {
    setPlanDates((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleSendToConstructor = async (orderId) => {
    const orderComment = comments[orderId] || "";
    const orderPlanDate = planDates[orderId] || "";

    try {
      setSending(true);
      await api.post("/cuttingMaster/sendToConstructor", {
        order_id: orderId,
        planned_time: orderPlanDate || null,
        comment: orderComment || null,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Konstruktorga muvaffaqiyatli jo'natildi.",
        style: { backgroundColor: "green", color: "white" },
      });

      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white p-4">
      <Input
        type="text"
        placeholder="Qidirish..."
        className="w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Accordion type="single" collapsible>
        {filteredOrders.map((order) => (
          <AccordionItem key={order.id} value={order.id.toString()}>
            <AccordionTrigger>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 justify-between">
                  <p className="font-medium">{order.name}</p>
                  <p className="text-muted-foreground">{order.quantity}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <div>
                  Model:{" "}
                  <span className="font-bold">
                    {order.order_model.model.name}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Submodellar:</div>
                  <div className="flex items-center gap-2 flex-wrap bg-gray-100 p-2 rounded">
                    {order.order_model.submodels.map((submodel) => (
                      <span
                        key={submodel.id}
                        className="px-2 py-1 bg-white rounded"
                      >
                        {submodel.submodel.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>O'lchamlar:</div>
                  <div className="flex items-center gap-2 flex-wrap bg-gray-100 p-2 rounded">
                    {order.order_model.sizes.map((size) => (
                      <span
                        key={size.id}
                        className="px-2 py-1 bg-white rounded"
                      >
                        {size.size.name} - {size.quantity} ta
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Instruksiyalar:</div>
                  <table className="border">
                    <thead></thead>
                    <tbody>
                      {order.instructions.map((instruction) => (
                        <tr key={instruction.id} className="text-left">
                          <td className="border p-2">{instruction.title}</td>
                          <td className="border p-2">
                            {instruction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Izoh: </div>
                  <div className="bg-gray-100 p-2 rounded">{order.comment}</div>
                </div>
                <hr />
                <div className="flex flex-col gap-2">
                  <div>Reja vaqti:</div>
                  <Input
                    type="datetime-local"
                    value={planDates[order.id] || ""}
                    onChange={(e) =>
                      handlePlanDateChange(order.id, e.target.value)
                    }
                    placeholder="Reja vaqtini tanlang"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div>Izoh:</div>
                  <Textarea
                    value={comments[order.id] || ""}
                    onChange={(e) =>
                      handleCommentChange(order.id, e.target.value)
                    }
                    placeholder="Konstruktor uchun izoh yozing"
                  />
                </div>
                <Button
                  onClick={() => handleSendToConstructor(order.id)}
                  disabled={sending}
                >
                  {sending ? "Yuborilmoqda..." : "Konstruktorga jo'natish"}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Orders;
