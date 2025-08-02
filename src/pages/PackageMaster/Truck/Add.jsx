import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
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
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ChevronsUpDownIcon,
  PlusIcon,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { statuses } from "@/lib/status";

const Add = () => {
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    items: [],
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/packageMaster/orders");
      setOrders(res.data || []);

      const unique = new Map();
      res.data?.forEach((order) => {
        const modelId = order.order_model.model.id;
        if (!unique.has(modelId)) unique.set(modelId, order.order_model);
      });
      setModels([...unique.values()]);
    } catch (e) {
      toast({
        title: "Xatolik",
        description:
          e.response?.data?.message || "Buyurtmalarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addModelToItems = (modelObj) => {
    const alreadyExists = form.items.find(
      (item) => item.model_id === modelObj.model.id
    );
    if (alreadyExists) return;

    const relatedOrders = orders.filter(
      (order) => order.order_model.model.id === modelObj.model.id
    );

    const defaultDetail =
      relatedOrders.length === 1
        ? [
            {
              order_id: relatedOrders[0].id,
              submodel_id:
                relatedOrders[0].order_model.submodels?.[0]?.submodel?.id || "",
              quantity: relatedOrders[0].quantity,
            },
          ]
        : [];

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          model_id: modelObj.model.id,
          quantity: defaultDetail[0]?.quantity || 0,
          details: defaultDetail,
        },
      ],
    }));
  };

  const handleAddOrderToDetails = (modelId, order) => {
    setForm((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.model_id !== modelId) return item;

        const already = item.details.find((d) => d.order_id === order.id);
        if (already) return item;

        const newDetail = {
          order_id: order.id,
          submodel_id: order.order_model.submodels?.[0]?.submodel?.id || "",
          quantity: order.quantity,
        };

        const newDetails = [...item.details, newDetail];

        return {
          ...item,
          details: newDetails,
          quantity: parseInt(newDetails[0]?.quantity) || 0,
        };
      });

      return { ...prev, items: updatedItems };
    });
  };

  const handleSend = async () => {
    console.log(form);
    const valid = form.items.every((item) => item.quantity > 0);
    if (!valid) {
      toast({
        title: "Diqqat",
        description: "Umumiy soni 0 dan katta bo'lishi shart",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    const validDetails = form.items.every((item) =>
      item.details.every((d) => d.quantity > 0)
    );
    if (!validDetails) {
      toast({
        title: "Diqqat",
        description: "Buyurtma soni 0 dan katta bo'lishi shart",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    const validModels = form.items.every((item) => {
      // Extract all quantities from the details of the current item
      const quantities = item.details.map((detail) => detail.quantity || 0);

      // Check if all quantities are equal
      return quantities.every((q) => q === quantities[0]);
    });

    if (!validModels) {
      toast({
        title: "Diqqat",
        description: "Model ichidagi buyurtmalar soni teng bo'lishi shart",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    try {
      setSending(true);
      await api.post("/packageMaster/shipmentPlans", form);
      toast({
        title: "Muvaffaqiyatli",
        description: "Yuklanish plani qo'shildi",
        style: { backgroundColor: "green", color: "white" },
      });

      setForm({
        date: new Date().toISOString().split("T")[0],
        items: [],
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description:
          err.response?.data?.message || "Yuklanish plani yuborishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRemoveOrderFromDetails = (modelId, order) => {
    setForm((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.model_id !== modelId) return item;

        const updatedDetails = item.details.filter(
          (detail) => detail.order_id !== order.id
        );

        return {
          ...item,
          details: updatedDetails,
          quantity: parseInt(updatedDetails[0]?.quantity) || 0,
        };
      });

      return { ...prev, items: updatedItems };
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return loading ? (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Yuklanish plani qo'shish</h1>
        <Input
          type="date"
          className="w-fit bg-white"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      {/* Select Model */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Model qo'shish
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Modelni qidirish..." />
            <CommandList>
              <CommandEmpty>Model topilmadi</CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.model.id}
                    value={model.model.name}
                    onSelect={() => {
                      addModelToItems(model);
                      setOpen(false);
                    }}
                  >
                    {model.model.name} —{" "}
                    {model.submodels?.map((s) => s.submodel.name).join(", ")}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Models List */}
      {form.items.map((item, itemIndex) => {
        const relatedOrders = orders.filter(
          (o) => o.order_model.model.id === item.model_id
        );
        const modelName = relatedOrders[0]?.order_model.model.name;
        const details = item.details;

        return (
          <div
            key={itemIndex}
            className="p-4 bg-white rounded-lg space-y-4 border relative"
          >
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={() => {
                const updated = [...form.items];
                updated.splice(itemIndex, 1);
                setForm({ ...form, items: updated });
              }}
              title="Modelni olib tashlash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-semibold text-lg">
                Model #{item.model_id} — {modelName}
              </h2>
              <div>
                Umumiy soni:{" "}
                <span className="font-semibold">
                  {parseInt(details[0]?.quantity) || 0}
                </span>
              </div>
            </div>

            {/* Orders for model */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedOrders.map((order, index) => {
                const already = details.find((d) => d.order_id === order.id);
                const submodels = order.order_model.submodels || [];
                const detailIndex = details.findIndex(
                  (d) => d.order_id === order.id
                );

                return (
                  <div
                    key={index}
                    className={`border rounded p-4 space-y-3 shadow-sm h-fit ${
                      already ? "bg-blue-100" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">
                            Buyurtma ID: {order.id}
                          </p>
                          <div
                            className={`px-2 py-1 rounded text-xs text-white ${
                              statuses[order.status].color
                            }`}
                          >
                            {statuses[order.status].text}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Submodellar:{" "}
                          {submodels.map((s) => s.submodel.name).join(", ") ||
                            "—"}
                        </p>
                      </div>
                      {!already ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleAddOrderToDetails(item.model_id, order)
                          }
                        >
                          <Plus />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleRemoveOrderFromDetails(item.model_id, order)
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {already && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-t pt-3">
                        {/* Quantity input */}
                        <Input
                          type="number"
                          placeholder="Soni"
                          className="bg-white"
                          value={details[detailIndex]?.quantity || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const updatedItems = [...form.items];

                            // Update detail quantity
                            updatedItems[itemIndex].details[
                              detailIndex
                            ].quantity = val;

                            // Update total quantity from all details
                            updatedItems[itemIndex].quantity =
                              parseInt(
                                updatedItems[itemIndex].details[0]?.quantity
                              ) || 0;

                            setForm({ ...form, items: updatedItems });
                          }}
                        />

                        {/* Submodel selector */}
                        {submodels.length > 1 ? (
                          <select
                            className="bg-white border rounded px-3 py-2 text-sm"
                            value={details[detailIndex]?.submodel_id}
                            onChange={(e) => {
                              const updatedItems = [...form.items];
                              updatedItems[itemIndex].details[
                                detailIndex
                              ].submodel_id = e.target.value;
                              setForm({ ...form, items: updatedItems });
                            }}
                          >
                            {submodels.map((s) => (
                              <option key={s.submodel.id} value={s.submodel.id}>
                                {s.submodel.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {submodels[0]?.submodel.name || "—"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-right">
        <Button onClick={handleSend} disabled={sending || !form.items.length}>
          {sending ? "Yuborilmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
};

export default Add;
