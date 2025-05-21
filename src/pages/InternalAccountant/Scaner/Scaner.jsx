"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CreditCard,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  ClipboardList,
  DollarSign,
  TimerOff,
  Timer,
  Barcode,
  Save,
  FileDigit,
} from "lucide-react";
import api from "@/utils/api";

const Scanner = () => {
  const { toast } = useToast();
  const debounceTimerRef = useRef(null);

  const [scannedData, setScannedData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [results, setResults] = useState({});

  // Fetch data when ID is scanned
  const fetchData = useCallback(() => {
    if (!scannedData) return;

    setIsLoading(true);
    const sendingData = scannedData.split("A")[1] || scannedData;

    api
      .get(`/internalAccountant/dailyPlan/${sendingData}`)
      .then((response) => {
        setData(response.data);

        // Initialize results state with current values
        const initialResults = {};
        response.data?.items?.forEach((item) => {
          initialResults[item.id] = item?.actual || "";
        });
        setResults(initialResults);
      })
      .catch((error) => {
        toast({
          title: "Xatolik",
          description: error.response?.data?.message || "Nimadir xato ketdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [scannedData, toast]);

  // Handle input change with proper debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setScannedData(value);

    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set debounce timer if there's a value
    if (value) {
      debounceTimerRef.current = setTimeout(() => {
        // Use a closure to capture the current value
        const currentValue = value;
        const sendingData = currentValue.split("A")[1] || currentValue;

        setIsLoading(true);
        api
          .get(`/internalAccountant/dailyPlan/${sendingData}`)
          .then((response) => {
            setData(response.data);

            // Initialize results state with current values
            const initialResults = {};
            response.data?.items?.forEach((item) => {
              initialResults[item.id] = item?.actual || "";
            });
            setResults(initialResults);
          })
          .catch((error) => {
            toast({
              title: "Xatolik",
              description:
                error.response?.data?.message || "Nimadir xato ketdi",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && scannedData) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      fetchData();
    }
  };

  // Cleanup the debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle input change for result fields
  const handleResultChange = (id, value) => {
    setResults((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!data) return;

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const formData = {
        employee_id: data.employee_id || 1725, // Fallback to example value if not available
        daily_plan_id: data.id || Number.parseInt(scannedData),
        tarifications: data.items.map((item) => ({
          id: item.tarification.id,
          quantity: Number.parseInt(results[item.id] || item.actual || 0),
        })),
      };

      // Send data to API
      const response = await api.post(
        "/internalAccountant/employeeSalaryCalculation",
        formData
      );

      toast({
        title: "Muvaffaqiyatli",
        description:
          response.data.message || "Ma'lumotlar muvaffaqiyatli saqlandi",
        style: {
          background: "green",
          color: "white",
        },
      });

      // Reset form after successful submission, but keep the scanned data
      setData(null);
      fetchData();
      setResults({});
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("-").reverse().join(".");
  };

  const formatNumber = (number) => {
    if (number === undefined || number === null) return "0";
    return Number.parseFloat(number).toLocaleString("ru-RU");
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50">
        <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
          <Barcode className="mr-2 h-5 w-5 text-primary" />
          Kunlik reja skaneri
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Input
              autoFocus
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              value={scannedData}
              disabled={isLoading || isSubmitting}
              placeholder="ID ni skaner qiling"
              className="pl-10"
            />
            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(scannedData)}
            disabled={!scannedData || isLoading || isSubmitting}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Xodim:
                    </span>
                    <span className="font-semibold">
                      {data.employee?.name || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Sana:
                    </span>
                    <span className="font-semibold">
                      {formatDate(data.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-full">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Umumiy vaqt:
                    </span>
                    <span className="font-semibold">
                      {formatNumber(data?.total_work_minutes)} daqiqa
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-full">
                      <Timer className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Ishga ketadigan vaqt:
                    </span>
                    <span className="font-semibold">
                      {formatNumber(data?.used_minutes)} daqiqa
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-4 border-l-indigo-500 shadow-sm hover:shadow transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-full">
                      <FileDigit className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      ID:
                    </span>
                    <span className="font-semibold">{data?.id}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-full">
                      <TimerOff className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Qo'shimcha vaqt:
                    </span>
                    <span className="font-semibold">
                      {formatNumber(
                        Number.parseFloat(data?.total_work_minutes) -
                          Number.parseFloat(data?.used_minutes)
                      )}{" "}
                      daqiqa
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-full">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Umumiy summa:
                    </span>
                    <span className="font-semibold">
                      {formatNumber(data?.total_earned)} so'm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-full">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Xodim topgan pul:
                    </span>
                    <span className="font-semibold">
                      {formatNumber(
                        data?.items?.reduce(
                          (acc, item) =>
                            acc + item?.actual * item?.tarification?.summa,
                          0
                        )
                      )}{" "}
                      so'm
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden shadow-md">
              <Table className="border-collapse">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-medium text-center border border-slate-200">
                      Kod
                    </TableHead>
                    <TableHead className="font-medium border border-slate-200">
                      Ish nomi
                    </TableHead>
                    <TableHead className="font-medium text-center border border-slate-200">
                      Vaqt (sekund)
                    </TableHead>
                    <TableHead className="font-medium text-center border border-slate-200">
                      Narxi (so'm)
                    </TableHead>
                    <TableHead className="font-medium text-center border border-slate-200">
                      Reja
                    </TableHead>
                    <TableHead className="font-medium text-center border border-slate-200">
                      Natija
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items
                    ?.sort((a, b) =>
                      a.tarification.code.localeCompare(
                        b.tarification.code,
                        undefined,
                        {
                          numeric: true,
                          sensitivity: "base",
                        }
                      )
                    )
                    .map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center font-medium border border-slate-200">
                          <Badge variant="outline">
                            {item?.tarification?.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="border border-slate-200">
                          {item?.tarification?.name}
                        </TableCell>
                        <TableCell className="text-center border border-slate-200">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm">
                              {formatNumber(item?.tarification?.second)}
                            </div>
                            <div className="w-full h-[1px] bg-slate-200"></div>
                            <div className="text-sm font-medium">
                              {formatNumber(
                                item?.tarification?.second * item?.count
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center border border-slate-200">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm">
                              {formatNumber(item?.tarification?.summa)}
                            </div>
                            <div className="w-full h-[1px] bg-slate-200"></div>
                            <div className="text-sm font-medium">
                              {formatNumber(
                                item?.tarification?.summa * item?.count
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium border border-slate-200">
                          {item?.count}
                        </TableCell>
                        <TableCell className="border border-slate-200">
                          <Input
                            value={results[item.id] || ""}
                            onChange={(e) =>
                              handleResultChange(item.id, e.target.value)
                            }
                            disabled={isSubmitting}
                            type="number"
                            min="0"
                            className="text-center min-w-[100px]"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Saqlash
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : scannedData && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 bg-red-50 rounded-full mb-3">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
            <p className="text-slate-700 font-medium">Ma'lumot topilmadi</p>
            <p className="text-sm text-slate-500 mt-1">
              Boshqa ID ni skaner qilib ko'ring
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <Barcode className="h-12 w-12 text-primary/70" />
            </div>
            <p className="text-slate-700 font-medium">ID skanerdan o'tkazing</p>
            <p className="text-sm text-slate-500 mt-1">
              Natijalarni ko'rish uchun ID ni kiriting
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Scanner;
