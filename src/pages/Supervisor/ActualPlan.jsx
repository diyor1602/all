import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  GripVertical,
  Users,
  Scissors,
  Warehouse,
  Shirt,
  Layers,
  Hourglass,
  CalendarClock,
  ListOrdered,
  LayoutGrid,
  Plus,
  Move,
  Check,
  Search,
  Package,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { statuses } from "@/lib/status";

const keywords = ["tikuv", "тикув"];

const COLUMNS =
  "grid-cols-[24px_32px_180px_70px_80px_100px_80px_80px_120px_120px_140px_36px] min-w-max";

// previous_order_id / next_order_id point to sibling orders' order.id (not the pivot row id)
const buildOrderedQueue = (orders = []) => {
  if (!orders.length) return [];

  const byOrderId = new Map(orders.map((item) => [item.order?.id, item]));
  const head = orders.find((item) => item.previous_order_id === null);

  const ordered = [];
  const seen = new Set();
  let current = head;

  while (current && !seen.has(current.order?.id)) {
    ordered.push(current);
    seen.add(current.order?.id);
    current = current.next_order_id
      ? byOrderId.get(current.next_order_id)
      : null;
  }

  orders.forEach((item) => {
    if (!seen.has(item.order?.id)) ordered.push(item);
  });

  return ordered;
};

