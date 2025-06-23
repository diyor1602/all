"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  UserX,
  Search,
  Download,
  Eye,
  Loader2,
  Axe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Transliteration mapping for Cyrillic to Latin
const cyrillicToLatin = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Uzbek specific
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};

// Latin to Cyrillic mapping (reverse)
const latinToCyrillic = {
  a: "а",
  b: "б",
  v: "в",
  g: "г",
  d: "д",
  e: "е",
  yo: "ё",
  zh: "ж",
  z: "з",
  i: "и",
  y: "й",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  f: "ф",
  kh: "х",
  ts: "ц",
  ch: "ч",
  sh: "ш",
  shch: "щ",
  yu: "ю",
  ya: "я",
  q: "қ",
  h: "ҳ",
  x: "х",
  j: "ж",
};

const transliterate = (text, fromCyrillic = true) => {
  if (!text) return "";

  const mapping = fromCyrillic ? cyrillicToLatin : latinToCyrillic;
  let result = text.toLowerCase();

  // Handle multi-character mappings first (like 'shch', 'kh', etc.)
  const multiChar = fromCyrillic
    ? [
        ["щ", "shch"],
        ["ч", "ch"],
        ["ш", "sh"],
        ["ж", "zh"],
        ["х", "kh"],
        ["ц", "ts"],
        ["ю", "yu"],
        ["я", "ya"],
        ["ё", "yo"],
      ]
    : [
        ["shch", "щ"],
        ["kh", "х"],
        ["ts", "ц"],
        ["ch", "ч"],
        ["sh", "ш"],
        ["zh", "ж"],
        ["yu", "ю"],
        ["ya", "я"],
        ["yo", "ё"],
      ];

  multiChar.forEach(([from, to]) => {
    result = result.replace(new RegExp(from, "g"), to);
  });

  // Handle single character mappings
  Object.entries(mapping).forEach(([from, to]) => {
    if (from.length === 1) {
      result = result.replace(new RegExp(from, "g"), to);
    }
  });

  return result;
};

