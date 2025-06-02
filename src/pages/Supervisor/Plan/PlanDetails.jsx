"use client";

import api from "@/utils/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Plus, Edit2 } from "lucide-react";
import { statuses } from "@/lib/status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PlanDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);

  // State for add order dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedSubmodelId, setSelectedSubmodelId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // State for edit order popover
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newGroupId, setNewGroupId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/supervisor/plans`, {
        params: {
          department_id: id,
        },
      });
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

  const fetchUnassignedOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/supervisor/orders/groups`);
      setUnassignedOrders(response.data);
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
    fetchUnassignedOrders();
  }, []);

  const handleChangePlan = async (order_id, submodel_id, group_id, number) => {
    try {
      setChanging(true);
      await api.post(`/supervisor/plans`, {
        order_id,
        submodel_id,
        group_id,
        number,
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
      fetchData();
      fetchUnassignedOrders();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtma planlanmagan",
        variant: "destructive",
      });
    } finally {
      setChanging(false);
    }
  };

  const isNumberAvailable = (groupId, number, excludeOrderId = null) => {
    const group = data?.groups?.find((g) => g.id === groupId);
    if (!group) return true;

    return !group.orders.some(
      (order) =>
        order.number === Number.parseInt(number) && order.id !== excludeOrderId
    );
  };

  const getSelectedOrder = () => {
    return unassignedOrders.find(
      (order) => order.id === Number.parseInt(selectedOrderId)
    );
  };

  const handleAddOrder = async () => {
    if (
      !selectedOrderId ||
      !selectedSubmodelId ||
      !orderNumber ||
      !selectedGroupId
    ) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    if (!isNumberAvailable(selectedGroupId, orderNumber)) {
      toast({
        title: "Xatolik",
        description: "Bu raqam allaqachon ishlatilgan. Boshqa raqam kiriting.",
        variant: "destructive",
      });
      return;
    }

    await handleChangePlan(
      Number.parseInt(selectedOrderId),
      Number.parseInt(selectedSubmodelId),
      selectedGroupId,
      Number.parseInt(orderNumber)
    );

    // Reset form
    setSelectedOrderId("");
    setSelectedSubmodelId("");
    setOrderNumber("");
    setSelectedGroupId(null);
    setAddDialogOpen(false);
  };

  const handleEditOrder = async () => {
    if (!newOrderNumber || !newGroupId) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    if (
      !isNumberAvailable(
        Number.parseInt(newGroupId),
        newOrderNumber,
        editingOrder?.id
      )
    ) {
      toast({
        title: "Xatolik",
        description: "Bu raqam allaqachon ishlatilgan. Boshqa raqam kiriting.",
        variant: "destructive",
      });
      return;
    }

    await handleChangePlan(
      editingOrder.order.id,
      editingOrder.order_submodel.id,
      Number.parseInt(newGroupId),
      Number.parseInt(newOrderNumber)
    );

    // Reset form
    setEditingOrder(null);
    setNewOrderNumber("");
    setNewGroupId("");
    setEditPopoverOpen(false);
  };

  const openAddDialog = (groupId) => {
    setSelectedGroupId(groupId);
    setAddDialogOpen(true);
  };

  const openEditPopover = (order, groupId) => {
    setEditingOrder(order);
    setNewOrderNumber(order.number.toString());
    setNewGroupId(groupId.toString());
    setEditPopoverOpen(true);
  };

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Planlar</h2>
        <div className="font-medium text-gray-500">{data?.name}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center w-full min-h-[calc(100vh-6rem)]">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <>
          {data?.groups?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {data?.groups
                  ?.sort((a, b) => a.name.localeCompare(b.name))
                  .map((group) => (
                    <div
                      key={group?.id}
                      className="bg-white p-4 rounded-lg shadow-md h-fit"
                    >
                      <div className="flex justify-between mb-4">
                        <div className="text-lg font-semibold">
                          {group?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Buyurtmalar: {group?.orders?.length}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddDialog(group.id)}
                            disabled={changing}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="overflow-auto">
                        <table className="table border-collapse border w-full whitespace-nowrap">
                          <thead>
                            <tr>
                              <th className="border p-2">№</th>
                              <th className="border p-2">Buyurtma nomi</th>
                              <th className="border p-2">Miqdori</th>
                              <th className="border p-2">Submodellar</th>
                              <th className="border p-2">Status</th>
                              <th className="border p-2">Amallar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group?.orders
                              ?.sort((a, b) => a?.number - b?.number)
                              .map((order, index) => (
                                <tr key={index}>
                                  <td className="border text-center p-2">
                                    {order?.number}
                                  </td>
                                  <td className="border p-2">
                                    {order?.order?.name}
                                  </td>
                                  <td className="border p-2">
                                    {order?.order?.quantity}
                                  </td>
                                  <td className="border p-2">
                                    {order?.order_submodel?.submodel?.name}
                                  </td>
                                  <td className="border p-2">
                                    <span
                                      className={cn(
                                        statuses[order?.order?.status]?.color,
                                        "px-2 py-1 rounded-full text-xs text-white"
                                      )}
                                    >
                                      {statuses[order?.order?.status]?.text}
                                    </span>
                                  </td>
                                  <td className="border p-2 text-center">
                                    <Popover
                                      open={
                                        editPopoverOpen &&
                                        editingOrder?.id === order.id
                                      }
                                      onOpenChange={setEditPopoverOpen}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            openEditPopover(order, group.id)
                                          }
                                          disabled={changing}
                                        >
                                          <Edit2 size={10} />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80">
                                        <div className="grid gap-4">
                                          <div className="space-y-2">
                                            <h4 className="font-medium leading-none">
                                              Buyurtmani tahrirlash
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              Buyurtma raqami va guruhini
                                              o'zgartiring
                                            </p>
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="newNumber">
                                              Yangi raqam
                                            </Label>
                                            <Input
                                              id="newNumber"
                                              type="number"
                                              value={newOrderNumber}
                                              onChange={(e) =>
                                                setNewOrderNumber(
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Buyurtma raqami"
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="newGroup">
                                              Yangi guruh
                                            </Label>
                                            <Select
                                              value={newGroupId}
                                              onValueChange={setNewGroupId}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Guruhni tanlang" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {data?.groups?.map((g) => (
                                                  <SelectItem
                                                    key={g.id}
                                                    value={g.id.toString()}
                                                  >
                                                    {g.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <Button
                                            onClick={handleEditOrder}
                                            disabled={changing}
                                          >
                                            {changing && (
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Saqlash
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-bold mb-4">
                  Biriktirilmagan buyurtmalar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {unassignedOrders?.map((order, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg shadow-md",
                        statuses[order?.status]?.secondaryBg
                      )}
                    >
                      <p className="font-medium">{order?.name}</p>
                      <p className="text-sm text-gray-600">
                        Miqdor: {order?.quantity}
                      </p>
                      <p className="text-sm text-gray-600 my-2">
                        <span
                          className={cn(
                            statuses[order?.status]?.color,
                            "px-2 py-1 rounded-full text-xs text-white"
                          )}
                        >
                          {statuses[order?.status]?.text}
                        </span>
                      </p>
                      <div className="mt-2">
                        {order?.order_model?.submodels?.map((sub, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            • {sub?.submodel?.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>Ma'lumotlar mavjud emas</div>
          )}
        </>
      )}

      {/* Add Order Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buyurtma qo'shish</DialogTitle>
            <DialogDescription>
              Guruhga yangi buyurtma qo'shing. Barcha maydonlarni to'ldiring.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="order">Buyurtma</Label>
              <Select
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Buyurtmani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.name} ({order.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrderId && (
              <div className="grid gap-2">
                <Label htmlFor="submodel">Submodel</Label>
                <Select
                  value={selectedSubmodelId}
                  onValueChange={setSelectedSubmodelId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Submodelni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectedOrder()?.order_model?.submodels?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.submodel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="number">Buyurtma raqami</Label>
              <Input
                id="number"
                type="number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Buyurtma raqamini kiriting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAddOrder} disabled={changing}>
              {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanDetails;
