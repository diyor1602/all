"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  QrCode,
  RefreshCw,
  Zap,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";

const NakladnoySkanner = () => {
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const inputRef = useRef(null);
  const [data, setData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableTarifs, setAvailableTarifs] = useState([]);
  const [selectedTarifs, setSelectedTarifs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState([]);

  const resetForm = () => {
    setCode("");
    setData(null);
    setSelectedTarifs([]);
    setSearchTerm("");
    setAvailableTarifs([]);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;

    // If the value contains multiple A prefixes, only keep the first complete entry
    if (value.indexOf("A", 1) !== -1) {
      const firstCompleteEntry = value.substring(0, value.indexOf("A", 1));
      setCode(firstCompleteEntry);
    } else {
      setCode(value);
    }

    // Always keep the input focused
    inputRef.current?.focus();
  };

  const getEmpDetails = async () => {
    try {
      const response = await api.get(
        `/internalAccountant/employees/${selectedEmp}`
      );
      setEmpDetails(response.data?.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.response?.data?.message || "Xatolik",
        description: "Xodim ma'lumotlari olishda xatolik",
      });
    }
  };

  useEffect(() => {
    if (selectedEmp) {
      getEmpDetails();
    }
  }, [selectedEmp]);

  useEffect(() => {
    if (data) {
      setCode("");
      inputRef.current?.focus();
    }
  }, [data]);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("nakladnoyHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        // ignore
      }
    }
  }, []);

  const handleScan = () => {
    if (!code) return;

    try {
      setIsScanning(true);

      const employeeID = code.split("+")[0];
      const date = code.split("+")[1];

      setSelectedEmp(
        employeeID?.startsWith("A") ? employeeID?.split("A")[1] : employeeID
      );
      setSelectedDate(date);

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar muvaffaqiyatli yuklandi",
        variant: "default",
        duration: 1000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kodni o'qishda xatolik",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getTarifs = async () => {
    if (!searchTerm.trim()) {
      setAvailableTarifs([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get(
        `/internalAccountant/tarifications/search`,
        {
          params: {
            search: searchTerm,
          },
        }
      );
      setAvailableTarifs(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.response?.data?.message || "Xatolik",
        description: "Tariflar olishda xatolik",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      getTarifs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const addTarification = (tarif) => {
    const isAlreadySelected = selectedTarifs.some(
      (item) => item.id === tarif.id
    );

    if (isAlreadySelected) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Bu tarifikatsiya allaqachon tanlangan",
      });
      return;
    }

    setSelectedTarifs((prev) => [...prev, { ...tarif, quantity: 1 }]);
    setSearchTerm("");
    setAvailableTarifs([]);

    toast({
      title: "Qo'shildi",
      description: `${tarif.name} ro'yxatga qo'shildi`,
      duration: 1000,
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    setSelectedTarifs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeTarification = (id) => {
    setSelectedTarifs((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "O'chirildi",
      description: "Tarifikatsiya ro'yxatdan o'chirildi",
      duration: 1000,
    });
  };

  const calculateTotal = () => {
    return selectedTarifs.reduce((total, item) => {
      return total + Number.parseFloat(item.summa) * item.quantity;
    }, 0);
  };

  const addToHistory = (data) => {
    const historyItem = {
      id: Date.now(),
      date: new Date().toISOString(),
      employee: empDetails,
      tarifs: selectedTarifs.map((t) => ({
        ...t,
        total: Number.parseFloat(t.summa) * t.quantity,
      })),
      total: calculateTotal(),
    };

    const newHistory = [historyItem, ...history].slice(0, 10); // Keep only last 10 items
    setHistory(newHistory);
    localStorage.setItem("nakladnoyHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("nakladnoyHistory");
    toast({
      title: "Tarix tozalandi",
      description: "Barcha tarix ma'lumotlari o'chirildi",
      duration: 2000,
    });
  };

  const handleSubmit = async () => {
    if (!selectedEmp || selectedTarifs.length === 0) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodim va kamida bitta tarifikatsiya tanlang",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employee_id: selectedEmp,
        tarifications: selectedTarifs.map((work) => ({
          id: work.id,
          quantity: Number.parseInt(work.quantity),
        })),
        date: selectedDate,
      };

      await api.post(`/internalAccountant/salaryCalculate`, payload);

      // Add to history before resetting
      addToHistory(payload);

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar muvaffaqiyatli yuborildi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 1500,
      });

      // Reset selected tarifications after successful submission
      setSelectedTarifs([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.response?.data?.message || "Xatolik",
        description: "Ma'lumotlarni yuborishda xatolik",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Nakladnoy Skaneri
        </h1>
        <p className="text-muted-foreground text-lg">
          Xodimlar va vazifalarni skanerlash va ma'lumotlarni ko'rish uchun
        </p>
      </div>

      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <span>Vazifa kodi</span>
          </CardTitle>
          <CardDescription>
            Vazifa kodini kiriting yoki skaner orqali o'qiting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Kodni kiriting"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleScan();
                }
              }}
              className="text-lg py-3"
              autoFocus
            />
            {isScanning && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={!code && !data && selectedTarifs.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tozalash
          </Button>
          <Button onClick={handleScan} disabled={!code || isScanning} size="lg">
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skanerlanmoqda...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Skanerlash
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {selectedEmp && empDetails && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              Xodim Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">ID</p>
                <p className="text-lg font-semibold">{empDetails?.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Sana</p>
                <p className="text-lg font-semibold">
                  {selectedDate?.split("-")?.reverse()?.join(".")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Xodim</p>
                <p className="text-lg font-semibold">{empDetails?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Bo'lim</p>
                <p className="text-lg font-semibold">
                  {empDetails?.department?.name || "-"}
                </p>
              </div>
            </div>
            {empDetails?.group?.name && (
              <div className="mt-4">
                <Badge variant="secondary" className="text-sm">
                  Guruh: {empDetails.group.name}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedEmp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Tarifikatsiya Qidirish
            </CardTitle>
            <CardDescription>
              Tarifikatsiya nomini kiriting va ro'yxatdan tanlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tarifikatsiya nomini kiriting..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {availableTarifs.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {availableTarifs.map((tarif) => (
                  <div
                    key={tarif.id}
                    className="flex items-center gap-2 flex-wrap justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => addTarification(tarif)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{tarif.name}</h4>
                        <Badge variant="outline">{tarif.code}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tarif.second}s
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {tarif.summa} so'm
                        </span>
                        <span>Razryad: {tarif.razryad?.name}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTarifs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tanlangan Tarifikatsiyalar
              </span>
              <Badge variant="secondary">{selectedTarifs.length} ta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTarifs.map((tarif) => (
                <div
                  key={tarif.id}
                  className="border rounded-lg p-3 sm:p-4 bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-semibold text-base sm:text-lg break-words">
                          {tarif.name}
                        </h4>
                        <Badge className="whitespace-nowrap">
                          {tarif.code}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div className="break-words">
                          <span className="text-gray-600">Vaqt: </span>
                          <span className="font-medium">{tarif.second}s</span>
                        </div>
                        <div className="break-words">
                          <span className="text-gray-600">Narx: </span>
                          <span className="font-medium">
                            {tarif.summa} so'm
                          </span>
                        </div>
                        <div className="break-words">
                          <span className="text-gray-600">Razryad: </span>
                          <span className="font-medium">
                            {tarif.razryad?.name || "-"}
                          </span>
                        </div>
                        <div className="break-words">
                          <span className="text-gray-600">Jami: </span>
                          <span className="font-bold text-green-600 whitespace-nowrap">
                            {(
                              Number.parseFloat(tarif.summa) * tarif.quantity
                            ).toLocaleString("ru-RU")}{" "}
                            so'm
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end sm:justify-start gap-2 mt-2 sm:mt-0 sm:ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(tarif.id, tarif.quantity - 1)
                        }
                        disabled={tarif.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={tarif.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            tarif.id,
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="w-24 text-center"
                        min="1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(tarif.id, tarif.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeTarification(tarif.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-lg sm:text-xl font-bold">
                Umumiy summa:{" "}
                <span className="text-green-600">
                  {calculateTotal().toLocaleString("ru-RU")} so'm
                </span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedTarifs.length === 0}
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ma'lumotlarni Yuborish
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Tarix
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Tozalash
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">
                      {new Date(item.date).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.employee?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {item.total.toLocaleString("ru-RU")} so'm
                  </Badge>
                </div>

                <div className="space-y-2 mt-2">
                  {item.tarifs.map((tarif, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">{tarif.name}</span>
                      <span className="font-medium">
                        {tarif.quantity} x {tarif.summa} ={" "}
                        <span className="text-green-600">
                          {tarif.total.toLocaleString("ru-RU")} so'm
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NakladnoySkanner;