const createSearchVariants = (text) => {
  if (!text) return [];

  const normalized = text.toLowerCase().trim();
  const variants = [normalized];

  // Add transliterated versions
  variants.push(transliterate(normalized, true)); // Cyrillic to Latin
  variants.push(transliterate(normalized, false)); // Latin to Cyrillic

  // Add version with ё replaced by е
  variants.push(normalized.replace(/ё/g, "е"));

  return [...new Set(variants)]; // Remove duplicates
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Get today's date
const today = new Date();
// Get date 7 days ago as default start date
const defaultStartDate = new Date();
defaultStartDate.setDate(today.getDate() - 7);

const Stats = () => {
  const { toast } = useToast();

  const [stats, setStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: formatDate(defaultStartDate),
    endDate: formatDate(today),
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState("absent");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superhr/filterAttendance", {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          department_id: selectedDepartment === "all" ? "" : selectedDepartment,
          group_id: selectedGroup === "all" ? "" : selectedGroup,
          status: downloadType,
        },
      });
      setStats(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message ||
          "Davomat ma'lumotlari olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      const allSubDepartments = response.data.flatMap(
        (main) => main.departments
      );
      setDepartments(allSubDepartments);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment === "all") {
      setGroups([]);
      setSelectedGroup("all");
    } else {
      const selectedDept = departments.find(
        (dept) => dept.id === Number.parseInt(selectedDepartment)
      );
      if (selectedDept && selectedDept.groups) {
        setGroups(selectedDept.groups);
      } else {
        setGroups([]);
      }
      setSelectedGroup("all");
    }
  }, [selectedDepartment, departments]);

  useEffect(() => {
    fetchStats();
  }, [dateRange, selectedDepartment, selectedGroup, downloadType]);

  const toggleRow = (employeeId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return format(date, "HH:mm", { locale: ru });
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return text.toLowerCase().trim();
  };

  const filteredStats =
    stats?.data?.filter((stat) => {
      const searchLower = normalizeText(searchTerm);
      if (!searchLower) return true;

      const nameLower = normalizeText(stat?.name);
      const employeeId = stat?.employee_id?.toString() || "";

      // Create search variants for the search term
      const searchVariants = createSearchVariants(searchLower);

      // Create search variants for the employee name
      const nameVariants = createSearchVariants(nameLower);

      // Check if any search variant matches any name variant
      const nameMatch = searchVariants.some((searchVariant) =>
        nameVariants.some((nameVariant) => nameVariant.includes(searchVariant))
      );

      // Also check employee ID
      const idMatch = employeeId.includes(searchLower);

      return nameMatch || idMatch;
    }) || [];

  const totalEmployees = stats?.data?.length || 0;
  const totalPresent =
    stats?.data?.reduce(
      (sum, stat) => sum + (stat?.attendances?.present?.length || 0),
      0
    ) || 0;
  const totalAbsent =
    stats?.data?.reduce(
      (sum, stat) => sum + (stat?.attendances?.absent?.length || 0),
      0
    ) || 0;

  const getAttendanceRate = (stat) => {
    const present = stat?.attendances?.present?.length || 0;
    const absent = stat?.attendances?.absent?.length || 0;
    const total = present + absent;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  // Count employees with 0% attendance
  const zeroPercentCount =
    stats?.data?.filter((stat) => getAttendanceRate(stat) === 0).length || 0;

  const handleExport = async (downloadType = "all") => {
    setDownloading(true);
    try {
      const response = await api.get("/superhr/export-attendance", {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          department_id: selectedDepartment === "all" ? "" : selectedDepartment,
          group_id: selectedGroup === "all" ? "" : selectedGroup,
          status: downloadType, // 'all' or 'absent'
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `davomat_${dateRange.startDate}-${dateRange.endDate}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // optional but good practice
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message ||
          "Davomat ma'lumotlari export qilishda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };
  const handleDelete = async (stat) => {
    const isConfirmed = window.confirm(
      `${stat.name} ni ishdan ketkazishga rozimisiz?`
    );
    if (!isConfirmed) return;

    const reason = window.prompt(
      "Ishdan ketkazish sababini kiriting:",
      "Progulchi"
    );
    if (!reason) {
      toast({
        title: "Xatolik",
        description: "Ishdan ketkazish sababini kiriting",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }

    try {
      await api.patch(`/superhr/employees/${stat.employee_id}`, {
        status: "kicked",
        comment: reason,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ishdan bo'shatildi",
        variant: "default",
        duration: 1500,
      });
      fetchStats();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodim ishdan bo'shatishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Davomat statistikasi
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Xodimlar davomat hisoboti va tahlili
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative bg-white w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              className="w-full sm:w-[180px]"
              disabled={loading}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Bo'lim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              className="w-full sm:w-[180px]"
              disabled={selectedDepartment === "all" || groups.length === 0}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Guruh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha guruhlar</SelectItem>
                {groups
                  ?.sort((a, b) => a.name.localeCompare(b.name))
                  ?.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="text-sm focus:outline-none bg-white"
                  max={dateRange.endDate}
                />
                <div className="flex items-center justify-center text-slate-500">
                  -
                </div>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="text-sm focus:outline-none bg-white"
                  min={dateRange.startDate}
                  max={formatDate(today)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select
                  value={downloadType}
                  onValueChange={setDownloadType}
                  disabled={downloading}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <SelectValue placeholder="Yuklash turi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="absent">Kelmaganlar</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto bg-white"
                  onClick={() => handleExport(downloadType)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                Jami xodimlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {totalEmployees}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                Kelgan kunlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {totalPresent}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                Kelmagan kunlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {totalAbsent}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                0% Davomat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">
                {zeroPercentCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Xodimlar ro'yxati</span>
              <Badge variant="outline">{filteredStats.length} ta xodim</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className={cn(
                "space-y-1",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {filteredStats
                ?.sort(
                  (a, b) =>
                    (b?.attendances?.absent?.length || 0) -
                    (a?.attendances?.absent?.length || 0)
                )
                ?.map((stat, i) => (
                  <div
                    key={i}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    {/* Main Row */}
                    <div
                      className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => toggleRow(stat.employee_id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
                        >
                          {expandedRows[stat.employee_id] ? (
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                              {stat?.name}
                            </h3>
                            <Badge variant="outline" className="text-xs w-fit">
                              ID: {stat?.employee_id}
                            </Badge>
                            <Badge variant="outline" className="text-xs w-fit">
                              {stat?.department}
                            </Badge>
                            {stat?.group && (
                              <Badge
                                variant="outline"
                                className="text-xs w-fit"
                              >
                                {stat?.group}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {stat?.attendances?.present?.length || 0} kelgan
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <UserX className="h-3 w-3 text-red-500 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {stat?.attendances?.absent?.length || 0}{" "}
                                kelmagan
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-lg font-bold text-slate-900">
                            {getAttendanceRate(stat)}%
                          </div>
                          <div className="text-xs text-slate-500 hidden sm:block">
                            Davomat
                          </div>
                        </div>

                        <div className="w-8 sm:w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                            style={{ width: `${getAttendanceRate(stat)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedRows[stat.employee_id] && (
                      <div className="bg-slate-50 border-t border-slate-200">
                        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/superhr/employees/view/${stat.employee_id}`}
                              target="_blank"
                            >
                              <Button variant="outline">
                                <Eye /> Ko'rish
                              </Button>
                            </Link>
                            <Button
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDelete(stat)}
                            >
                              <Axe /> O'chirish
                            </Button>
                          </div>
                          {/* Present Days */}
                          {stat?.attendances?.present?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                <UserCheck className="h-4 w-4 text-green-500" />
                                Kelgan kunlari (
                                {stat.attendances.present.length})
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                {stat.attendances.present
                                  ?.sort(
                                    (a, b) =>
                                      new Date(b.date) - new Date(a.date)
                                  )
                                  ?.map((day, idx) => (
                                    <Card
                                      key={`present-${idx}`}
                                      className="bg-white border-l-4 border-l-green-500"
                                    >
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                            <div className="text-center sm:text-left">
                                              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                                                {new Date(
                                                  day.date
                                                ).toLocaleDateString("ru-RU")}
                                              </div>
                                              <div className="text-xs text-slate-500">
                                                {format(
                                                  new Date(day.date),
                                                  "EEEE",
                                                  { locale: ru }
                                                )}
                                              </div>
                                            </div>

                                            <Separator
                                              orientation="vertical"
                                              className="h-8 hidden sm:block"
                                            />

                                            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6">
                                              <div className="text-center">
                                                <div className="text-sm font-medium text-green-600">
                                                  {formatDateTime(day.check_in)}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                  Kelish
                                                </div>
                                              </div>

                                              <div className="text-center">
                                                <div className="text-sm font-medium text-blue-600">
                                                  {day.check_out
                                                    ? formatDateTime(
                                                        day.check_out
                                                      )
                                                    : "-"}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                  Ketish
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            {day.check_in_image && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="gap-2 text-xs"
                                              >
                                                <a
                                                  href={day.check_in_image}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                  <span className="hidden sm:inline">
                                                    Kelish rasmi
                                                  </span>
                                                  <span className="sm:hidden">
                                                    Kelish
                                                  </span>
                                                </a>
                                              </Button>
                                            )}
                                            {day.check_out_image && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="gap-2 text-xs"
                                              >
                                                <a
                                                  href={day.check_out_image}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                  <span className="hidden sm:inline">
                                                    Ketish rasmi
                                                  </span>
                                                  <span className="sm:hidden">
                                                    Ketish
                                                  </span>
                                                </a>
                                              </Button>
                                            )}
                                            {!day.check_in_image &&
                                              !day.check_out_image && (
                                                <span className="text-xs text-slate-500 text-center">
                                                  Rasm mavjud emas
                                                </span>
                                              )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Absent Days */}
                          {stat?.attendances?.absent?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                <UserX className="h-4 w-4 text-red-500" />
                                Kelmagan kunlari (
                                {stat.attendances.absent.length})
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                {stat.attendances.absent
                                  ?.sort(
                                    (a, b) =>
                                      new Date(b.date) - new Date(a.date)
                                  )
                                  ?.map((day, idx) => (
                                    <Card
                                      key={`absent-${idx}`}
                                      className="bg-white border-l-4 border-l-red-500"
                                    >
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                            <div className="text-center sm:text-left">
                                              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                                                {new Date(
                                                  day.date
                                                ).toLocaleDateString("ru-RU")}
                                              </div>
                                              <div className="text-xs text-slate-500">
                                                {format(
                                                  new Date(day.date),
                                                  "EEEE",
                                                  { locale: ru }
                                                )}
                                              </div>
                                            </div>

                                            <Separator
                                              orientation="vertical"
                                              className="h-8 hidden sm:block"
                                            />

                                            <Badge
                                              variant="destructive"
                                              className="gap-1 w-fit"
                                            >
                                              <UserX className="h-3 w-3" />
                                              Kelmagan
                                            </Badge>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {filteredStats.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Hech qanday ma'lumot topilmadi
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    Qidiruv shartlaringizni o'zgartirib ko'ring
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
