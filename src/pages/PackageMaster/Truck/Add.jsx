import { useState, useEffect } from "react";
import api from "@/utils/api";
import { toast, useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  ChevronsUpDownIcon,
  Snowflake,
  TreePalm,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { statuses } from "@/lib/status";

const Add = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "123ABC",
    driver_name: "Qo'chqorali",
    driver_phone: "+998001234567",
    comment: "Endi jo'nataslarmi chichqoqlar",
  });
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const getOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("packageMaster/orders");
      setOrders(res?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-4">
          <div>Truck ma'lumotlari</div>
          <Input
            placeholder="Transport raqami"
            value={form.vehicle_number}
            onChange={(e) => {
              setForm({ ...form, vehicle_number: e.target.value });
            }}
            className="bg-white"
          />
          <Input
            placeholder="Haydovchi ismi"
            value={form.driver_name}
            onChange={(e) => {
              setForm({ ...form, driver_name: e.target.value });
            }}
            className="bg-white"
          />
          <Input
            placeholder="Haydovchi telefon"
            value={form.driver_phone}
            onChange={(e) => {
              setForm({ ...form, driver_phone: e.target.value });
            }}
            className="bg-white"
          />
          <Input
            placeholder="Izoh"
            value={form.comment}
            onChange={(e) => {
              setForm({ ...form, comment: e.target.value });
            }}
            className="bg-white"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 justify-between">
            <div>Buyurtmalar</div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Buyurtmani qo'shish
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buyurtmani qidirish..." />
                  <CommandList>
                    <CommandEmpty>Buyurtma topilmadi</CommandEmpty>
                    <CommandGroup>
                      {orders?.map((order, index) => (
                        <CommandItem
                          key={index}
                          value={order.id}
                          onSelect={() => {
                            setOpen(false);
                          }}
                        >
                          <div className="text-xs space-y-1">
                            <div>{order?.name}</div>
                            <div>
                              {order?.quantity} ta{" "}
                              <span className="font-medium">
                                {
                                  order?.order_model?.submodels[0]?.submodel
                                    ?.name
                                }
                              </span>
                            </div>
                            <div
                              className={`${statuses[order.status]?.color} text-white rounded-full w-fit px-2 py-1`}
                            >
                              {statuses[order.status]?.text}
                            </div>
                            <>
                              {order?.season_type === "winter" ? (
                                <div className="text-blue-500 flex items-center gap-2">
                                  {order?.season_year} <Snowflake /> Qish
                                </div>
                              ) : (
                                <div className="text-green-500 flex items-center gap-2">
                                  {order?.season_year} <TreePalm /> Bahor
                                </div>
                              )}{" "}
                            </>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </>
  );
};

export default Add;