const MoveGroupPopover = ({ item, groups, currentGroupId, onMoved }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newGroupId, setNewGroupId] = useState("");
  const [changing, setChanging] = useState(false);

  const handleChangeGroup = async () => {
    if (!newGroupId) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Guruhni tanlang",
      });
      return;
    }

    setChanging(true);
    try {
      await api.post("/supervisor/plans", {
        order_id: item.order.id,
        submodel_id: item.order_submodel.id,
        group_id: Number(newGroupId),
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh o'zgartirildi",
        style: { backgroundColor: "green", color: "white" },
      });
      setOpen(false);
      setNewGroupId("");
      onMoved();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Guruhni o'zgartirishda xatolik yuz berdi!",
      });
    } finally {
      setChanging(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setNewGroupId("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-gray-400 hover:text-indigo-600"
        >
          <Move className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {item.order?.name} ni boshqa guruhga ko'chirish
          </p>
          <div className="grid gap-2">
            <Label htmlFor="newGroup">Yangi guruh</Label>
            <Select value={newGroupId} onValueChange={setNewGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  ?.filter((g) => g.id !== currentGroupId)
                  .map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleChangeGroup} disabled={changing}>
            {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ko'chirish
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const QueueRow = ({ item, index, disabled, groups, currentGroupId, onMoved }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(item.id), disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid gap-2 px-3 py-2.5 border-b border-l-4 items-center bg-white transition-colors hover:bg-gray-50",
        COLUMNS,
        statuses[item.order?.status]?.border,
        isDragging && "relative z-10 bg-blue-50 shadow-lg rounded-md"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 transition-colors hover:text-indigo-500 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="font-semibold text-gray-400">{index + 1}</div>
      <div className="truncate font-medium text-gray-800">
        {item.order?.name}
      </div>
      <div>{item.order?.quantity}</div>
      <div>{item.cut_quantity}</div>
      <div>{item.warehouse_completed_quantity}</div>
      <div>{item.order_submodel?.sewing_quantity}</div>
      <div className="font-medium text-orange-600">
        {item.order_submodel?.remaining_quantity}
      </div>
      <div className="truncate">{item.order_submodel?.submodel?.name}</div>
      <div>
        <span
          className={cn(
            statuses[item.order?.status]?.color,
            "whitespace-nowrap rounded-full px-2 py-1 text-white"
          )}
        >
          {statuses[item.order?.status]?.text}
        </span>
      </div>
      <div className="text-gray-600">
        {item.forecast_days ? (
          <div className="flex items-center gap-1">
            <Hourglass className="h-3 w-3 text-indigo-400" />
            {item.forecast_days} kun
          </div>
        ) : null}
        {item.forecast_finish_date && (
          <div className="flex items-center gap-1 text-gray-400">
            <CalendarClock className="h-3 w-3" />
            {item.forecast_finish_date?.split("-").reverse().join(".")}
          </div>
        )}
      </div>
      <div>
        <MoveGroupPopover
          item={item}
          groups={groups}
          currentGroupId={currentGroupId}
          onMoved={onMoved}
        />
      </div>
    </div>
  );
};

const ActualPlan = () => {
  const { toast } = useToast();

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reorderingGroupId, setReorderingGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(() => {
    const stored = localStorage.getItem("actualPlanSelectedGroup");
    return stored === "all" ? "all" : stored ? Number(stored) : "all";
  });

  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [addGroupId, setAddGroupId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedSubmodelId, setSelectedSubmodelId] = useState("");
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleError = (error, defaultMessage) => {
    toast({
      variant: "destructive",
      title: "Xatolik!",
      description: error.response?.data?.message || defaultMessage,
    });
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/supervisor/departments");
        const fetchedDepartments = response.data || [];

        const selectedDept = fetchedDepartments.find((dept) =>
          keywords.some((keyword) =>
            dept.name?.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (selectedDept) {
          setSelectedDepartment(String(selectedDept.id));
        }
      } catch (error) {
        handleError(error, "Bo'limlarni olishda xatolik yuz berdi!");
      }
    };

    fetchDepartments();
  }, [toast]);

  const fetchQueue = useCallback(async () => {
    if (!selectedDepartment) return;
    setLoading(true);
    try {
      const response = await api.get("/supervisor/plans/queue", {
        params: { department_id: selectedDepartment },
      });
      setDepartment(response.data);
    } catch (error) {
      handleError(error, "Navbatni olishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  const fetchUnassignedOrders = useCallback(async () => {
    if (!selectedDepartment) return;
    try {
      const response = await api.get("/supervisor/orders/groups", {
        params: { department_id: selectedDepartment },
      });
      setUnassignedOrders(response.data || []);
    } catch (error) {
      handleError(error, "Buyurtmalarni olishda xatolik yuz berdi!");
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchQueue();
    fetchUnassignedOrders();
  }, [fetchQueue, fetchUnassignedOrders]);

  const findGroupByItemId = (itemId) =>
    department?.groups?.find((g) =>
      g.orders?.some((o) => String(o.id) === String(itemId))
    );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = findGroupByItemId(active.id);
    const overGroup = findGroupByItemId(over.id);
    if (!group || !overGroup || group.id !== overGroup.id) return;

    const orderedBefore = buildOrderedQueue(group.orders);
    const sourceIndex = orderedBefore.findIndex(
      (o) => String(o.id) === String(active.id)
    );
    const destinationIndex = orderedBefore.findIndex(
      (o) => String(o.id) === String(over.id)
    );
    if (sourceIndex === -1 || destinationIndex === -1) return;

    const oldPrev = orderedBefore[sourceIndex - 1];
    const oldNext = orderedBefore[sourceIndex + 1];

    const ordered = arrayMove(orderedBefore, sourceIndex, destinationIndex);
    const moved = ordered[destinationIndex];
    const newPrev = ordered[destinationIndex - 1];
    const newNext = ordered[destinationIndex + 1];

    // Repair the previous_order_id / next_order_id links locally so the
    // list stays correct on re-render, instead of only updating the moved
    // row (which left the old neighbors' links stale and snapped the
    // order back on the next render).
    const patches = new Map();
    const patch = (id, fields) => {
      if (id == null) return;
      patches.set(id, { ...(patches.get(id) || {}), ...fields });
    };

    patch(moved.id, {
      previous_order_id: newPrev ? newPrev.order.id : null,
      next_order_id: newNext ? newNext.order.id : null,
    });
    if (oldPrev)
      patch(oldPrev.id, {
        next_order_id: oldNext ? oldNext.order.id : null,
      });
    if (oldNext)
      patch(oldNext.id, {
        previous_order_id: oldPrev ? oldPrev.order.id : null,
      });
    if (newPrev) patch(newPrev.id, { next_order_id: moved.order.id });
    if (newNext) patch(newNext.id, { previous_order_id: moved.order.id });

    const updatedOrders = group.orders.map((item) =>
      patches.has(item.id) ? { ...item, ...patches.get(item.id) } : item
    );

    const payload = {
      group_id: group.id,
      order_id: moved.order.id,
      previous_order_id: newPrev ? newPrev.order.id : null,
      next_order_id: newNext ? newNext.order.id : null,
    };

    setDepartment((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === group.id ? { ...g, orders: updatedOrders } : g
      ),
    }));

    setReorderingGroupId(group.id);
    try {
      await api.post("/supervisor/plans/queue", payload);
    } catch (error) {
      handleError(error, "Navbatni o'zgartirishda xatolik yuz berdi!");
      fetchQueue();
    } finally {
      setReorderingGroupId(null);
    }
  };

  const getSelectedOrder = useCallback(
    () => unassignedOrders.find((order) => order.id === Number(selectedOrderId)),
    [selectedOrderId, unassignedOrders]
  );

  const closeAddDialog = () => {
    setAddGroupId(null);
    setOrderSearch("");
    setSelectedOrderId("");
    setSelectedSubmodelId("");
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (!selectedOrderId || !selectedSubmodelId) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Barcha maydonlarni to'ldiring",
      });
      return;
    }

    setAdding(true);
    try {
      await api.post("/supervisor/plans", {
        order_id: Number(selectedOrderId),
        submodel_id: Number(selectedSubmodelId),
        group_id: addGroupId,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma guruhga biriktirildi",
        style: { backgroundColor: "green", color: "white" },
      });
      closeAddDialog();
      fetchQueue();
      fetchUnassignedOrders();
    } catch (error) {
      handleError(error, "Buyurtma qo'shishda xatolik yuz berdi!");
    } finally {
      setAdding(false);
    }
  };

  const filteredUnassignedOrders = unassignedOrders
    .filter((order) =>
      order.name?.toLowerCase().includes(orderSearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const sortedGroups = department?.groups
    ?.slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleGroups = sortedGroups?.filter(
    (group) => selectedGroup === "all" || group.id === selectedGroup
  );

  const addGroup = sortedGroups?.find((g) => g.id === addGroupId);
  const selectedOrder = getSelectedOrder();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
          <ListOrdered className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Ish rejasi navbati
        </h1>
      </div>

      {!loading && sortedGroups?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedGroup === "all" ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => {
              setSelectedGroup("all");
              localStorage.setItem("actualPlanSelectedGroup", "all");
            }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Barchasi
          </Button>
          {sortedGroups.map((group) => (
            <Button
              key={group.id}
              size="sm"
              variant={selectedGroup === group.id ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => {
                setSelectedGroup(group.id);
                localStorage.setItem(
                  "actualPlanSelectedGroup",
                  group.id.toString()
                );
              }}
            >
              <Layers className="h-3.5 w-3.5" />
              {group.name}
            </Button>
          ))}
        </div>
      )}

      {loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
              <p className="text-lg font-medium text-gray-600">
                Ma'lumotlar yuklanmoqda...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && department && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4">
            {visibleGroups?.map((group) => {
              const ordered = buildOrderedQueue(group.orders);
              const isReordering = reorderingGroupId === group.id;
              const ids = ordered.map((item) => String(item.id));

              return (
                <Card
                  key={group.id}
                  className="border-0 shadow-md overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600">
                        <Layers className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {group.name}
                      </h2>
                      {isReordering && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {group.avg_attendance ?? 0}
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm text-gray-700 font-medium">
                        <ListOrdered className="h-3.5 w-3.5 text-indigo-500" />
                        {ordered.length} ta
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 bg-white hover:bg-green-50 hover:text-green-600"
                        onClick={() => setAddGroupId(group.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-auto text-xs">
                      <div
                        className={cn(
                          "grid gap-2 px-3 py-2 border-b bg-gray-50 font-medium text-gray-500",
                          COLUMNS
                        )}
                      >
                        <div />
                        <div>№</div>
                        <div>Buyurtma nomi</div>
                        <div>Miqdor</div>
                        <div className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" /> Kesilgan
                        </div>
                        <div className="flex items-center gap-1">
                          <Warehouse className="h-3.5 w-3.5" /> Omborda
                        </div>
                        <div className="flex items-center gap-1">
                          <Shirt className="h-3.5 w-3.5" /> Tikilgan
                        </div>
                        <div>Qolgan</div>
                        <div>Submodel</div>
                        <div>Status</div>
                        <div className="flex items-center gap-1">
                          <Hourglass className="h-3.5 w-3.5" /> Prognoz
                        </div>
                        <div />
                      </div>

                      <SortableContext
                        items={ids}
                        strategy={verticalListSortingStrategy}
                        disabled={isReordering}
                      >
                        {ordered.map((item, index) => (
                          <QueueRow
                            key={item.id}
                            item={item}
                            index={index}
                            disabled={isReordering}
                            groups={sortedGroups}
                            currentGroupId={group.id}
                            onMoved={fetchQueue}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DndContext>
      )}

      <Dialog
        open={addGroupId !== null}
        onOpenChange={(value) => !value && closeAddDialog()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Buyurtma qo'shish
            </DialogTitle>
            <DialogDescription>
              {addGroup?.name} guruhiga biriktirilishi kerak bo'lgan
              buyurtmani tanlang
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddOrder} className="space-y-4">
            <div className="space-y-2">
              <Label>Buyurtma</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buyurtma qidirish..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
                {filteredUnassignedOrders.length === 0 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Buyurtma topilmadi.
                  </div>
                )}
                {filteredUnassignedOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id.toString();
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrderId(order.id.toString());
                        if (order?.order_model?.submodels?.length === 1) {
                          setSelectedSubmodelId(
                            order.order_model.submodels[0].id.toString()
                          );
                        } else {
                          setSelectedSubmodelId("");
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 p-3 hover:bg-gray-50",
                        isSelected && "bg-indigo-50 hover:bg-indigo-50"
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Check
                            className={cn(
                              "h-4 w-4 text-indigo-600",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {order.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs text-white",
                            statuses[order.status]?.color
                          )}
                        >
                          {statuses[order.status]?.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 pl-6 text-sm text-muted-foreground">
                        <span>{order.quantity} ta</span>
                        <span>
                          {order?.order_model?.submodels
                            ?.map((sub) => sub.submodel.name)
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedOrderId && (
              <div className="space-y-2">
                <Label>Submodel</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder?.order_model?.submodels?.map((sub) => {
                    const isSelected =
                      selectedSubmodelId === sub.id.toString();
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmodelId(sub.id.toString())}
                        className={cn(
                          "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {sub.submodel.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddDialog}
                disabled={adding}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={adding}
                className="bg-green-600 hover:bg-green-700"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Qo'shish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActualPlan;
