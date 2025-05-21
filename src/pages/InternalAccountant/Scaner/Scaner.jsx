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
  Plus,
  Trash2,
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
  const [extraResults, setExtraResults] = useState({});
  const [othersWork, setOthersWork] = useState([]);

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
        response.data?.plan?.items?.forEach((item) => {
          initialResults[item.id] = item?.actual || "";
        });
        setResults(initialResults);

        // Initialize extra results state with current values
        const initialExtraResults = {};
        response.data?.extra_logs?.forEach((item) => {
          initialExtraResults[item.id] = item?.quantity || "";
        });
        setExtraResults(initialExtraResults);
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
            response.data?.plan?.items?.forEach((item) => {
              initialResults[item.id] = item?.actual || "";
            });
            setResults(initialResults);

            // Initialize extra results state with current values
            const initialExtraResults = {};
            response.data?.extra_logs?.forEach((item) => {
              initialExtraResults[item.id] = item?.quantity || "";
            });
            setExtraResults(initialExtraResults);
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

  // Handle input change for extra result fields
  const handleExtraResultChange = (id, value) => {
    setExtraResults((prev) => ({
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
        tarifications: [
          // Include regular tarifications
          ...data.plan.items.map((item) => ({
            id: item.tarification.id,
            quantity: Number.parseInt(results[item.id] || item.actual || 0),
          })),
          ...data.extra_logs.map((item) => ({
            id: item.tarification.id,
            quantity: Number.parseInt(
              extraResults[item.id] || item.quantity || 0
            ),
          })),
          // Include other works in the tarifications array
          ...othersWork
            .filter((work) => work.tarification_id && work.quantity) // Only include complete entries
            .map((work) => ({
              id: work.tarification_id,
              quantity: Number.parseInt(work.quantity || 0),
            })),
        ],
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
      setExtraResults({});
      setOthersWork([]); // Clear other works after submission
    } catch (error) {
      console.log(error);
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

  const handleOthersWork = () => {
    setOthersWork((prev) => [
      ...prev,
      {
        tarification_id: "",
        name: "",
        quantity: "",
      },
    ]);
  };

  // Add a new ref for other works debounce
  const othersWorkDebounceRef = useRef({});

  const handleOthersWorkChange = (index, field, value) => {
    const updatedOthersWork = [...othersWork];

    if (field === "code") {
      // Update the code value immediately
      updatedOthersWork[index] = {
        ...updatedOthersWork[index],
        code: value,
      };
      setOthersWork(updatedOthersWork);

      // Clear any existing timeout for this index
      if (othersWorkDebounceRef.current[index]) {
        clearTimeout(othersWorkDebounceRef.current[index]);
      }

      // Set a new timeout for this index
      othersWorkDebounceRef.current[index] = setTimeout(() => {
        // Only fetch if the code has a value
        if (value) {
          // Show loading state for this row
          const loadingOthersWork = [...updatedOthersWork];
          loadingOthersWork[index] = {
            ...loadingOthersWork[index],
            name: "Yuklanmoqda...",
          };
          setOthersWork(loadingOthersWork);

          // Fetch tarification data based on code
          api
            .get(`/internalAccountant/tarifications/show`, {
              params: {
                code: value,
              },
            })
            .then((response) => {
              // Update the current row instead of adding a new one
              setOthersWork((current) => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  tarification_id: response.data.id,
                  name: response.data?.name,
                  code: value,
                };
                return updated;
              });
            })
            .catch((error) => {
              // Reset the name field on error
              setOthersWork((current) => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  name: "Topilmadi",
                };
                return updated;
              });

              toast({
                title: "Xatolik",
                description:
                  error.response?.data?.message || "Tarifikatsiya topilmadi",
                variant: "destructive",
              });
            });
        }
      }, 800); // Same debounce delay as the main scanner
    } else {
      // For other fields like quantity, just update the value
      updatedOthersWork[index][field] = value;
      setOthersWork(updatedOthersWork);
    }
  };

  const handleOthersWorkRemove = (index) => {
    const updatedOthersWork = [...othersWork];
    updatedOthersWork.splice(index, 1);
    setOthersWork(updatedOthersWork);
  };

  // Clean up debounce timers when component unmounts
  useEffect(() => {
    return () => {
      // Clear main debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear all other works debounce timers
      Object.values(othersWorkDebounceRef.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  return (
    <Card className="w-full shadow-md rounded-none">
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
                      {data.plan?.employee?.name || ""}
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
                      {formatDate(data.plan?.date)}
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
                      {formatNumber(data?.plan?.total_work_minutes)} daqiqa
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
                      {formatNumber(data?.plan?.used_minutes)} daqiqa
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
                    <span className="font-semibold">{data?.plan?.id}</span>
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
                        Number.parseFloat(data?.plan?.total_work_minutes) -
                          Number.parseFloat(data?.plan?.used_minutes)
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
                      {formatNumber(data?.plan?.total_earned)} so'm
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
                        data?.plan?.items?.reduce(
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

            <div className="border border-slate-200 overflow-hidden shadow-md">
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
                  {data?.plan?.items
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

            {data?.extra_logs?.length > 0 && (
              <div className="border border-slate-200 overflow-hidden shadow-md">
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
                        Natija
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.extra_logs
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
                            </div>
                          </TableCell>
                          <TableCell className="text-center border border-slate-200">
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-sm">
                                {formatNumber(item?.tarification?.summa)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="border border-slate-200">
                            <Input
                              value={extraResults[item.id] || ""}
                              onChange={(e) =>
                                handleExtraResultChange(item.id, e.target.value)
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
            )}

            {othersWork?.length > 0 && (
              <div className="mt-4 border border-slate-200 overflow-hidden shadow-md">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-medium text-center border border-slate-200">
                        Kod
                      </TableHead>
                      <TableHead className="font-medium border border-slate-200">
                        Nomi
                      </TableHead>
                      <TableHead className="font-medium text-center border border-slate-200">
                        Miqdori
                      </TableHead>
                      <TableHead className="font-medium text-center border border-slate-200 w-24">
                        Amallar
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {othersWork.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="border border-slate-200">
                          <Input
                            placeholder="Kodi"
                            value={item.code || ""}
                            className="bg-white"
                            onChange={(e) =>
                              handleOthersWorkChange(
                                index,
                                "code",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="border border-slate-200">
                          {item.name || ""}
                        </TableCell>
                        <TableCell className="border border-slate-200">
                          <Input
                            placeholder="Miqdori"
                            value={item.quantity || ""}
                            type="number"
                            min="0"
                            className="bg-white text-center"
                            onChange={(e) =>
                              handleOthersWorkChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="border border-slate-200 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOthersWorkRemove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={handleOthersWork}>
                <Plus className="h-4 w-4" />
                Boshqa ish
              </Button>
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
