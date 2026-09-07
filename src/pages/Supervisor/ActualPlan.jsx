import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  "grid-cols-[24px_32px_180px_70px_80px_100px_80px_80px_120px_120px_140px] min-w-max";

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

const QueueRow = ({ item, index, disabled }) => {
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
        isDragging && "relative z-10 bg-blue-50 shadow-lg rounded-md",
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
            "whitespace-nowrap rounded-full px-2 py-1 text-white",
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
    </div>
  );
};

const ActualPlan = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reorderingGroupId, setReorderingGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(() => {
    const stored = localStorage.getItem("actualPlanSelectedGroup");
    return stored === "all" ? "all" : stored ? Number(stored) : "all";
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      setDepartmentsLoading(true);
      try {
        const response = await api.get("/supervisor/departments");
        const fetchedDepartments = response.data || [];

        setDepartments(fetchedDepartments);

        const selectedDept = fetchedDepartments.find((dept) =>
          keywords.some((keyword) =>
            dept.name?.toLowerCase().includes(keyword.toLowerCase()),
          ),
        );

        if (selectedDept) {
          setSelectedDepartment(String(selectedDept.id));
        }
      } catch (error) {
        handleError(error, "Bo'limlarni olishda xatolik yuz berdi!");
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  const fetchQueue = async () => {
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
  };

  useEffect(() => {
    if (!selectedDepartment) return;
    fetchQueue();
  }, [selectedDepartment]);

  const findGroupByItemId = (itemId) =>
    department?.groups?.find((g) =>
      g.orders?.some((o) => String(o.id) === String(itemId)),
    );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = findGroupByItemId(active.id);
    const overGroup = findGroupByItemId(over.id);
    if (!group || !overGroup || group.id !== overGroup.id) return;

    const orderedBefore = buildOrderedQueue(group.orders);
    const sourceIndex = orderedBefore.findIndex(
      (o) => String(o.id) === String(active.id),
    );
    const destinationIndex = orderedBefore.findIndex(
      (o) => String(o.id) === String(over.id),
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
      patches.has(item.id) ? { ...item, ...patches.get(item.id) } : item,
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
        g.id === group.id ? { ...g, orders: updatedOrders } : g,
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

  const sortedGroups = department?.groups
    ?.slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleGroups = sortedGroups?.filter(
    (group) => selectedGroup === "all" || group.id === selectedGroup,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
          <ListOrdered className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Ish rejasi navbati</h1>
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
                  group.id.toString(),
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
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-auto text-xs">
                      <div
                        className={cn(
                          "grid gap-2 px-3 py-2 border-b bg-gray-50 font-medium text-gray-500",
                          COLUMNS,
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
    </div>
  );
};

export default ActualPlan;
