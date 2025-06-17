"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const View = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Xodimlar ro'yxati
          </h1>
          <p className="text-sm text-muted-foreground">
            Jami {employees?.length} ta xodim
          </p>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid gap-4">
        {employees
          ?.sort((a, b) => a?.name.localeCompare(b?.name))
          ?.map((employee) => (
            <Card
              key={employee?.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{employee?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ID: {employee?.id}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {getTotalTasks(employee)} ta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tasks List */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="w-4 h-4" />
                    Bajarilgan ishlar
                  </div>
                  {employee?.employee_results?.length > 0 ? (
                    <ScrollArea>
                      <div className="space-y-1">
                        {employee.employee_results.map((result) => (
                          <div
                            key={result?.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                          >
                            <span className="truncate">
                              {result?.tarification?.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="mr-auto ml-2 text-xs"
                            >
                              {result?.tarification?.second} sekund
                            </Badge>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {result?.time?.time?.slice(0, 5)}
                            </Badge>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {result?.quantity} ta
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Hali hech qanday ish bajarilmagan
                    </p>
                  )}
                </div>

                {/* Add Button */}
                <Button
                  onClick={() => handleAddTarif(employee)}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ish qo'shish
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Empty State */}
      {employees?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Xodimlar topilmadi</h3>
            <p className="text-muted-foreground">
              Hozircha bu guruhda xodimlar mavjud emas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Tarif Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Yangi ish qo'shish
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{currentEmployee?.name}</span> uchun
              yangi ish qo'shish
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Search Section */}
            <div className="space-y-3">
              <Label htmlFor="search" className="text-sm font-medium">
                Ish turini qidiring
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  ref={searchInputRef}
                  placeholder="Ish nomi bo'yicha qidiring..."
                  className="pl-10 pr-10"
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
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search Results */}
            {!selectedTarif && searchTerm && availableTarifs.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-48">
                    {availableTarifs.map((tarif) => (
                      <div
                        key={tarif.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectTarif(tarif)}
                      >
                        <div>
                          <p className="font-medium">{tarif.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tarif.summa} so'm
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!selectedTarif &&
              searchTerm &&
              availableTarifs.length === 0 &&
              !searchingTarifs &&
              searchTerm.length >= 2 && (
                <Card>
                  <CardContent className="text-center py-6">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Hech narsa topilmadi
                    </p>
                  </CardContent>
                </Card>
              )}

            {/* Selected Tarif Details */}
            {selectedTarif && (
              <div className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedTarif.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Narx:{" "}
                          <span className="font-medium">
                            {selectedTarif.summa} so'm
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
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

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Miqdori
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number.parseInt(e.target.value)))
                    }
                    className="text-center"
                  />
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Vaqtni tanlang
                  </Label>
                  <Select
                    value={selectedTimeId?.toString() || ""}
                    onValueChange={(value) => setSelectedTimeId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vaqtni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {times
                        .filter((time) => time.time !== "07:30:00")
                        .map((time) => (
                          <SelectItem key={time.id} value={time.id.toString()}>
                            {time.time.slice(0, 5)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    className="flex-1"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1"
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
  );
};

export default View;
