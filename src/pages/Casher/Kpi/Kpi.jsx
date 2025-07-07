import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  User,
  Target,
  Users,
  ClipboardList,
  ListChecks,
  CirclePercent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Array of Tailwind CSS background color classes
const groupColors = [
  "bg-blue-200 hover:bg-blue-300",
  "bg-green-200 hover:bg-green-300",
  "bg-yellow-200 hover:bg-yellow-300",
  "bg-red-200 hover:bg-red-300",
  "bg-purple-200 hover:bg-purple-300",
  "bg-pink-200 hover:bg-pink-300",
  "bg-indigo-200 hover:bg-indigo-300",
  "bg-teal-200 hover:bg-teal-300",
  "bg-orange-200 hover:bg-orange-300",
  "bg-cyan-200 hover:bg-cyan-300",
];

const Kpi = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [groupPlans, setGroupPlans] = useState([]);
  const [addPayload, setAddPayload] = useState({
    group_id: null,
    group_name: null,
    quantity: null,
    month: month?.split("-")[1],
    year: month?.split("-")[0],
  });
  const [editPayload, setEditPayload] = useState({
    id: null,
    group_id: null,
    group_name: null,
    quantity: null,
    month: month?.split("-")[1],
    year: month?.split("-")[0],
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loadingGroupPlans, setLoadingGroupPlans] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchGroupPlans = async () => {
    setLoadingGroupPlans(true);
    try {
      const response = await api.get("/casher/groupPlans", {
        params: {
          year: month?.split("-")[0],
          month: month?.split("-")[1],
        },
      });
      setGroupPlans(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setLoadingGroupPlans(false);
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get("/casher/departments");
      const depts = response.data?.flatMap((item) => item?.departments) || [];
      // Sort groups by name
      const sortedDepts = depts.map((dept) => ({
        ...dept,
        groups: dept.groups?.sort((a, b) => a.name.localeCompare(b.name)),
      }));
      setDepartments(sortedDepts);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchGroupPlans();
  }, [month]);

  const handleAddGroupPlan = async () => {
    const payload = {
      group_id: addPayload.group_id,
      quantity: addPayload.quantity,
      month: parseInt(month?.split("-")[1]),
      year: parseInt(month?.split("-")[0]),
    };
    try {
      setSending(true);
      await api.post("/casher/groupPlans", payload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh plani qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });
      setAddDialogOpen(false);
      setAddPayload({
        group_id: null,
        group_name: null,
        quantity: null,
        month: month?.split("-")[1],
        year: month?.split("-")[0],
      });
      await fetchGroupPlans();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
        duration: 1200,
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditGroupPlan = async () => {
    const payload = {
      group_id: editPayload.group_id,
      quantity: parseFloat(editPayload.quantity),
      month: parseInt(month?.split("-")[1]),
      year: parseInt(month?.split("-")[0]),
    };
    try {
      setSending(true);
      await api.patch(`/casher/groupPlans/${editPayload.id}`, payload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh plani yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });
      setEditDialogOpen(false);
      setEditPayload({
        id: null,
        group_id: null,
        group_name: null,
        quantity: null,
        month: month?.split("-")[1],
        year: month?.split("-")[0],
      });
      await fetchGroupPlans();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
        duration: 1200,
      });
    } finally {
      setSending(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addPayload.group_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Input
              type="number"
              placeholder="Miqdor"
              value={addPayload.quantity}
              onChange={(e) =>
                setAddPayload({ ...addPayload, quantity: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddGroupPlan}
              disabled={sending}
            >
              {sending ? "Yuklanmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPayload.group_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Input
              type="number"
              placeholder="Miqdor"
              value={editPayload.quantity}
              onChange={(e) =>
                setEditPayload({ ...editPayload, quantity: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleEditGroupPlan}
              disabled={sending}
            >
              {sending ? "Yuklanmoqda..." : "Yangilash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center mb-4">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-fit bg-white"
        />
        <div className="bg-white p-2 rounded-lg shadow-md">
          <span className="font-medium">Jami: </span>
          <span className="font-bold text-blue-600">
            {groupPlans
              .reduce((sum, plan) => sum + (parseFloat(plan.quantity) || 0), 0)
              .toLocaleString("ru-RU")}
          </span>
          <span> ta</span>
        </div>
      </div>
      {departments?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Hech qanday bo'lim topilmadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mt-4 bg-white">
          {departments
            ?.filter((dept) => dept?.groups?.length > 0)
            ?.sort((a, b) => b?.groups?.length - a?.groups?.length)
            .map((department) => (
              <div
                key={department?.id}
                className={
                  "group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform h-fit flex flex-col" +
                  (loadingGroupPlans ? " cursor-not-allowed opacity-50" : "")
                }
              >
                <div className="relative p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg inline-block">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold line-clamp-2">
                      {department?.name}
                    </h3>
                  </div>

                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {department?.groups?.length > 0 ? (
                      department.groups.map((group) => (
                        <div
                          key={group.id}
                          onClick={() => {
                            const plan = groupPlans?.find(
                              (plan) => plan.group_id === group.id
                            );
                            if (plan) {
                              setEditPayload({
                                id: plan.id,
                                group_id: plan.group_id,
                                group_name: group.name,
                                quantity: plan.quantity,
                              });
                              setEditDialogOpen(true);
                            } else {
                              setAddPayload({
                                group_id: plan.group_id,
                                quantity: null,
                                group_name: group.name,
                              });
                              setAddDialogOpen(true);
                            }
                          }}
                          className={`w-full h-full rounded-xl p-4 transition-all duration-300 transform cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                            groupColors[group.id % groupColors.length] ||
                            "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white/50 rounded-lg">
                                <Users className="w-5 h-5" />
                              </div>
                              <h4 className="font-semibold text-gray-800">
                                {group.name}
                              </h4>
                            </div>
                            <div className="p-1.5 bg-white/50 rounded-full">
                              <Target className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>

                          {group.responsible_user?.employee && (
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <div className="flex items-center bg-white/50 px-2 py-1 rounded-full">
                                <User className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                <span className="text-xs">
                                  {group.responsible_user.employee.name}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Plan:
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-lg text-blue-600">
                                  {parseFloat(
                                    groupPlans?.find(
                                      (plan) => plan.group_id === group.id
                                    )?.quantity || 0
                                  ).toLocaleString("ru-RU")}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ta
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Bajarilgan:
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-lg text-blue-600">
                                  {parseFloat(
                                    groupPlans?.find(
                                      (plan) => plan.group_id === group.id
                                    )?.monthly_total || 0
                                  ).toLocaleString("ru-RU")}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ta
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CirclePercent className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Foiz:
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-lg text-blue-600">
                                  {(() => {
                                    const plan = groupPlans?.find(
                                      (p) => p.group_id === group.id
                                    );
                                    if (
                                      !plan ||
                                      !plan.quantity ||
                                      plan.quantity === "0" ||
                                      plan.quantity === 0
                                    ) {
                                      return "0.00";
                                    }
                                    const monthlyTotal = parseFloat(
                                      plan.monthly_total || 0
                                    );
                                    const quantity = parseFloat(plan.quantity);
                                    return (
                                      (monthlyTotal / quantity) *
                                      100
                                    ).toFixed(2);
                                  })()}
                                </span>
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4text-sm">
                        Guruhlar mavjud emas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default Kpi;
