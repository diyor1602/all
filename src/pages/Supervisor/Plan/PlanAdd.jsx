import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Package,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import api from "@/utils/api";
import { statuses } from "@/lib/status";
import { cn } from "@/lib/utils";

const PlanAdd = () => {
  const { id, groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const groupName = location.state?.groupName || "";

  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedSubmodelId, setSelectedSubmodelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComboOpen, setOrderComboOpen] = useState(false);
  const [submodelComboOpen, setSubmodelComboOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch unassigned orders
        const ordersResponse = await api.get(`/supervisor/orders/groups`, {
          params: { department_id: id },
        });
        setUnassignedOrders(ordersResponse.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, groupId, toast]);

  const getSelectedOrder = useCallback(() => {
    return unassignedOrders.find(
      (order) => order.id === Number(selectedOrderId)
    );
  }, [selectedOrderId, unassignedOrders]);

  const getSelectedSubmodel = useCallback(() => {
    const order = getSelectedOrder();
    return order?.order_model?.submodels?.find(
      (sub) => sub.id === Number(selectedSubmodelId)
    );
  }, [selectedSubmodelId, getSelectedOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrderId || !selectedSubmodelId) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/supervisor/plans`, {
        order_id: Number(selectedOrderId),
        submodel_id: Number(selectedSubmodelId),
        group_id: Number(groupId),
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma guruhga biriktirildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 2000,
      });

      navigate(`/supervisor/plan/${id}`);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Buyurtma qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const selectedOrder = getSelectedOrder();
  const selectedSubmodel = getSelectedSubmodel();

  return (
    <div className="mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between space-x-4 flex-wrap">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Buyurtma biriktirish
        </h1>
        <div>
          {groupName && (
            <p className="text-muted-foreground mt-1">
              <span className="font-medium">{groupName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Buyurtma ma'lumotlari</span>
            </CardTitle>
            <CardDescription>
              {groupName} ga biriktirilishi kerak bo'lgan buyurtmani tanlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Selection */}
              <div className="space-y-2">
                <Label htmlFor="order">Buyurtma</Label>
                <Popover open={orderComboOpen} onOpenChange={setOrderComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={orderComboOpen}
                      className="w-full justify-between"
                    >
                      {selectedOrderId
                        ? selectedOrder?.name
                        : "Buyurtmani tanlang..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buyurtma qidirish..." />
                      <CommandList>
                        <CommandEmpty>Buyurtma topilmadi.</CommandEmpty>
                        <CommandGroup>
                          {unassignedOrders
                            ?.sort((a, b) => a.name.localeCompare(b.name))
                            ?.map((order) => (
                              <CommandItem
                                key={order.id}
                                value={order.name}
                                onSelect={() => {
                                  setSelectedOrderId(order.id.toString());
                                  setSelectedSubmodelId("");
                                  setOrderComboOpen(false);
                                }}
                                className="flex flex-col items-start space-y-1 p-3"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">
                                    {order.name}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs text-white hover:bg-transparent hover:text-black",
                                      statuses[order.status]?.color
                                    )}
                                  >
                                    {statuses[order.status]?.text}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{order.quantity} ta</span>
                                  <span>
                                    {order?.order_model?.submodels
                                      ?.map(
                                        (submodel) => submodel.submodel.name
                                      )
                                      .join(", ")}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedOrderId === order.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Submodel Selection */}
              {selectedOrderId && (
                <div className="space-y-2">
                  <Label htmlFor="submodel">Submodel</Label>
                  <Popover
                    open={submodelComboOpen}
                    onOpenChange={setSubmodelComboOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={submodelComboOpen}
                        className="w-full justify-between"
                      >
                        {selectedSubmodelId
                          ? selectedSubmodel?.submodel?.name
                          : "Submodelni tanlang..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Submodel qidirish..." />
                        <CommandList>
                          <CommandEmpty>Submodel topilmadi.</CommandEmpty>
                          <CommandGroup>
                            {selectedOrder?.order_model?.submodels?.map(
                              (sub) => (
                                <CommandItem
                                  key={sub.id}
                                  value={sub.submodel.name}
                                  onSelect={() => {
                                    setSelectedSubmodelId(sub.id.toString());
                                    setSubmodelComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedSubmodelId === sub.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {sub.submodel.name}
                                </CommandItem>
                              )
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Qo'shish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Information Card */}
        {selectedOrder && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Tanlangan buyurtma</span>
              </CardTitle>
              <CardDescription>
                Tanlangan buyurtma haqida batafsil ma'lumot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Buyurtma nomi:
                  </span>
                  <span className="font-semibold">{selectedOrder.name}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Miqdor:
                  </span>
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Package className="h-3 w-3" />
                    <span>{selectedOrder.quantity} ta</span>
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Holat:
                  </span>
                  <Badge
                    className={cn(
                      "text-white",
                      statuses[selectedOrder.status]?.color
                    )}
                  >
                    {statuses[selectedOrder.status]?.text}
                  </Badge>
                </div>

                {selectedSubmodel && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Tanlangan submodel:
                      </span>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-semibold">
                          {selectedSubmodel.submodel.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlanAdd;
