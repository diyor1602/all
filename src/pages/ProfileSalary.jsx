import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import payment_types from "@/lib/paymentTypes";
import api from "@/utils/api";
import {
  Briefcase,
  Building,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Hash,
  Images,
  MessageCircle,
  Phone,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const getMonthName = (month) => {
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];
  return months[month];
};

// Oylik boshlanish va tugash sanalarini olish uchun yordamchi funksiya
const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0)); // last day of the month
  return {
    start_date: new Date(start.getTime() + 5 * 60 * 60 * 1000) // add GMT+5
      .toISOString()
      .slice(0, 10),
    end_date: new Date(end.getTime() + 5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString) => {
  return timeString ? timeString.slice(0, 5) : "";
};

const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (status) => {
  switch (status) {
    case "working":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "kicked":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const SalaryDetails = () => {
  const { toast } = useToast();

  // Get current date in GMT+5
  const now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  // Get stored filters or default
  const stored = localStorage.getItem("salary2-filters");
  const initialFilters = stored
    ? JSON.parse(stored)
    : getMonthRange(currentYear, currentMonth);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedMonth, setSelectedMonth] = useState(
    filters.start_date.substring(0, 7)
  );
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [expandedModel, setExpandedModel] = useState(null);

  const getAbsenceData = (date) => {
    return employeeData?.absences?.find(
      (absence) => absence.start_date === date
    );
  };

  const getHolidayData = (date) => {
    return employeeData?.holidays?.find(
      (holiday) =>
        new Date(date) >= new Date(holiday.start_date) &&
        new Date(date) <= new Date(holiday.end_date)
    );
  };

  useEffect(() => {
    localStorage.setItem("salary2-filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const fetchSalaryDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get("/profile", {
          params: {
            start_date: filters.start_date,
            end_date: filters.end_date,
          },
        });
        setEmployeeData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday ma'lumot topilmadi",
          variant: "destructive",
        });
        setEmployeeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryDetails();
  }, [filters, toast]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-32 mx-auto" />
              <div className="flex justify-center mt-2">
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              const range = getMonthRange(year, month - 1);
              setSelectedMonth(e.target.value);
              setFilters(range);
            }}
            className="w-48 bg-white"
          />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ma'lumot topilmadi</h3>
            <p className="text-muted-foreground text-center">
              Tanlangan sana oralig'ida ushbu xodim uchun ma'lumot mavjud emas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const employee = employeeData;
  const totalTarificationAmount =
    employee.employee_tarification_logs?.reduce(
      (sum, log) => sum + Number.parseFloat(log.amount_earned),
      0
    ) || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Month Filter .*/}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              const range = getMonthRange(year, month - 1);
              setSelectedMonth(e.target.value);
              setFilters(range);
            }}
            className="w-48 bg-white"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(filters.start_date)} - {formatDate(filters.end_date)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Basic Info */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                {employee.img ? (
                  <img
                    src={employee.img}
                    alt={employee.name}
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-center">{employee.name}</CardTitle>
            <div className="flex justify-center mt-2">
              <Badge className={getStatusColor(employee.status)}>
                {employee.status === "working"
                  ? "Ishlayapti"
                  : employee.status === "kicked"
                  ? "Ishlamayapti"
                  : "-"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {employee.status === "kicked" && (
                <>
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-primary" />
                    <span>{formatDate(employee.kicked_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span>{employee.comment}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-primary" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground ">
                    Xodim ID:
                  </span>
                  <span className="font-medium">{employee.id}</span>
                </div>
              </div>
              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-3"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{employee.phone}</span>
                </a>
              )}
              {employee.position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>{employee.position}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-primary" />
                  <span>{employee.department}</span>
                </div>
              )}
              {employee.group && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{employee.group}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              {/* {employee.balance && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Hisobdagi mablag'lar:
                  </span>
                  <span className="font-medium text-green-600">
                    {Number.parseFloat(employee.balance).toLocaleString(
                      "ru-RU",
                      { maximumFractionDigits: 0 }
                    )}{" "}
                    so'm
                  </span>
                </div>
              )} */}
              {employee.bonus && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bonus:</span>
                  <span className="font-medium">
                    {Number.parseFloat(employee.bonus).toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    so'm
                  </span>
                </div>
              )}
              {totalTarificationAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Jami ishlangan mablag'lar:
                  </span>
                  <span className="font-medium text-blue-600">
                    {totalTarificationAmount.toLocaleString("ru-RU", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    so'm
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <div className="text-xs text-muted-foreground w-full space-y-1">
              {employee.address && (
                <div className="flex justify-between">
                  <span>Manzil:</span>
                  <span>{employee.address}</span>
                </div>
              )}
              {employee.passport_number && (
                <div className="flex justify-between">
                  <span>Passport:</span>
                  <span>{employee.passport_number}</span>
                </div>
              )}
              {employee.passport_code && (
                <div className="flex justify-between">
                  <span>JSHSHIR:</span>
                  <span>{employee.passport_code}</span>
                </div>
              )}
              {employee.gender && (
                <div className="flex justify-between">
                  <span>Jinsi:</span>
                  <span>
                    {employee.gender === "male"
                      ? "Erkak"
                      : employee.gender === "female"
                      ? "Ayol"
                      : "-"}
                  </span>
                </div>
              )}
              {employee.birthday && (
                <div className="flex justify-between">
                  <span>Tug'ilgan sana:</span>
                  <span>{formatDate(employee.birthday)}</span>
                </div>
              )}
              {employee.hiring_date && (
                <div className="flex justify-between">
                  <span>Ishga kirgan sana:</span>
                  <span>{formatDate(employee.hiring_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>To'lov turi:</span>
                <span className="capitalize">
                  {payment_types[employee.payment_type]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Maosh:</span>
                <span className="capitalize">
                  {parseFloat(employee.salary || 0).toLocaleString("ru-RU")}{" "}
                  so'm
                </span>
              </div>
              <div className="flex justify-between">
                <span>KPI:</span>
                <span className="capitalize">
                  {parseFloat(employee.kpi || 0).toLocaleString("ru-RU")} so'm
                </span>
              </div>
              {employee?.comment && (
                <div className="flex justify-between">
                  <span>Izoh:</span>
                  <span>{employee.comment}</span>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeTab === "attendance" ? "default" : "outline"}
              onClick={() => setActiveTab("attendance")}
            >
              Davomat
            </Button>
            <Button
              variant={activeTab === "tarification" ? "default" : "outline"}
              onClick={() => setActiveTab("tarification")}
            >
              Nakladnoy
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => setActiveTab("model")}
            >
              Model
            </Button>
            <Button
              variant={activeTab === "salary" ? "default" : "outline"}
              onClick={() => setActiveTab("salary")}
            >
              Maosh
            </Button>
          </div>
          {activeTab === "attendance" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Davomat qaydnomasi (
                  {employee.attendance_salaries
                    ?.reduce(
                      (sum, salary) =>
                        sum + Number.parseFloat(salary.amount || 0),
                      0
                    )
                    ?.toLocaleString("ru-RU")}{" "}
                  so'm )
                </CardTitle>
                <CardDescription className="grid grid-cols-3 gap-4 pt-2">
                  {employee.attendances?.length > 0
                    ? `${employee.attendances.length} kunlik davomat`
                    : "Davomat ma'lumotlari mavjud emas"}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {
                        employee.attendances.filter(
                          (a) => a.status === "present"
                        ).length
                      }{" "}
                      kun kelgan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">
                      {
                        employee.attendances.filter(
                          (a) => a.status === "absent"
                        ).length
                      }{" "}
                      kun kelmagan
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employee.attendances?.length > 0 ? (
                  <div className="space-y-3">
                    {employee.attendances
                      ?.sort((a, b) => {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        return dateB - dateA;
                      })
                      .map((attendance) => (
                        <div
                          key={attendance.id}
                          className={`flex items-center justify-between p-4 border rounded-lg flex-wrap gap-2 ${
                            attendance.status === "present"
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {attendance.status === "present" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">
                                {formatDate(attendance.date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attendance.status === "present"
                                  ? "Kelgan"
                                  : "Kelmagan"}
                              </p>
                              {employee?.attendance_salaries?.find(
                                (a) => a.attendance_id === attendance.id
                              ) && (
                                <p className="text-xs text-muted-foreground">
                                  Topgan puli:{" "}
                                  <span className="font-semibold">
                                    {parseFloat(
                                      employee.attendance_salaries.find(
                                        (a) => a.attendance_id === attendance.id
                                      )?.amount || 0
                                    )?.toLocaleString("ru-RU")}{" "}
                                  </span>
                                  so'm
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            {attendance.check_in && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  Keldi:{" "}
                                  {formatTime(
                                    attendance.check_in.split(" ")[1]
                                  )}
                                </span>
                                {attendance.check_in_image && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedImage(
                                        attendance.check_in_image
                                      );
                                      setImageDialogOpen(true);
                                    }}
                                  >
                                    <Images />
                                  </Button>
                                )}
                              </div>
                            )}
                            {attendance.check_out && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  Ketdi:{" "}
                                  {formatTime(
                                    attendance.check_out.split(" ")[1]
                                  )}
                                </span>
                                {attendance.check_out_image && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedImage(
                                        attendance.check_out_image
                                      );
                                      setImageDialogOpen(true);
                                    }}
                                  >
                                    <Images />
                                  </Button>
                                )}
                              </div>
                            )}
                            {getAbsenceData(attendance.date) && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {getAbsenceData(attendance.date)?.image && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedImage(
                                        getAbsenceData(attendance.date)?.image
                                      );
                                      setImageDialogOpen(true);
                                    }}
                                  >
                                    <Images />
                                  </Button>
                                )}
                                <div className="rounded-full bg-red-500 text-white px-2 py-1 w-fit text-xs">
                                  Sababsiz
                                </div>
                                <div>
                                  {getAbsenceData(attendance.date)?.comment}
                                </div>
                              </div>
                            )}
                            {getHolidayData(attendance.date) && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {getHolidayData(attendance.date)?.image && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedImage(
                                        getHolidayData(attendance.date)?.image
                                      );
                                      setImageDialogOpen(true);
                                    }}
                                  >
                                    <Images />
                                  </Button>
                                )}
                                <div className="rounded-full bg-green-500 text-white px-2 py-1 w-fit text-xs">
                                  Sababli
                                </div>
                                <div>
                                  {getHolidayData(attendance.date)?.comment}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tanlangan sana oralig'ida davomat ma'lumotlari topilmadi
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "tarification" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Tarifikatsiya qaydnomasi
                </CardTitle>
                <CardDescription>
                  {employee.employee_tarification_logs?.length > 0
                    ? `Bajarilgan ishlar ro'yxati • Jami: ${totalTarificationAmount.toLocaleString(
                        "ru-RU",
                        {
                          maximumFractionDigits: 0,
                        }
                      )} so'm`
                    : "Tarifikatsiya ma'lumotlari mavjud emas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employee.employee_tarification_logs?.length > 0 ? (
                  <div className="space-y-4">
                    {employee.employee_tarification_logs
                      ?.sort((a, b) => {
                        return new Date(b.date) - new Date(a.date);
                      })
                      .map((log) => (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {formatDate(log.date)}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="bg-orange-100 truncate"
                              >
                                {log.model?.name} - {log.submodel?.name || ""}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-50">
                                Miqdor: {log.quantity}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50">
                                {(
                                  Number.parseFloat(log.tarification?.summa) *
                                  log.quantity
                                ).toLocaleString("ru-RU", {
                                  maximumFractionDigits: 2,
                                })}{" "}
                                so'm
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  Kod
                                </span>
                                <span className="font-medium">
                                  {log.tarification.code}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  Sekund
                                </span>
                                <span className="font-medium">
                                  {log.tarification.second}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Birlik narxi
                                </span>
                                <span className="font-medium text-green-600">
                                  {Number.parseFloat(
                                    log.tarification.summa
                                  ).toLocaleString("ru-RU", {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  сўм
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Jami
                                </span>
                                <span className="font-medium text-green-600">
                                  {Number.parseFloat(
                                    log.amount_earned
                                  ).toLocaleString("ru-RU", {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  сўм
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tanlangan sana oralig'ida tarifikatsiya ma'lumotlari
                      topilmadi
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "model" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Model qaydnomasi
                </CardTitle>
                <CardDescription>
                  {employee.employee_tarification_logs?.length > 0
                    ? `Bajarilgan ishlar ro'yxati • Jami: ${totalTarificationAmount.toLocaleString(
                        "ru-RU",
                        {
                          maximumFractionDigits: 0,
                        }
                      )} so'm`
                    : "Tarifikatsiya ma'lumotlari mavjud emas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employee.employee_tarification_logs?.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      const groupedByModel = {};

                      // Step 1: Group logs by model
                      employee.employee_tarification_logs?.forEach((log) => {
                        const modelId = log.model?.id || "unknown";
                        const modelName = log.model?.name || "Noma'lum model";

                        if (!groupedByModel[modelId]) {
                          groupedByModel[modelId] = {
                            modelName,
                            logs: [],
                          };
                        }

                        groupedByModel[modelId].logs.push(log);
                      });

                      return (
                        <div className="space-y-2">
                          {Object.entries(groupedByModel).map(
                            ([modelId, group], index) => {
                              const isOpen = expandedModel === modelId;

                              // Step 2: Group works under this model by work CODE
                              const workMap = {};
                              group.logs.forEach((log) => {
                                const workCode =
                                  log.tarification?.code || "NOMA'LUM";
                                const workName =
                                  log.tarification?.name || "Noma'lum ish";

                                if (!workMap[workCode]) {
                                  workMap[workCode] = {
                                    name: workName,
                                    totalQty: 0,
                                    totalSum: 0,
                                  };
                                }

                                workMap[workCode].totalQty += log.quantity;
                                workMap[workCode].totalSum += parseFloat(
                                  log.amount_earned || 0
                                );
                              });

                              // Step 3: Total summary for the model
                              const totalSumForModel = group.logs.reduce(
                                (sum, log) =>
                                  sum + parseFloat(log.amount_earned || 0),
                                0
                              );

                              // Step 4: Assign a color
                              const colors = [
                                "bg-blue-100 hover:bg-blue-200",
                                "bg-green-100 hover:bg-green-200",
                                "bg-yellow-100 hover:bg-yellow-200",
                                "bg-purple-100 hover:bg-purple-200",
                                "bg-pink-100 hover:bg-pink-200",
                                "bg-indigo-100 hover:bg-indigo-200",
                              ];

                              const colorClass = colors[index % colors.length];

                              return (
                                <div key={modelId}>
                                  {/* Clickable model row */}
                                  <div
                                    onClick={() =>
                                      setExpandedModel(isOpen ? null : modelId)
                                    }
                                    className={`cursor-pointer p-3 border rounded-lg ${colorClass} flex justify-between items-center`}
                                  >
                                    <div className="font-medium text-gray-800">
                                      {group.modelName}
                                    </div>
                                    <div className="text-green-700 font-semibold">
                                      {totalSumForModel.toLocaleString("ru-RU")}{" "}
                                      so'm
                                    </div>
                                  </div>

                                  {/* Expanded list of works under this model */}
                                  {isOpen && (
                                    <div className="bg-white p-4 border rounded-b-md space-y-2">
                                      {Object.entries(workMap).map(
                                        ([code, data]) => (
                                          <div
                                            key={code}
                                            className="p-3 border rounded-md bg-gray-50 text-sm"
                                          >
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                              <div className="font-medium">
                                                {code}, {data.name}
                                              </div>
                                              <div>
                                                <div>
                                                  Bajarildi:{" "}
                                                  <span className="font-semibold">
                                                    {data.totalQty} ta
                                                  </span>
                                                </div>
                                                <div>
                                                  Summa:{" "}
                                                  <span className="font-semibold text-green-700">
                                                    {data.totalSum.toLocaleString(
                                                      "ru-RU"
                                                    )}{" "}
                                                    so'm
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tanlangan sana oralig'ida model ma'lumotlari topilmadi
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "salary" && (
            <Card>
              <CardHeader>
                <CardTitle>Oylik</CardTitle>
                <CardDescription>
                  <span className="font-semibold">
                    {getMonthName(selectedMonth?.split("-")[1] * 1 - 1)}
                  </span>{" "}
                  oyida olingan maoshlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employee?.salaryPayments?.map((payment) => (
                  <div key={payment.id}>
                    <div className="flex justify-between items-center">
                      <div
                        className={
                          payment.type === "advance"
                            ? "text-orange-700 font-medium"
                            : "text-green-700 font-medium"
                        }
                      >
                        {payment.type === "advance" ? "Avans" : "Oylik"}
                      </div>
                      <div
                        className={
                          payment.type === "advance"
                            ? "text-orange-700 font-semibold"
                            : "text-green-700 font-semibold"
                        }
                      >
                        {parseFloat(payment.amount).toLocaleString("ru-RU")}{" "}
                        so'm
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-4 border-t pt-4">
                  <div className="font-medium">Jami</div>
                  <div className="font-semibold">
                    {parseFloat(
                      employee?.salaryPayments?.reduce(
                        (sum, payment) => sum + parseFloat(payment.amount || 0),
                        0
                      )
                    ).toLocaleString("ru-RU")}{" "}
                    so'm
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Attendance"
                className="max-w-full max-h-[600px]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryDetails;
