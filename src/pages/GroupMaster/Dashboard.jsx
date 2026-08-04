import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Crown,
  Medal,
  Award,
  AlertTriangle,
  Package,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  User,
  Search,
} from "lucide-react";

const Dashboard = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("groupMaster/dashboard", {
        params: {
          date: selectedDate,
        },
      });
      setData(res.data);
    } catch {
      toast({
        title: "Diqqat",
        description: "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedDate]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredGroups = data?.groups?.filter(
    (group) =>
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.responsible_user.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getLevelIcon = (level) => {
    switch (level) {
      case "gold":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "silver":
        return <Medal className="w-4 h-4 text-gray-400" />;
      case "bronze":
        return <Award className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "gold":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "silver":
        return "bg-gray-50 border-gray-200 text-gray-700";
      case "bronze":
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.date && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {data.date}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Guruh qidiring..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami guruhlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {data?.group_count || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugun ishlayotganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">
                {data?.groups?.reduce(
                  (acc, g) => acc + (g?.present?.length || 0),
                  0,
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugun kelganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">
                {data?.groups?.reduce(
                  (acc, g) => acc + (g?.absent?.length || 0),
                  0,
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              O'rtacha samaradorlik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {data?.groups?.length > 0
                  ? (
                      data.groups.reduce(
                        (acc, g) =>
                          acc + (g?.avg_efficiency_percent?.today || 0),
                        0,
                      ) / data.groups.length
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {filteredGroups?.length === 0 ? (
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-sm text-muted-foreground">
            Ma'lumot topilmadi
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups?.map((group) => {
            const isOpen = openGroups[group.group_id] ?? true;
            const totalEmployees =
              (group?.present?.length || 0) + (group?.absent?.length || 0);
            const attendanceRate =
              totalEmployees > 0
                ? ((group?.present?.length || 0) / totalEmployees) * 100
                : 0;

            return (
              <Card key={group.group_id} className="overflow-hidden">
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.group_id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold truncate">
                              {group.group_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              ID: {group.group_id}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            <User className="w-4 h-4 inline mr-1" />
                            {group.responsible_user}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-medium">
                                Bugun:{" "}
                                {group.avg_efficiency_percent?.today || 0}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                7 kun:{" "}
                                {group.avg_efficiency_percent?.last_7_days || 0}
                                %
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">
                                Davomat: {attendanceRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t px-4 sm:px-6 py-4 space-y-6">
                      {/* Attendance */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Davomat
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Ishlayotganlar ({group.present?.length || 0})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group?.present?.slice(0, 10).map((employee) => (
                                <div
                                  key={employee.employee_id}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200"
                                >
                                  {employee.img ? (
                                    <img
                                      src={employee.img}
                                      alt={employee.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-semibold">
                                      {employee.name?.charAt(0)}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <div className="font-medium truncate max-w-32">
                                      {employee.name}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {employee.position?.name}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {group.present?.length > 10 && (
                                <div className="text-xs text-muted-foreground self-center">
                                  +{group.present.length - 10} ta
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-red-600 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Kelmaganlar ({group.absent?.length || 0})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group?.absent?.map((employee) => (
                                <div
                                  key={employee.employee_id}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200"
                                >
                                  {employee.img ? (
                                    <img
                                      src={employee.img}
                                      alt={employee.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-xs font-semibold">
                                      {employee.name?.charAt(0)}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <div className="font-medium truncate max-w-32">
                                      {employee.name}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {employee.position?.name}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Efficiency */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Samaradorlik
                        </h4>
                        <Tabs defaultValue="today" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="today">Bugun</TabsTrigger>
                            <TabsTrigger value="week">7 kun</TabsTrigger>
                          </TabsList>
                          <TabsContent value="today" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-green-600">
                                  Eng yaxshilar
                                </h5>
                                <div className="space-y-2">
                                  {group.efficiency?.today?.top7_best
                                    ?.slice(0, 5)
                                    .map((emp, idx) => (
                                      <div
                                        key={emp.employee_id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        {emp.img ? (
                                          <img
                                            src={emp.img}
                                            alt={emp.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-semibold">
                                            {emp.name?.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {emp.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {emp.efficiency_percent.toFixed(1)}%
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-green-600">
                                          {emp.total_earned?.toLocaleString()}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-red-600">
                                  Eng pastlar
                                </h5>
                                <div className="space-y-2">
                                  {group.efficiency?.today?.top7_worst
                                    ?.slice(0, 5)
                                    .map((emp, idx) => (
                                      <div
                                        key={emp.employee_id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-200"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        {emp.img ? (
                                          <img
                                            src={emp.img}
                                            alt={emp.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-xs font-semibold">
                                            {emp.name?.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {emp.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {emp.efficiency_percent.toFixed(1)}%
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-red-600">
                                          {emp.total_earned?.toLocaleString()}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="week" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-green-600">
                                  Eng yaxshilar (7 kun)
                                </h5>
                                <div className="space-y-2">
                                  {group.efficiency?.last_7_days?.top7_best
                                    ?.slice(0, 5)
                                    .map((emp, idx) => (
                                      <div
                                        key={emp.employee_id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        {emp.img ? (
                                          <img
                                            src={emp.img}
                                            alt={emp.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-semibold">
                                            {emp.name?.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {emp.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {emp.efficiency_percent.toFixed(1)}%
                                            ({emp.worked_days} kun)
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-green-600">
                                          {emp.total_earned?.toLocaleString()}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-red-600">
                                  Eng pastlar (7 kun)
                                </h5>
                                <div className="space-y-2">
                                  {group.efficiency?.last_7_days?.top7_worst
                                    ?.slice(0, 5)
                                    .map((emp, idx) => (
                                      <div
                                        key={emp.employee_id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-200"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        {emp.img ? (
                                          <img
                                            src={emp.img}
                                            alt={emp.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-xs font-semibold">
                                            {emp.name?.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {emp.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {emp.efficiency_percent.toFixed(1)}%
                                            ({emp.worked_days} kun)
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-red-600">
                                          {emp.total_earned?.toLocaleString()}{" "}
                                          so'm
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Levels */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Darajalar
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {group.levels?.map((levelData) => (
                            <div
                              key={levelData.level}
                              className={`p-3 rounded-lg border ${getLevelColor(levelData.level)}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {getLevelIcon(levelData.level)}
                                <span className="font-semibold capitalize">
                                  {levelData.level || "Boshqa"}
                                </span>
                              </div>
                              <div className="text-2xl font-bold">
                                {levelData.count}
                              </div>
                              <div className="text-xs opacity-75">ta xodim</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quality Control */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Sifat nazorati
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2">
                              Eng ko'p xatolik qilganlar
                            </h5>
                            <div className="space-y-2">
                              {group.brak_top5?.slice(0, 5).map((emp) => (
                                <div
                                  key={emp.employee_id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-200"
                                >
                                  {emp.img ? (
                                    <img
                                      src={emp.img}
                                      alt={emp.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-xs font-semibold">
                                      {emp.name?.charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {emp.name}
                                    </div>
                                  </div>
                                  <div className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                    {emp.fail_count} ta
                                  </div>
                                </div>
                              ))}
                              {group.brak_top5?.length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Xatoliklar yo'q
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-2">
                              Kutilayotgan tekshiruvlar (
                              {group.pending_braks?.length || 0})
                            </h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {group.pending_braks?.slice(0, 5).map((brak) => (
                                <div
                                  key={brak.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200"
                                >
                                  {brak.employee?.img ? (
                                    <img
                                      src={brak.employee.img}
                                      alt={brak.employee.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-xs font-semibold">
                                      {brak.employee?.name?.charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {brak.employee?.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {brak.order_name}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      brak.created_at,
                                    ).toLocaleTimeString("uz-UZ", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              ))}
                              {group.pending_braks?.length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Kutilayotgan tekshiruvlar yo'q
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sewing Output */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Tikuv chiqishi
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="text-sm text-muted-foreground mb-1">
                              Bugun
                            </div>
                            <div className="text-xl font-bold text-blue-700">
                              {group.sewing_output?.today_quantity || 0}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <div className="text-sm text-muted-foreground mb-1">
                              Jami
                            </div>
                            <div className="text-xl font-bold text-purple-700">
                              {group.sewing_output?.total_quantity || 0}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <div className="text-sm text-muted-foreground mb-1">
                              Reja
                            </div>
                            <div className="text-xl font-bold text-green-700">
                              {group.sewing_output?.today_plan || 0}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <div className="text-sm text-muted-foreground mb-1">
                              Bajurilish
                            </div>
                            <div className="text-xl font-bold text-orange-700">
                              {group.sewing_output?.plan_completion_percent ||
                                0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
