import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  User,
  Users,
  ClipboardList,
  ListChecks,
  Angry,
  Meh,
  Laugh,
  ChartNoAxesCombined,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { Info, AlertCircle, CheckCircle2 } from "lucide-react";

// Array of Tailwind CSS background color classes
const groupColors = [
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-red-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-indigo-300",
  "bg-teal-300",
  "bg-orange-300",
  "bg-cyan-300",
];

// Function to calculate working days between two dates (excluding Sundays)
const getWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0) {
      // 0 is Sunday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Function to analyze daily outputs and predict progress
const analyzeProgress = (plan) => {
  if (!plan.daily_outputs || plan.daily_outputs.length === 0) {
    return null;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Get the last date in daily outputs
  const sortedOutputs = [...plan.daily_outputs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const lastOutputDate = new Date(sortedOutputs[sortedOutputs.length - 1].date);
  const lastOutputDay = lastOutputDate.getDate();

  // Calculate working days passed and remaining
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);

  // Calculate working days passed (from start of month to last output day)
  const workingDaysPassed = getWorkingDays(
    startOfMonth,
    new Date(currentYear, currentMonth - 1, lastOutputDay)
  );

  // Calculate remaining working days (from tomorrow to end of month, excluding Sundays)
  const tomorrow = new Date(currentYear, currentMonth - 1, currentDay + 1);
  const workingDaysRemaining = getWorkingDays(tomorrow, endOfMonth);

  // Calculate current progress
  const completed = plan.monthly_total || 0;
  const target = plan.quantity;
  const remaining = Math.max(0, target - completed);

  // Calculate average daily output
  const avgDailyOutput = completed / workingDaysPassed;
  const projectedTotal = completed + avgDailyOutput * workingDaysRemaining;

  // Calculate required daily output to meet target
  const requiredDailyOutput = remaining / workingDaysRemaining;

  return {
    completed,
    target,
    remaining,
    progress: Math.min(100, Math.round((completed / target) * 100)),
    avgDailyOutput: parseInt((avgDailyOutput * 100) / 100),
    requiredDailyOutput: parseInt((requiredDailyOutput * 100) / 100),
    onTrack: projectedTotal >= target,
    workingDaysPassed,
    workingDaysRemaining,
    lastUpdated: lastOutputDate.toLocaleDateString("ru-RU"),
  };
};

const calculatePreviousPlan = (month, year, plan, daily_outputs) => {
  if (!plan || !daily_outputs?.length) return [];

  // Get the first and last day of the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Calculate total working days in the month (excluding Sundays)
  let workingDays = 0;
  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    if (currentDate.getDay() !== 0) {
      // 0 is Sunday
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate daily target
  const dailyTarget = plan / workingDays;

  // Process each day's output
  return daily_outputs
    .map((day) => {
      const dayOfWeek = new Date(day.date).getDay();
      const isWeekend = dayOfWeek === 0; // Sunday

      // Skip weekends
      if (isWeekend) return null;

      // Calculate percentage of target achieved
      const percentage = (day.total_count / dailyTarget) * 100;

      // Determine status and color
      let status, color, icon;
      if (percentage >= 100) {
        status = "Ajoyib";
        color = "bg-green-100 text-green-800";
        icon = <Laugh size={16} />;
      } else if (percentage >= 80) {
        status = "Yaxshilash kerak";
        color = "bg-yellow-100 text-yellow-800";
        icon = <Meh size={16} />;
      } else {
        status = "Qoniqarsiz";
        color = "bg-red-100 text-red-800";
        icon = <Angry size={16} />;
      }

      return {
        ...day,
        dailyTarget: parseInt(dailyTarget),
        percentage: parseInt((percentage * 100) / 100),
        status,
        color,
        icon,
      };
    })
    .filter(Boolean) // Remove null values (weekends)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
};

// Function to calculate total progress across all groups
const calculateTotalProgress = (groupPlans, month) => {
  // Filter out groups without a plan (quantity is 0 or null/undefined)
  const groupsWithPlan = groupPlans.filter((plan) => plan.quantity > 0);

  if (!groupsWithPlan?.length) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Calculate working days in the month
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);
  const totalWorkingDays = getWorkingDays(startOfMonth, endOfMonth);

  // Calculate working days passed
  const workingDaysPassed = getWorkingDays(
    startOfMonth,
    new Date(currentYear, currentMonth - 1, currentDay)
  );

  const workingDaysRemaining = totalWorkingDays - workingDaysPassed;

  // Calculate totals across groups with plans
  const totals = groupsWithPlan.reduce(
    (acc, plan) => {
      acc.totalCompleted += parseFloat(plan.monthly_total || 0);
      acc.totalTarget += parseFloat(plan.quantity);
      return acc;
    },
    { totalCompleted: 0, totalTarget: 0 }
  );

  // Rest of the function remains the same...
  const remaining = Math.max(0, totals.totalTarget - totals.totalCompleted);
  const progress =
    totals.totalTarget > 0
      ? Math.min(
          100,
          Math.round((totals.totalCompleted / totals.totalTarget) * 100)
        )
      : 0;

  const avgDailyOutput =
    workingDaysPassed > 0 ? totals.totalCompleted / workingDaysPassed : 0;
  const requiredDailyOutput =
    workingDaysRemaining > 0 ? remaining / workingDaysRemaining : 0;
  const projectedTotal =
    totals.totalCompleted + avgDailyOutput * workingDaysRemaining;

  return {
    totalCompleted: parseInt(totals.totalCompleted),
    totalTarget: parseInt(totals.totalTarget),
    remaining: parseInt(remaining),
    progress,
    avgDailyOutput: parseInt((avgDailyOutput * 100) / 100),
    requiredDailyOutput: parseInt((requiredDailyOutput * 100) / 100),
    workingDaysPassed,
    workingDaysRemaining,
    onTrack: projectedTotal >= totals.totalTarget,
    lastUpdated: today.toLocaleDateString("ru-RU"),
    groupsWithPlanCount: groupsWithPlan.length, // Added to show how many groups are included
    totalGroups: groupPlans.length, // Added to show total number of groups
  };
};

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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [showTotalProgress, setShowTotalProgress] = useState(false);

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
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <div className="flex items-center justify-center max-w-[90vh] max-h-[90vh] overflow-auto">
            <img src={image} alt="-" className="w-full" />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              <div>
                Jami tikilgan:{" "}
                <span className="font-bold">
                  {groupPlans?.find(
                    (plan) => plan.group_id === selectedGroup?.id
                  )?.monthly_total || 0}
                </span>{" "}
                ta
              </div>
              <div>
                Jami plan:{" "}
                <span className="font-bold">
                  {groupPlans?.find(
                    (plan) => plan.group_id === selectedGroup?.id
                  )?.quantity || 0}
                </span>{" "}
                ta
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-2 max-h-[400px] overflow-y-auto">
            {(() => {
              const selectedPlan = groupPlans?.find(
                (plan) => plan.group_id === selectedGroup?.id
              );
              if (!selectedPlan) return null;

              const monthlyPlan = selectedPlan.quantity;
              const year = new Date(month + "-01").getFullYear();
              const monthNumber = new Date(month + "-01").getMonth() + 1;

              const dailyData = calculatePreviousPlan(
                monthNumber,
                year,
                monthlyPlan,
                selectedPlan.daily_outputs || []
              );

              return dailyData.map((day, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${day.color} border`}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {day.date?.split("-").reverse().join(".")}
                    </div>
                    <div className="text-xs opacity-75 flex items-center gap-1">
                      {day.icon} {day.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {day.total_count} /{" "}
                      <span className="text-xs opacity-50">
                        {day.dailyTarget}
                      </span>
                    </div>
                    <div className="text-xs">{day.percentage}%</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
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
      <Dialog open={showTotalProgress} onOpenChange={setShowTotalProgress}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Umumiy Kunlik Hisobot</DialogTitle>
            <DialogDescription>
              <div className="space-y-1">
                <div>
                  Jami tikilgan:{" "}
                  <span className="font-bold">
                    {calculateTotalProgress(
                      groupPlans,
                      month
                    )?.totalCompleted.toLocaleString() || 0}
                  </span>{" "}
                  ta
                </div>
                <div>
                  Jami plan:{" "}
                  <span className="font-bold">
                    {calculateTotalProgress(
                      groupPlans,
                      month
                    )?.totalTarget.toLocaleString() || 0}
                  </span>{" "}
                  ta
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {(() => {
              // Get all daily outputs from all groups
              const allDailyOutputs = groupPlans
                .filter((plan) => plan.quantity > 0)
                .flatMap((plan) =>
                  (plan.daily_outputs || []).map((output) => ({
                    ...output,
                    group_name:
                      departments
                        .flatMap((dept) => dept.groups)
                        .find((g) => g.id === plan.group_id)?.name ||
                      "Noma'lum",
                  }))
                );

              // Group by date
              const groupedByDate = allDailyOutputs.reduce((acc, output) => {
                if (!acc[output.date]) {
                  acc[output.date] = {
                    date: output.date,
                    total_count: 0,
                    groups: [],
                  };
                }
                acc[output.date].total_count += output.total_count;
                acc[output.date].groups.push({
                  group_name: output.group_name,
                  count: output.total_count,
                });
                return acc;
              }, {});

              // Calculate daily target
              const totalPlan = groupPlans
                .filter((plan) => plan.quantity > 0)
                .reduce((sum, plan) => sum + parseFloat(plan.quantity), 0);

              const workingDaysInMonth = getWorkingDays(
                new Date(
                  new Date(month + "-01").getFullYear(),
                  new Date(month + "-01").getMonth(),
                  1
                ),
                new Date(
                  new Date(month + "-01").getFullYear(),
                  new Date(month + "-01").getMonth() + 1,
                  0
                )
              );

              const dailyTarget = totalPlan / workingDaysInMonth;

              // Convert to array and sort by date
              const sortedDailyData = Object.values(groupedByDate)
                .map((day) => {
                  const percentage = (day.total_count / dailyTarget) * 100;
                  let status, color, icon;

                  if (percentage >= 100) {
                    status = "Ajoyib";
                    color = "bg-green-100 text-green-800";
                    icon = <Laugh size={16} />;
                  } else if (percentage >= 80) {
                    status = "Yaxshilash kerak";
                    color = "bg-yellow-100 text-yellow-800";
                    icon = <Meh size={16} />;
                  } else {
                    status = "Qoniqarsiz";
                    color = "bg-red-100 text-red-800";
                    icon = <Angry size={16} />;
                  }

                  return {
                    ...day,
                    dailyTarget: Math.round(dailyTarget),
                    percentage: Math.round(percentage),
                    status,
                    color,
                    icon,
                  };
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

              return (
                <div className="space-y-2">
                  {sortedDailyData?.map((day, index) => (
                    <div
                      key={index}
                      className={`flex flex-col p-3 rounded-lg border ${day.color}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {day.date.split("-").reverse().join(".")}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{day.status}</span>
                          {day.icon}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Jami:</span>
                        <span className="font-bold">
                          {day.total_count} /{" "}
                          <span className="text-xs opacity-70">
                            {day.dailyTarget}
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Bajarildi:</span>
                        <span className="font-bold">{day.percentage}%</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, day.percentage)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="text-xs text-gray-600">
                        {day.groups
                          ?.sort?.((a, b) =>
                            a.group_name.localeCompare(b.group_name)
                          )
                          ?.map((group, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{group.group_name}:</span>
                              <span>{group.count} ta</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-fit bg-white"
        />
        <div className="bg-white p-2 rounded-lg shadow-md w-fit">
          <span className="font-medium">Jami: </span>
          <span className="font-bold text-blue-600">
            {groupPlans
              .reduce((sum, plan) => sum + (parseFloat(plan.quantity) || 0), 0)
              .toLocaleString("ru-RU")}
          </span>
          <span> ta</span>
        </div>
      </div>

      {/* Add this after the month selector, before the departments mapping */}
      {groupPlans?.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="w-full flex justify-between items-center mb-4 gap-2 flex-wrap">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ChartNoAxesCombined className="w-5 h-5" />
              Umumiy Progress
            </h3>

            <Button
              variant="ghost"
              onClick={() => setShowTotalProgress(true)}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              Kunlik hisobotlarni ko'rish
            </Button>
          </div>

          {(() => {
            const totalProgress = calculateTotalProgress(groupPlans, month);
            if (!totalProgress) return null;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-200 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Jami Bajarildi</div>
                    <div className="text-2xl font-bold">
                      {totalProgress.totalCompleted.toLocaleString()} ta
                    </div>
                  </div>
                  <div className="bg-green-200 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Jami Reja</div>
                    <div className="text-2xl font-bold">
                      {totalProgress.totalTarget.toLocaleString()} ta
                    </div>
                  </div>
                  <div className="bg-amber-200 p-4 rounded-lg">
                    <div className="text-sm text-amber-600">Progress</div>
                    <div className="text-2xl font-bold">
                      {totalProgress.progress}%
                    </div>
                  </div>
                  <div className="bg-purple-200 p-4 rounded-lg">
                    <div className="text-sm text-purple-600">Qoldi</div>
                    <div className="text-2xl font-bold">
                      {totalProgress.remaining.toLocaleString()} ta
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Kunlik Progress</h4>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${
                        totalProgress.onTrack
                          ? "bg-green-300 text-green-800"
                          : "bg-red-300 text-red-800"
                      }`}
                    >
                      {totalProgress.onTrack
                        ? "Hammasi Reja Bo'yicha"
                        : "Rejadan Orqada"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-200 p-2 rounded-lg">
                        <div className="text-sm text-gray-500">
                          Kunlik o'rtacha
                        </div>
                        <div className="font-medium">
                          {totalProgress.avgDailyOutput.toLocaleString()} ta
                        </div>
                      </div>
                      <div className="bg-green-200 p-2 rounded-lg">
                        <div className="text-sm text-gray-500">Kun qoldi</div>
                        <div className="font-medium">
                          {totalProgress.workingDaysRemaining} kun
                        </div>
                      </div>
                      <div className="bg-orange-200 p-2 rounded-lg">
                        <div className="text-sm text-gray-500">
                          Kunlik kerak
                        </div>
                        <div className="font-medium">
                          {totalProgress.requiredDailyOutput.toLocaleString()}{" "}
                          ta
                        </div>
                      </div>
                      <div className="bg-purple-200 p-2 rounded-lg">
                        <div className="text-sm text-gray-500">Ish kunlari</div>
                        <div className="font-medium">
                          {totalProgress.workingDaysPassed}/
                          {totalProgress.workingDaysPassed +
                            totalProgress.workingDaysRemaining}
                        </div>
                      </div>
                    </div>

                    {!totalProgress.onTrack && (
                      <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        Rejaga yetish uchun har bir ish kunida kamida{" "}
                        <span className="font-bold">
                          {Math.ceil(
                            totalProgress.requiredDailyOutput
                          ).toLocaleString()}
                        </span>{" "}
                        ta tikish kerak.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
                      department.groups
                        ?.sort(
                          (a, b) =>
                            parseFloat(
                              groupPlans?.find(
                                (plan) => plan.group_id === b?.id
                              )?.quantity || 0
                            ) -
                            parseFloat(
                              groupPlans?.find(
                                (plan) => plan.group_id === a?.id
                              )?.quantity || 0
                            )
                        )
                        .map((group) => (
                          <div
                            key={group.id}
                            className={`w-full h-fit rounded-xl p-4 transition-all duration-300 transform cursor-pointer shadow-sm hover:shadow-2xl ${
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
                              {group.responsible_user?.employee?.img && (
                                <img
                                  src={group.responsible_user?.employee?.img}
                                  alt="-"
                                  className="md:w-10 md:h-10 w-8 h-8 object-cover rounded-full"
                                  onClick={() => {
                                    setImageDialogOpen(true);
                                    setImage(
                                      group.responsible_user?.employee?.img
                                    );
                                  }}
                                />
                              )}
                            </div>

                            {group.responsible_user?.employee && (
                              <>
                                <div className="flex items-center text-sm text-gray-600 mb-3">
                                  <div
                                    className="flex items-center bg-white/50 px-2 py-1 rounded-full"
                                    onClick={() => {
                                      group?.responsible_user?.employee?.img &&
                                        setImageDialogOpen(true);
                                      setImage(
                                        group.responsible_user?.employee?.img
                                      );
                                    }}
                                  >
                                    <User className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                    <span className="text-xs">
                                      {group.responsible_user?.employee?.name}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="mt-3 p-3 bg-white/50 rounded-lg space-y-3">
                              <div
                                className="flex items-center justify-between"
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
                                      group_id: group.id,
                                      quantity: null,
                                      group_name: group.name,
                                    });
                                    setAddDialogOpen(true);
                                  }
                                }}
                              >
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
                              <div
                                className="flex items-center justify-between"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setGroupDialogOpen(true);
                                }}
                              >
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

                              {/* Daily Output Analysis */}
                              {(() => {
                                const plan = groupPlans?.find(
                                  (p) => p.group_id === group.id
                                );
                                // Don't show if no plan, no daily outputs, or plan quantity is 0/not set
                                if (
                                  !plan?.daily_outputs?.length ||
                                  !plan?.quantity ||
                                  plan.quantity === 0
                                )
                                  return null;

                                const analysis = analyzeProgress(plan);
                                if (!analysis) return null;

                                return (
                                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                                    <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                      <Info className="w-3.5 h-3.5" />
                                      Progress Tahlili
                                    </h4>

                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-gray-600">
                                        <span>
                                          Progress:{" "}
                                          <span className="font-bold">
                                            {analysis.progress}
                                          </span>
                                          %
                                        </span>
                                        <span>
                                          {analysis.completed.toLocaleString()}{" "}
                                          / {analysis.target.toLocaleString()}
                                        </span>
                                      </div>
                                      <Progress
                                        value={analysis.progress}
                                        className="h-1.5"
                                      />
                                    </div>

                                    <Alert
                                      className={
                                        analysis.onTrack
                                          ? "bg-green-50 p-2"
                                          : "bg-amber-50 p-2"
                                      }
                                    >
                                      {analysis.onTrack ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mr-1 flex-shrink-0" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 mr-1 flex-shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-xs font-medium">
                                          {analysis.onTrack
                                            ? "Planni bajara oladi"
                                            : "Planni bajarish uchun harakat qilish kerak"}
                                        </p>
                                        <p className="text-xs mt-0.5">
                                          {analysis.onTrack ? (
                                            `Rejada: ~${Math.round(
                                              analysis.avgDailyOutput *
                                                analysis.workingDaysRemaining +
                                                analysis.completed
                                            ).toLocaleString()} / ${analysis.target.toLocaleString()}`
                                          ) : (
                                            <div>
                                              Kerak:{" "}
                                              <span className="font-medium">
                                                {analysis.requiredDailyOutput.toLocaleString()}
                                              </span>{" "}
                                              ta dan{" "}
                                              <span className="font-medium">
                                                {analysis.workingDaysRemaining}
                                              </span>{" "}
                                              kun
                                            </div>
                                          )}
                                        </p>
                                      </div>
                                    </Alert>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="bg-white p-1.5 rounded border text-center">
                                        <div className="text-gray-500 text-[10px]">
                                          Kunlik o'rtacha
                                        </div>
                                        <div className="font-medium">
                                          {analysis.avgDailyOutput.toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="bg-white p-1.5 rounded border text-center">
                                        <div className="text-gray-500 text-[10px]">
                                          Kun qoldi
                                        </div>
                                        <div className="font-medium">
                                          {analysis.workingDaysRemaining}
                                        </div>
                                      </div>
                                      <div className="bg-white p-1.5 rounded border text-center">
                                        <div className="text-gray-500 text-[10px]">
                                          Kunlik kerak
                                        </div>
                                        <div className="font-medium">
                                          {analysis.requiredDailyOutput.toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="bg-white p-1.5 rounded border text-center">
                                        <div className="text-gray-500 text-[10px]">
                                          So'nggi yangilanish
                                        </div>
                                        <div className="font-medium">
                                          {analysis.lastUpdated}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
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
