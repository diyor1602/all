import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Crown,
  Medal,
  Trophy,
  Filter,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const levels = {
  bronze: {
    name: "Bronza",
    icon: Medal,
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
  },
  silver: {
    name: "Kumush",
    icon: Trophy,
    color: "bg-gray-400",
    textColor: "text-gray-400",
    borderColor: "border-gray-400",
  },
  gold: {
    name: "Oltin",
    icon: Crown,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500",
  },
};

const ApproveLevel = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/employee-level-histories");
      setData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlar olishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const filteredData = data?.filter((employee) => {
    const matchesSearch = employee.employee.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const currentLevel = employee.histories.find(
      (h) => h.end_date === null,
    )?.level;
    const matchesStatus =
      statusFilter === "all" || currentLevel === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getLevelBadge = (level) => {
    const levelConfig = levels[level];
    if (!levelConfig) return null;

    const Icon = levelConfig.icon;

    return (
      <Badge
        variant="outline"
        className={cn(
          "flex items-center gap-1 px-3 py-1 font-medium",
          levelConfig.borderColor,
          levelConfig.textColor,
        )}
      >
        <Icon className="w-3 h-3" />
        {levelConfig.name}
      </Badge>
    );
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Hozirgi kungacha";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSubmit = async (status) => {
    setSubmitting(true);
    try {
      const currentLevel = selectedEmployee?.histories?.find(
        (h) => h.end_date === null,
      )?.level;
      const bonusApproval = selectedEmployee?.employee?.employee_bonus_approval;

      let res;
      if (bonusApproval?.id) {
        // Use PATCH when employee_bonus_approval.id exists
        res = api.patch(`/employee-bonus-approvals/${bonusApproval.id}`, {
          status,
        });
      } else {
        // Use POST when creating new approval
        res = api.post("/employee-bonus-approvals", {
          employee_id: selectedEmployee?.employee?.id,
          level: currentLevel,
          status,
        });
      }

      toast({
        variant: "default",
        title: "Muvaffaqiyatli",
        description: "Xodim statusi belgilangdi!",
        duration: 1200,
      });
      setApproveDialogOpen(false);
      getData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni saqlab bo'lmadi!",
        duration: 1200,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Xodimlar Darajalari
        </h1>
        <p className="text-muted-foreground">
          Xodimlarning joriy darajalarini ko'rish va boshqarish
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Darajalar Ro'yxati
          </CardTitle>
          <CardDescription>
            Jami {filteredData?.length || 0} ta xodim ro'yxatga olingan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Xodim nomini qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Daraja bo'yicha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha darajalar</SelectItem>
                  <SelectItem value="bronze">Bronza</SelectItem>
                  <SelectItem value="silver">Kumush</SelectItem>
                  <SelectItem value="gold">Oltin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 font-semibold">№</TableHead>
                  <TableHead className="font-semibold">Xodim</TableHead>
                  <TableHead className="font-semibold">Daraja</TableHead>
                  <TableHead className="font-semibold">Xolat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? "Hech qanday xodim topilmadi"
                        : "Ma'lumotlar mavjud emas"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData
                    ?.sort((a, b) => {
                      const levelOrder = {
                        gold: 1,
                        silver: 2,
                        bronze: 3,
                        null: 4,
                      };
                      const aLevel = a.histories.find(
                        (h) => h.end_date === null,
                      )?.level;
                      const bLevel = b.histories.find(
                        (h) => h.end_date === null,
                      )?.level;
                      return levelOrder[aLevel] - levelOrder[bLevel];
                    })
                    ?.map((employee, sortedIndex) => {
                      const currentLevel = employee.histories.find(
                        (h) => h.end_date === null,
                      )?.level;
                      return (
                        <TableRow
                          key={`${employee.employee.id || employee.employee.name}-${sortedIndex}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {sortedIndex + 1}
                          </TableCell>
                          <TableCell
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleEmployeeClick(employee)}
                          >
                            {employee.employee.name}
                          </TableCell>
                          <TableCell>{getLevelBadge(currentLevel)}</TableCell>
                          <TableCell>
                            {employee?.employee?.employee_bonus_approval
                              ?.status === "approved" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                Tasdiqlangan
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                Tasdiqlanmagan
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.employee?.name}</DialogTitle>
          </DialogHeader>
          <div className="text-sm">
            {selectedEmployee?.employee?.employee_bonus_approval?.status ===
            "approved"
              ? "Xodimni darajadan olib tashlashga rozimisiz?"
              : "Xodimni darajasini tasdiqlashga rozimisiz?"}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              onClick={() => {
                setApproveDialogOpen(false);
              }}
              variant="outline"
            >
              Bekor qilish
            </Button>
            <Button
              disable={submitting}
              onClick={() => {
                handleSubmit(
                  selectedEmployee?.employee?.employee_bonus_approval
                    ?.status === "approved"
                    ? "rejected"
                    : "approved",
                );
              }}
            >
              {submitting ? "Saqlanmoqda..." : "Tasdiqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedEmployee?.employee?.name}
            </DialogTitle>
            <DialogDescription>
              Xodimning daraja tarixi va ma'lumotlari
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Image */}
              <div className="flex items-center justify-center">
                {selectedEmployee.employee.img ? (
                  <img
                    src={selectedEmployee.employee.img}
                    alt={selectedEmployee.employee.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-muted"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Current Level */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Joriy Daraja</h3>
                {(() => {
                  const currentLevel = selectedEmployee.histories.find(
                    (h) => h.end_date === null,
                  )?.level;
                  return getLevelBadge(currentLevel);
                })()}
              </div>

              {/* History */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Daraja Tarixi
                </h3>
                <div className="space-y-3">
                  {selectedEmployee.histories
                    .sort(
                      (a, b) => new Date(b.start_date) - new Date(a.start_date),
                    )
                    .map((history) => (
                      <div
                        key={history.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          {getLevelBadge(history.level)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(history.start_date)} -{" "}
                          {formatDate(history.end_date)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveLevel;
