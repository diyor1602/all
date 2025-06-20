import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronsUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { statuses } from "@/lib/status";

// Color palette for cards
const cardColors = [
  "bg-gradient-to-br from-blue-300 to-blue-400 border-blue-200",
  "bg-gradient-to-br from-green-300 to-green-400 border-green-200",
  "bg-gradient-to-br from-amber-300 to-amber-400 border-amber-200",
  "bg-gradient-to-br from-purple-300 to-purple-400 border-purple-200",
  "bg-gradient-to-br from-rose-300 to-rose-400 border-rose-200",
  "bg-gradient-to-br from-emerald-300 to-emerald-400 border-emerald-200",
];

const getCardColor = (index) => {
  return cardColors[index % cardColors.length];
};

const Nakladnoy = () => {
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [open, setOpen] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get("/internalAccountant/departments");
      const allSubDepartments = response.data.flatMap(
        (main) => main.departments
      );
      setGroups(allSubDepartments.flatMap((dept) => dept.groups));
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/internalAccountant/orders");
      setOrders(response.data);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchOrders();
  }, []);

  const handleDownload = async (groupId, groupName) => {
    if (!selectedOrder) {
      toast({
        title: "Diqqat",
        description: "Modelni tanlang!",
        variant: "destructive",
      });
      return;
    }
    setDownloadingIds((prev) => ({ ...prev, [groupId]: true }));
    try {
      const response = await api.get(`/internalAccountant/nakladnoy`, {
        params: {
          group_id: groupId,
          model_id: selectedOrder?.order_model?.model?.id,
        },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nakladnoy_${groupName}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-32 bg-muted/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 justify-between">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={true}
                  className="w-[200px] justify-between"
                >
                  {selectedOrder?.name || "Buyurtma tanlash"}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Qidirish..." />
                  <CommandList>
                    <CommandEmpty>Buyurtma topilmadi</CommandEmpty>
                    <CommandGroup>
                      {orders
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        ?.map((order) => (
                          <CommandItem
                            key={order.id}
                            onSelect={() => {
                              setSelectedOrder(order);
                              setOpen(false);
                            }}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2 justify-between w-full">
                                <div>{order?.name}</div>
                                <div
                                  className={cn(
                                    statuses[order?.status]?.color,
                                    "px-2 py-1 rounded-full text-xs text-white"
                                  )}
                                >
                                  {statuses[order?.status]?.text}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order?.order_model?.submodels
                                  ?.map((submodel) => submodel?.submodel?.name)
                                  .join(", ")}
                              </div>
                              <div className="flex items-center gap-2 justify-between w-full">
                                <div className="text-xs text-muted-foreground">
                                  {order?.order_model?.model?.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order?.quantity} ta
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {selectedOrder && (
            <div className="text-sm text-muted-foreground flex flex-col gap-2 bg-white p-4 rounded-lg border shadow-sm">
              <div>
                Nomi:{" "}
                <span className="font-semibold text-black">
                  {selectedOrder?.name}
                </span>
              </div>
              <div>
                Model:{" "}
                <span className="font-semibold text-black">
                  {selectedOrder?.order_model?.model?.name}
                </span>
              </div>
              <div>
                Soni:{" "}
                <span className="font-semibold text-black">
                  {selectedOrder?.quantity} ta
                </span>
              </div>
              <div>
                Submodellar:{" "}
                <span className="font-semibold text-black">
                  {selectedOrder?.order_model?.submodels
                    ?.map((submodel) => submodel?.submodel?.name)
                    .join(", ")}
                </span>
              </div>
              <div>
                Status:{" "}
                <span
                  className={cn(
                    statuses[selectedOrder?.status]?.color,
                    "text-white px-2 py-1 rounded-full text-xs"
                  )}
                >
                  {statuses[selectedOrder?.status]?.text}
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((group, index) => (
                <Card
                  key={group.id}
                  className={`${getCardColor(
                    index
                  )} border-2 transition-all hover:shadow-lg hover:-translate-y-1`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {group.name}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="line-clamp-2 text-sm">
                        {group.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button
                      disabled={downloadingIds[group.id]}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleDownload(group.id, group.name)}
                    >
                      {downloadingIds[group.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Yuklanmoqda...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Yuklab olish
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Nakladnoy;
