"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  X,
  Users,
  Clock,
  Package,
  Loader2,
  ChevronDown,
  Building2,
  Timer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import api from "@/utils/api";

const View = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [availableTarifs, setAvailableTarifs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const searchInputRef = useRef(null);
  const [times, setTimes] = useState([]);
  const [selectedTimeId, setSelectedTimeId] = useState(null);
  const [searchingTarifs, setSearchingTarifs] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Function to normalize text for search (converts Cyrillic to Latin for comparison)
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[ёЁ]/g, "yo")
      .replace(/йо|йё|йе/gi, "yo")
      .replace(/ч/gi, "ch")
      .replace(/ш/gi, "sh")
      .replace(/щ/gi, "sh")
      .replace(/ғ/gi, "g'")
      .replace(/ў/gi, "o'")
      .replace(/қ/gi, "q")
      .replace(/ҳ/gi, "h")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[й]/g, "y")
      .replace(/[ц]/g, "ts")
      .replace(/[у]/g, "u")
      .replace(/[к]/g, "k")
      .replace(/[еёэ]/g, "e")
      .replace(/[н]/g, "n")
      .replace(/[г]/g, "g")
      .replace(/[з]/g, "z")
      .replace(/[х]/g, "x")
      .replace(/[ъ]/g, "'")
      .replace(/[ф]/g, "f")
      .replace(/[ы]/g, "i")
      .replace(/[в]/g, "v")
      .replace(/[а]/g, "a")
      .replace(/[п]/g, "p")
      .replace(/[р]/g, "r")
      .replace(/[о]/g, "o")
      .replace(/[л]/g, "l")
      .replace(/[д]/g, "d")
      .replace(/[ж]/g, "j")
      .replace(/[я]/g, "ya")
      .replace(/[с]/g, "s")
      .replace(/[м]/g, "m")
      .replace(/[иі]/g, "i")
      .replace(/[т]/g, "t")
      .replace(/[ь]/g, "'")
      .replace(/[б]/g, "b")
      .replace(/[ю]/g, "yu")
      .replace(/yo+/g, "yo")
      .replace(/([aeiou])['`]?([aeiou])/g, "$1'$2")
      .replace(/['`]+/g, "'")
      .replace(/ +/g, " ")
      .trim();
  };

  // Filter employees based on search term
  useEffect(() => {
    if (!employeeSearchTerm.trim()) {
      setEmployees(allEmployees);
      return;
    }

    const searchTermNormalized = normalizeText(employeeSearchTerm);

    const filtered = allEmployees.filter((employee) => {
      const nameNormalized = normalizeText(employee.name);
      return nameNormalized.includes(searchTermNormalized);
    });

    setEmployees(filtered);
  }, [employeeSearchTerm, allEmployees]);

  // Debounce search term for tarifs
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Call search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      searchTarifs(debouncedSearchTerm);
    } else {
      setAvailableTarifs([]);
    }
  }, [debouncedSearchTerm]);

  const fetchTimes = async () => {
    try {
      const response = await api.get("/resultChecker/times");
      setTimes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/resultChecker/employeeResults", {
        params: {
          group_id: id,
        },
      });
      setAllEmployees(response.data);
      setEmployees(response.data);
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

  const searchTarifs = async (term) => {
    setSearchingTarifs(true);
    try {
      const response = await api.get("/resultChecker/tarifications/search", {
        params: {
          search: term,
        },
      });
      setAvailableTarifs(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSearchingTarifs(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTimes();
  }, []);

  const handleAddTarif = (employee) => {
    setCurrentEmployee(employee);
    setSelectedTarif(null);
    setSearchTerm("");
    setQuantity(1);
    setSelectedTimeId(null);
    setIsModalOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSelectTarif = (tarif) => {
    setSelectedTarif(tarif);
    setSearchTerm(tarif.name);
    setAvailableTarifs([]);
  };

  const handleSubmit = async () => {
    if (!selectedTarif || !quantity || quantity < 1 || !selectedTimeId) {
      toast({
        title: "Xatolik",
        description: "Iltimos, barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/resultChecker/employeeResults`, {
        employee_id: currentEmployee.id,
        tarification_id: selectedTarif.id,
        quantity: Number(quantity),
        time_id: selectedTimeId,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: `${selectedTarif.name} - ${quantity} ta qo'shildi`,
      });

      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
    setSelectedTarif(null);
    setSearchTerm("");
    setQuantity(1);
    setSelectedTimeId(null);
    setAvailableTarifs([]);
  };

  const getTotalTasks = (employee) => {
    return (
      employee?.employee_results?.reduce(
        (total, result) => total + result.quantity,
        0
      ) || 0
    );
  };

  const getTotalEarnings = (employee) => {
    return (
      employee?.employee_results?.reduce(
        (total, result) => total + result.quantity * result.tarification.summa,
        0
      ) || 0
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Xodimlar ro'yxati
                </h1>
                <p className="text-gray-600 mt-1">
                  Jami {employees?.length} ta xodim
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Jami bajarilgan</p>
                <p className="text-2xl font-bold text-blue-600">
                  {parseFloat(
                    employees?.reduce(
                      (total, emp) => total + getTotalTasks(emp),
                      0
                    )
                  )?.toLocaleString("ru-RU")}{" "}
                  ta
                </p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <Input
            placeholder="Xodim ismi bo'yicha qidirish..."
            className="pl-6 h-12 text-lg bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
            value={employeeSearchTerm}
            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
          />
        </div>

        {/* Employee Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees
            ?.sort((a, b) => a?.name.localeCompare(b?.name))
            ?.map((employee) => (
              <Card
                key={employee?.id}
                className="group hover:shadow-xl h-fit transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-[1.02]"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {employee?.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {employee?.id}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                      >
                        {getTotalTasks(employee)?.toLocaleString("ru-RU")} ta
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        {getTotalEarnings(employee)?.toLocaleString("ru-RU")}{" "}
                        so'm
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tasks List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Package className="w-4 h-4" />
                      Bajarilgan ishlar
                    </div>

                    {employee?.employee_results?.length > 0 ? (
                      <div
                        className="space-y-2 overflow-y-auto pr-2 h-fit max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#CBD5E1 #F1F5F9",
                        }}
                      >
                        {employee.employee_results
                          ?.sort((a, b) => a.time?.id - b.time?.id)
                          ?.map((result) => (
                            <div
                              key={result?.id}
                              className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {result?.tarification?.code}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {result?.tarification?.name}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs bg-white"
                                >
                                  {result?.quantity} ta
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {result?.tarification?.second}s
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {result?.time?.time?.slice(0, 5)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {parseFloat(
                                    result?.quantity *
                                      result?.tarification?.summa
                                  )?.toLocaleString("ru-RU")}{" "}
                                  so'm
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Hali hech qanday ish bajarilmagan
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={() => handleAddTarif(employee)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi ish qo'shish
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Empty State */}
        {employees?.length === 0 && (
          <Card className="text-center py-16 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Xodimlar topilmadi
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Hozircha bu guruhda xodimlar mavjud emas yoki qidiruv natijasida
                hech kim topilmadi
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Tarif Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-white">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                Yangi ish qo'shish
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                <span className="font-medium text-gray-900">
                  {currentEmployee?.name}
                </span>{" "}
                uchun yangi ish qo'shish
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Search Section */}
              <div className="space-y-3">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700"
                >
                  Ish turini qidiring
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    ref={searchInputRef}
                    placeholder="Ish nomi yoki kodi bo'yicha qidiring..."
                    className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedTarif(null);
                        setAvailableTarifs([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {searchingTarifs && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {!selectedTarif && searchTerm && availableTarifs.length > 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-0">
                    <div
                      className="max-h-64 overflow-y-auto"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#CBD5E1 #F1F5F9",
                      }}
                    >
                      {availableTarifs.map((tarif, index) => (
                        <div
                          key={tarif.id}
                          className={`flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors ${
                            index !== availableTarifs.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                          onClick={() => handleSelectTarif(tarif)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {tarif.code}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {tarif.second}s
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">
                              {tarif.name}
                            </p>
                            <p className="text-sm text-green-600 font-medium">
                              {tarif.summa.toLocaleString()} so'm
                            </p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Results */}
              {!selectedTarif &&
                searchTerm &&
                availableTarifs.length === 0 &&
                !searchingTarifs &&
                searchTerm.length >= 2 && (
                  <Card className="border border-gray-200">
                    <CardContent className="text-center py-8">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        "{searchTerm}" bo'yicha hech narsa topilmadi
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Selected Tarif Details */}
              {selectedTarif && (
                <div className="space-y-6">
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-white">
                              {selectedTarif.code}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-white text-gray-600"
                            >
                              {selectedTarif.second}s
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {selectedTarif.name}
                          </h4>
                          <p className="text-sm text-green-600 font-medium">
                            Narx: {selectedTarif.summa.toLocaleString()} so'm
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-white/80"
                          onClick={() => {
                            setSelectedTarif(null);
                            setSearchTerm("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quantity Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="quantity"
                        className="text-sm font-medium text-gray-700"
                      >
                        Miqdori
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Number.parseInt(e.target.value))
                        }
                        className="text-center bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Vaqt
                      </Label>
                      <Select
                        value={selectedTimeId?.toString() || ""}
                        onValueChange={(e) => setSelectedTimeId(Number(e))}
                        className="w-full bg-gray-50 border-gray-200 focus:bg-white"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vaqtni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {times
                            .filter((time) => time.time !== "07:30:00")
                            .map((time) => (
                              <SelectItem
                                key={time.id}
                                value={time.id.toString()}
                              >
                                {time.time.slice(0, 5)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Summary */}
                  {quantity && selectedTarif && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Jami summa:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {(quantity * selectedTarif.summa).toLocaleString()}{" "}
                            so'm
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      className="flex-1 h-11"
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedTimeId}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Jo'natilmoqda...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Qo'shish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default View;
