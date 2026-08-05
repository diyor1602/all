import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const Dashboard = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [selectedBrak, setSelectedBrak] = useState(null);
  const [brakDialogOpen, setBrakDialogOpen] = useState(false);

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

  const filteredGroups = data?.groups;

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
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-fit bg-white"
      />

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
              Kelmaganlar
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
              Jami braklar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {data?.groups?.reduce(
                  (acc, g) => acc + (g?.pending_braks?.length || 0),
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
                    ).toFixed(0)
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
                                {formatNumber(
                                  group.avg_efficiency_percent?.today || 0,
                                  0,
                                )}
                                %
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                7 kun:{" "}
                                {formatNumber(
                                  group.avg_efficiency_percent?.last_7_days ||
                                    0,
                                  0,
                                )}
                                %
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
                          <XCircle className="w-4 h-4" />
                          Kelmaganlar ({group.absent?.length || 0})
                        </h4>
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
                          {group?.absent?.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                              Kelmaganlar yo'q
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Efficiency */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" />
                          Yomon samaradorlik
                        </h4>
                        <Tabs defaultValue="today" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="today">Bugun</TabsTrigger>
                            <TabsTrigger value="week">7 kun</TabsTrigger>
                          </TabsList>
                          <TabsContent value="today" className="space-y-4 mt-4">
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
                                        {formatNumber(
                                          emp.efficiency_percent,
                                          0,
                                        )}
                                        %
                                      </div>
                                    </div>
                                    <div className="text-sm font-semibold text-red-600">
                                      {formatNumber(emp.total_earned, 0)} so'm
                                    </div>
                                  </div>
                                ))}
                              {group.efficiency?.today?.top7_worst?.length ===
                                0 && (
                                <div className="text-sm text-muted-foreground">
                                  Ma'lumot yo'q
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="week" className="space-y-4 mt-4">
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
                                        {formatNumber(
                                          emp.efficiency_percent,
                                          0,
                                        )}
                                        % ({emp.worked_days} kun)
                                      </div>
                                    </div>
                                    <div className="text-sm font-semibold text-red-600">
                                      {formatNumber(emp.total_earned, 0)} so'm
                                    </div>
                                  </div>
                                ))}
                              {group.efficiency?.last_7_days?.top7_worst
                                ?.length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Ma'lumot yo'q
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Quality Control */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Braklar ({group.pending_braks?.length || 0})
                        </h4>
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                            {group.pending_braks?.map((brak) => (
                              <div
                                key={brak.id}
                                className="relative group cursor-pointer"
                                onClick={() => {
                                  setSelectedBrak(brak);
                                  setBrakDialogOpen(true);
                                }}
                              >
                                {brak.image ? (
                                  <img
                                    src={brak.image}
                                    alt={`Brak - ${brak.employee?.name}`}
                                    className="w-full h-32 object-cover rounded-lg border border-red-200 hover:opacity-90 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-full h-32 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-xs text-red-700">
                                    Rasm yo'q
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg">
                                  <div className="font-medium truncate">
                                    {brak.employee?.name}
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {new Date(
                                      brak.created_at,
                                    ).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                                {brak.description && (
                                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    {brak.description}
                                  </div>
                                )}
                              </div>
                            ))}
                            {group.pending_braks?.length === 0 && (
                              <div className="col-span-full text-sm text-muted-foreground text-center py-8">
                                Braklar yo'q
                              </div>
                            )}
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

      {/* Brak Image Dialog */}
      <Dialog open={brakDialogOpen} onOpenChange={setBrakDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedBrak && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedBrak.employee?.img && (
                  <img
                    src={selectedBrak.employee.img}
                    alt={selectedBrak.employee.name}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                )}
                <div>
                  <div className="font-semibold text-lg">
                    {selectedBrak.employee?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedBrak.order_name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedBrak.created_at).toLocaleString("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
              {selectedBrak.description && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="font-medium text-red-700 mb-1">Izoh:</div>
                  <div className="text-red-600">{selectedBrak.description}</div>
                </div>
              )}
              {selectedBrak.image ? (
                <div className="relative">
                  <img
                    src={selectedBrak.image}
                    alt="Brak rasmi"
                    className="w-full max-h-[60vh] object-contain rounded-lg border border-gray-200"
                  />
                </div>
              ) : (
                <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  Rasm yo'q
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
