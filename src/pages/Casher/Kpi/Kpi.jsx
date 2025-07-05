import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loadingGroupPlans, setLoadingGroupPlans] = useState(false);

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
      await api.post("/casher/groupPlans", payload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh plani qo'shildi",
        variant: "default",
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
      });
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
              disabled={loading}
            >
              {loading ? "Yuklanmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="w-fit bg-white"
      />
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
                            setAddPayload({
                              group_id: group.id,
                              quantity: null,
                              group_name: group.name,
                            });
                            setAddDialogOpen(true);
                          }}
                          className="w-full backdrop-blur-sm h-fit rounded-lg p-3 block bg-gray-200 cursor-pointer"
                        >
                          <h4 className="font-medium">{group.name}</h4>
                          {group.responsible_user?.employee && (
                            <div className="mt-1 text-sm flex items-center">
                              <User className="w-3.5 h-3.5 mr-1.5" />
                              {group.responsible_user.employee.name}
                            </div>
                          )}
                          <div className="mt-1 text-sm flex items-center gap-1">
                            <span>Miqdori:</span>{" "}
                            <span className="font-semibold">
                              {groupPlans?.find(
                                (plan) => plan.group_id === group.id
                              )?.quantity || 0}{" "}
                            </span>
                            ta
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
