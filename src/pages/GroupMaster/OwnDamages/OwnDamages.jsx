import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Loader2,
  ChevronDown,
  Package,
  CalendarDays,
  FileText,
  User,
  UserPen,
  Search,
  CheckCheck,
} from "lucide-react";

const OwnDamages = () => {
  const { toast } = useToast();

  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [openEmployees, setOpenEmployees] = useState({});
  const [openOrders, setOpenOrders] = useState({});
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDamage, setSelectedDamage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sending, setSending] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

  const getEmployees = async () => {
    if (debouncedSearchTerm.length < 2) return;
    try {
      const res = await api.get("/groupMaster/employees", {
        params: {
          search: debouncedSearchTerm,
          status: "working",
        },
      });
      setSearchResults(res.data?.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlar ma'lumotlari yuklanmadi",
      });
      return [];
    }
  };

  useEffect(() => {
    getEmployees();
  }, [debouncedSearchTerm]);

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

  const handleSaveEmployee = async () => {
    setSending(true);
    try {
      await api.patch(`/groupMaster/qualityControls/${selectedDamage?.id}`, {
        employee_id: selectedEmployee?.id,
      });
      toast({
        title: "Xodim saqlandi",
        duration: 1000,
      });
      setEmployeeDialogOpen(false);
      getDamages();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Saqlashda xatolik yuz berdi",
      });
    } finally {
      setSending(false);
    }
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
                                      className="rounded-xl border p-3 bg-gray-50 relative"
                                    >
                                      <div className="flex flex-col gap-3">
                                        {q?.image && (
                                          <div className="relative">
                                            <img
                                              src={q.image}
                                              alt="damage"
                                              className="w-full h-40 sm:h-48 object-cover rounded-xl border cursor-pointer"
                                              onClick={() =>
                                                openImagePreview(q.image)
                                              }
                                            />
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className={`absolute top-2 left-2 ${
                                                !q?.stage_tarification?.id
                                                  ? "bg-red-500 text-white hover:bg-red-600 hover:text-white"
                                                  : "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                                              } border-none outline-none`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (
                                                  !q?.stage_tarification?.id
                                                ) {
                                                  alert(
                                                    "Tarifikatsiya kiritilmagan. Texnologga murojaat qiling",
                                                  );
                                                  return;
                                                }
                                                setSelectedDamage(q);
                                                setSelectedEmployee(
                                                  q?.employee,
                                                );
                                                setSearchTerm("");
                                                setEmployeeDialogOpen(true);
                                              }}
                                            >
                                              <UserPen />
                                            </Button>
                                          </div>
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

          {/* Employee Selection Dialog */}
          <Dialog
            open={employeeDialogOpen}
            onOpenChange={setEmployeeDialogOpen}
          >
            <DialogContent
              className="
      w-[100vw] 
      max-w-lg 
      p-4 sm:p-6
      max-h-[90vh] 
      overflow-hidden
      rounded-xl
    "
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Xodimni tanlash
                </DialogTitle>
                <p className="text-xs sm:text-sm text-slate-500 break-words">
                  {selectedDamage?.order?.name} -{" "}
                  {selectedDamage?.stage_tarification?.name}
                </p>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className="space-y-4 overflow-y-auto pr-1 max-h-[65vh]">
                {/* Search Input */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <Input
                    placeholder="Xodimni qidirish (kamida 2 harf)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm focus-visible:ring-0"
                  />
                </div>

                {/* Selected Employee */}
                {selectedEmployee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedEmployee?.img ? (
                          <img
                            src={selectedEmployee?.img}
                            alt="Employee"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {selectedEmployee?.name?.charAt(0)?.toUpperCase() ||
                              "X"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate text-sm">
                            {selectedEmployee?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Tanlangan xodim
                          </p>
                        </div>
                      </div>
                      <CheckCheck className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {debouncedSearchTerm.length >= 2 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      Qidiruv natijalari
                    </p>

                    <div className="max-h-56 overflow-y-auto border rounded-lg">
                      {searchResults.length > 0 ? (
                        searchResults.map((searchResult) => (
                          <div
                            key={searchResult.id}
                            onClick={() => setSelectedEmployee(searchResult)}
                            className={`px-3 py-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                              selectedEmployee?.id === searchResult.id
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : ""
                            }`}
                          >
                            {searchResult?.img ? (
                              <img
                                src={searchResult?.img}
                                alt="Employee"
                                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                                {searchResult?.name?.charAt(0)?.toUpperCase() ||
                                  "X"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate text-sm">
                                {searchResult?.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                ID: {searchResult?.id}
                              </p>
                            </div>
                            {selectedEmployee?.id === searchResult.id && (
                              <CheckCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-6 text-center text-slate-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">Xodimlar topilmadi</p>
                          <p className="text-xs mt-1">
                            Boshqa kalit so'zlar bilan urinib ko'ring
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty States */}
                {debouncedSearchTerm.length < 2 && searchTerm.length > 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Kamida 2 harf kiriting</p>
                  </div>
                )}

                {!searchTerm && (
                  <div className="text-center py-6 text-slate-500">
                    <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Xodimlarni qidiring</p>
                    <p className="text-xs mt-1">
                      Ism yoki familiyasini kiriting
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEmployeeDialogOpen(false)}
                  className="w-full text-sm"
                  disabled={sending}
                >
                  Bekor qilish
                </Button>

                <Button
                  onClick={handleSaveEmployee}
                  disabled={sending || !selectedEmployee}
                  className="w-full text-sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Saqlash
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default OwnDamages;
