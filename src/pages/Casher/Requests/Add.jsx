import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Loader2, Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Add = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    currency_id: "",
    via_id: "",
    purpose: "",
    comment: "",
    deadline: "",
  });

  const [currencies, setCurrencies] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [viaOpen, setViaOpen] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);

  // Selected names for display
  const [selectedViaName, setSelectedViaName] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (employeeSearch.trim().length < 2) {
        setEmployeeOptions([]);
        return;
      }

      try {
        setSearchingEmployees(true);
        const res = await api.get(`/casher/employees?search=${employeeSearch}`);
        setEmployeeOptions(res.data.data || []);
      } catch (error) {
        setEmployeeOptions([]);
      } finally {
        setSearchingEmployees(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [employeeSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [currenciesResponse] = await Promise.all([
          api.get("/casher/currencies"),
        ]);
        setCurrencies(currenciesResponse.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Ma'lumotlarni olishda xatolik yuz berdi!",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.currency_id || !form.via_id) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Barcha maydonlar to'ldirilishi shart!",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: form.amount,
        currency_id: form.currency_id,
        purpose: form.purpose,
        comment: form.comment,
        employee_id: form.via_id,
        deadline: form.deadline,
      };

      await api.post("/casher/requestForm", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Talab qo'shildi!",
      });
      navigate("/casher/requests");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Talab qo'shishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViaSelect = (employee) => {
    setForm({ ...form, via_id: employee.id });
    setSelectedViaName(employee.name);
    setViaOpen(false);
    setEmployeeSearch("");
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          <div className="w-full flex items-center gap-2 justify-between">
            <Button
              onClick={() => navigate("/casher/requests")}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </Button>
            <div>Yangi Talab Qo'shish</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>
                Miqdor (
                {Number.parseFloat(form.amount || 0).toLocaleString("ru-RU")})
              </Label>
              <Input
                type="number"
                placeholder="Miqdor"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <Label>Valyuta</Label>
              <Select
                value={form.currency_id}
                onValueChange={(value) => {
                  setForm((prevForm) => ({
                    ...prevForm,
                    currency_id: value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem
                      key={currency.id}
                      value={currency.id.toString()}
                    >
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Via Selection */}
          <div className="space-y-2">
            <Label htmlFor="via-select">
              Kim uchun <span className="text-red-500">*</span>
            </Label>
            <Popover open={viaOpen} onOpenChange={setViaOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="via-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={viaOpen}
                  className="w-full justify-between h-10"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span
                      className={cn(
                        "truncate",
                        !selectedViaName && "text-muted-foreground"
                      )}
                    >
                      {selectedViaName || "Xodimni tanlang..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Xodimni qidiring..."
                    value={employeeSearch}
                    onValueChange={setEmployeeSearch}
                  />
                  <CommandList>
                    {searchingEmployees ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Qidirilmoqda...
                        </span>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          <div className="p-2">
                            {employeeSearch.length < 2
                              ? "Qidirish uchun kamida 2 ta harf kiriting"
                              : "Hech qanday xodim topilmadi"}
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {employeeOptions.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.name}
                              onSelect={() => handleViaSelect(employee)}
                              className="flex items-center gap-2"
                            >
                              <User className="w-4 h-4" />
                              <span>{employee.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  form.via_id === employee.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Muddat</Label>
            <Input
              type="datetime-local"
              value={form.deadline}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div>
            <Label>Sabab</Label>
            <Input
              placeholder="Sababni kiriting"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
          </div>

          <div>
            <Label>Izoh</Label>
            <Input
              placeholder="Qo'shimcha izoh"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              "Qo'shish"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Add;
