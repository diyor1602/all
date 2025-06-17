import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const fetchTimes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/resultChecker/times");
      setTimes(response.data);
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

  const searchTarifs = async () => {
    if (searchTerm.trim() === "" || searchTerm.trim().length < 2) return;
    try {
      const response = await api.get("/resultChecker/tarifications/search", {
        params: {
          search: searchTerm,
        },
      });
      setAvailableTarifs(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    searchTarifs();
  }, [searchTerm]);

  useEffect(() => {
    fetchEmployees();
    fetchTimes();
  }, []);

  const handleAddTarif = (employee) => {
    setCurrentEmployee(employee);
    setSelectedTarif(null);
    setSearchTerm("");
    setQuantity(1);
    setIsModalOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSelectTarif = (tarif) => {
    setSelectedTarif(tarif);
    setSearchTerm(tarif.name);
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
      fetchEmployees(); // Refresh the list
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
  };

  return (
    <div className="relative">
      {/* Tarif Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tarif qo'shish</DialogTitle>
            <DialogDescription>
              {currentEmployee?.name} uchun tarif qo'shish
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Qidirish</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  ref={searchInputRef}
                  placeholder="Tarif nomi bo'yicha qidiring..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <X
                    className="absolute right-2.5 top-2.5 h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTarif(null);
                    }}
                  />
                )}
              </div>
            </div>

            {!selectedTarif && searchTerm && (
              <div className="border rounded-md max-h-60 overflow-auto">
                {availableTarifs.length > 0 ? (
                  availableTarifs.map((tarif) => (
                    <div
                      key={tarif.id}
                      className="p-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectTarif(tarif)}
                    >
                      {tarif.name}
                    </div>
                  ))
                ) : (
                  <p className="p-2 text-muted-foreground text-sm">
                    Hech narsa topilmadi
                  </p>
                )}
              </div>
            )}

            {selectedTarif && (
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">{selectedTarif.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Narx: {selectedTarif.price} so'm
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Miqdori</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vaqtni tanlang</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTimeId || ""}
                    onChange={(e) => setSelectedTimeId(Number(e.target.value))}
                  >
                    <option value="">Vaqtni tanlang</option>
                    {times
                      .filter((time) => time.time !== "07:30:00")
                      .map((time) => (
                        <option key={time.id} value={time.id}>
                          {time.time.slice(0, 5)} {/* Show only hh:mm */}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={closeModal}>
                    Bekor qilish
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Jo'natilmoqda..." : "Qo'shish"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Xodimlar ({employees?.length})
      </h1>
      <div className="w-full overflow-auto">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-600 p-2">ID</th>
              <th className="border border-gray-600 p-2">Xodim</th>
              <th className="border border-gray-600 p-2">Qilgan ishlari</th>
              <th className="border border-gray-600 p-2">Qo'shish</th>
            </tr>
          </thead>
          <tbody>
            {employees
              ?.sort((a, b) => a?.name.localeCompare(b?.name))
              ?.map((employee) => (
                <tr key={employee?.id}>
                  <td className="border border-gray-600 p-2 text-center">
                    {employee?.id}
                  </td>
                  <td className="border border-gray-600 p-2">
                    {employee?.name}
                  </td>
                  <td className="border border-gray-600 p-2">
                    {employee?.employee_results?.map((result) => (
                      <div key={result?.id}>
                        {result?.tarification?.name} -{" "}
                        <span className="font-semibold">
                          {result?.quantity}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="border border-gray-600 p-2 text-center">
                    <Button
                      variant="outline"
                      onClick={() => handleAddTarif(employee)}
                    >
                      <Plus />
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default View;
