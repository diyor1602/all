import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Loader2,
  ChevronDown,
  Package,
  CalendarDays,
  FileText,
  User,
} from "lucide-react";

const OwnDamages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [openEmployees, setOpenEmployees] = useState({});
  const [openOrders, setOpenOrders] = useState({});

  const getDamages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groupMaster/qualityControls");
      setDamages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDamages();
  }, []);

  const groupedDamages = useMemo(() => {
    const sortedEmployees = [...damages].sort(
      (a, b) =>
        (b?.quality_controls?.length || 0) - (a?.quality_controls?.length || 0),
    );

    return sortedEmployees.map((employee, employeeIndex) => {
      const orderMap = {};

      (employee?.quality_controls || []).forEach((damage, damageIndex) => {
        const orderId = damage?.order?.id || `unknown-order-${damageIndex}`;
        const orderName = damage?.order?.name || "Buyurtma nomi yo'q";
        const submodelName =
          damage?.order?.order_model?.sub_models?.[0]?.submodel?.name ||
          "Model nomi yo'q";

        if (!orderMap[orderId]) {
          orderMap[orderId] = {
            orderId,
            orderName,
            submodelName,
            items: [],
          };
        }

        orderMap[orderId].items.push(damage);
      });

      const orders = Object.values(orderMap).sort(
        (a, b) => b.items.length - a.items.length,
      );

      return {
        ...employee,
        employeeKey: employee?.id || `employee-${employeeIndex}`,
        orders,
      };
    });
  }, [damages]);

  useEffect(() => {
    const initialEmployeeState = {};
    const initialOrderState = {};

    groupedDamages.forEach((employee) => {
      const employeeKey = employee.employeeKey;
      initialEmployeeState[employeeKey] = false;

      employee.orders.forEach((order) => {
        initialOrderState[`${employeeKey}-${order.orderId}`] = false;
      });
    });

    setOpenEmployees(initialEmployeeState);
    setOpenOrders(initialOrderState);
  }, [groupedDamages]);

  const toggleEmployee = (employeeKey) => {
    setOpenEmployees((prev) => ({
      ...prev,
      [employeeKey]: !prev[employeeKey],
    }));
  };

  const toggleOrder = (orderKey) => {
    setOpenOrders((prev) => ({
      ...prev,
      [orderKey]: !prev[orderKey],
    }));
  };

  const openImagePreview = (img) => {
    setSelectedImage(img);
    setOpen(true);
  };

  return (
    <div>
      {loading ? (
        <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
          Yuklanmoqda...
        </div>
      ) : groupedDamages?.length === 0 ? (
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-sm text-muted-foreground">
            Hozircha ma'lumot yo'q
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groupedDamages.map((employee) => {
            const employeeKey = employee.employeeKey;
            const isEmployeeOpen = openEmployees[employeeKey];

            return (
              <div
                key={employeeKey}
                className="rounded-2xl border bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleEmployee(employeeKey)}
                  className="w-full p-3 sm:p-4 flex items-center gap-3 text-left active:scale-[0.99] transition"
                >
                  {employee?.img ? (
                    <img
                      src={employee.img}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 border"
                      onClick={(e) => {
                        e.stopPropagation();
                        openImagePreview(employee.img);
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-base font-semibold text-gray-700">
                      {employee?.name?.charAt(0) || "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {employee?.name || "Nomsiz xodim"}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {employee?.orders?.length || 0} buyurtma
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                      {employee?.quality_controls?.length || 0} ta zarar
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        isEmployeeOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isEmployeeOpen && (
                  <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t bg-gray-50/50">
                    <div className="space-y-3 pt-3">
                      {employee.orders.map((order) => {
                        const orderKey = `${employeeKey}-${order.orderId}`;
                        const isOrderOpen = openOrders[orderKey];

                        return (
                          <div
                            key={orderKey}
                            className="rounded-xl border bg-white overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleOrder(orderKey)}
                              className="w-full p-3 flex items-start gap-3 text-left"
                            >
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Package size={18} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-base break-words">
                                  {order.orderName}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                  {order.submodelName}
                                </div>
                                <div className="mt-2 inline-flex px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                                  {order.items.length} ta
                                </div>
                              </div>

                              <ChevronDown
                                className={`w-5 h-5 mt-1 shrink-0 transition-transform ${
                                  isOrderOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {isOrderOpen && (
                              <div className="px-3 pb-3 border-t bg-white">
                                <div className="space-y-3 pt-3">
                                  {order.items.map((q, index) => (
                                    <div
                                      key={q?.id || index}
                                      className="rounded-xl border p-3 bg-gray-50"
                                    >
                                      <div className="flex flex-col gap-3">
                                        {q?.image && (
                                          <img
                                            src={q.image}
                                            alt="damage"
                                            className="w-full h-40 sm:h-48 object-cover rounded-xl border cursor-pointer"
                                            onClick={() =>
                                              openImagePreview(q.image)
                                            }
                                          />
                                        )}

                                        <div className="space-y-2">
                                          {q?.stage_tarification?.name && (
                                            <div className="inline-flex max-w-full px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium break-words">
                                              {q.stage_tarification.name}
                                            </div>
                                          )}

                                          {q?.description && (
                                            <div className="flex items-start gap-2 text-sm text-gray-700">
                                              <FileText
                                                size={16}
                                                className="mt-0.5 shrink-0 text-gray-400"
                                              />
                                              <p className="break-words">
                                                {q.description}
                                              </p>
                                            </div>
                                          )}

                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <CalendarDays
                                              size={15}
                                              className="shrink-0"
                                            />
                                            <span>
                                              {q?.created_at
                                                ? new Date(
                                                    q.created_at,
                                                  ).toLocaleDateString("ru-RU")
                                                : "Sana yo'q"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <User
                                              size={15}
                                              className="shrink-0"
                                            />
                                            <span>
                                              {q?.created_by?.employee?.name ||
                                                "Noma'lum"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl p-2 sm:p-4">
              <div className="w-full max-h-[80vh] overflow-auto rounded-lg">
                <img
                  src={selectedImage}
                  alt="preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default OwnDamages;
