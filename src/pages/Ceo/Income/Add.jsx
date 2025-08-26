"use client";

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
import {
  ArrowLeft,
  Loader2,
  Check,
  ChevronsUpDown,
  User,
  Building2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Add = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    currency_id: "",
    source_id: "",
    via_id: "",
    purpose: "",
    comment: "",
  });

  const [currencies, setCurrencies] = useState([]);
  const [sources, setSources] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [viaOpen, setViaOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);

  // Selected names for display
  const [selectedViaName, setSelectedViaName] = useState("");
  const [selectedSourceName, setSelectedSourceName] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (employeeSearch.trim().length < 2) {
        setEmployeeOptions([]);
        return;
      }

      try {
        setSearchingEmployees(true);
        const res = await api.get(`/ceo/employees?search=${employeeSearch}`);
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
        const [currenciesResponse, sourcesResponse] = await Promise.all([
          api.get("/ceo/currencies"),
          api.get("/ceo/sources"),
        ]);
        setCurrencies(currenciesResponse.data);
        setSources(sourcesResponse.data);

        // ✅ Auto-select first source
        if (sourcesResponse.data.length > 0) {
          const firstSource = sourcesResponse.data[0];
          setForm((prev) => ({ ...prev, source_id: firstSource.name }));
          setSelectedSourceName(firstSource.name);
        }

        // ✅ Auto-select kim orqali (from localStorage)
        const savedVia = localStorage.getItem("viaEmployee"); // example key
        if (savedVia) {
          try {
            const parsed = JSON.parse(savedVia); // should contain {id, name}
            setForm((prev) => ({ ...prev, via_id: parsed.id }));
            setSelectedViaName(parsed.name);
          } catch {
            console.warn("Invalid localStorage value for viaEmployee");
          }
        }
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

    if (!form.amount || !form.currency_id || !form.source_id || !form.via_id) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Barcha maydonlar to'ldirilishi shart!",
      });
      return;
    }

    try {
      setLoading(true);
      const matchedSource = sources.find((s) => s.name === form.source_id);

      const payload = {
        amount: form.amount,
        currency_id: form.currency_id,
        purpose: form.purpose,
        comment: form.comment,
        ...(matchedSource
          ? { source_id: matchedSource.id }
          : { source_name: form.source_id }),
        via_id: form.via_id,
      };

      await api.post("/ceo/incomes", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Kirim qo'shildi!",
      });
      navigate("/ceo/income");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Kirim qo'shishda xatolik yuz berdi!",
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

    // ✅ Save for future auto-select
    localStorage.setItem("viaEmployee", JSON.stringify(employee));
  };

  const handleSourceSelect = (source) => {
    setForm({ ...form, source_id: source.name });
    setSelectedSourceName(source.name);
    setSourceOpen(false);
    setSourceSearch("");
  };

  const handleCustomSource = () => {
    if (sourceSearch.trim()) {
      setForm({ ...form, source_id: sourceSearch.trim() });
      setSelectedSourceName(sourceSearch.trim());
      setSourceOpen(false);
      setSourceSearch("");
    }
  };

  // Filter sources based on search
  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          <div className="w-full flex items-center gap-2 justify-between">
            <Button onClick={() => navigate("/ceo/income")} variant="outline">
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </Button>
            <div>Yangi Kirim Qo'shish</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>
                Miqdor (
                {Number.parseFloat(form.amount || 0).toLocaleString("ru-Ru")})
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

          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source-select">
              Manba <span className="text-red-500">*</span>
            </Label>
            <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="source-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={sourceOpen}
                  className="w-full justify-between h-10"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span
                      className={cn(
                        "truncate",
                        !selectedSourceName && "text-muted-foreground"
                      )}
                    >
                      {selectedSourceName || "Manba tanlang yoki kiriting..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Manba qidiring yoki yangi kiriting..."
                    value={sourceSearch}
                    onValueChange={setSourceSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {sourceSearch.trim() ? (
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2"
                            onClick={handleCustomSource}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            <div className="text-left">
                              <div className="font-medium">
                                "{sourceSearch}" qo'shish
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Yangi manba yaratish
                              </div>
                            </div>
                          </Button>
                        </div>
                      ) : (
                        "Manba qidiring..."
                      )}
                    </CommandEmpty>
                    {filteredSources.length > 0 && (
                      <CommandGroup heading="Mavjud manbalar">
                        {filteredSources.map((source) => (
                          <CommandItem
                            key={source.id}
                            value={source.name}
                            onSelect={() => handleSourceSelect(source)}
                            className="flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>{source.name}</span>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                form.source_id === source.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Via Selection */}
          <div className="space-y-2">
            <Label htmlFor="via-select">
              Kim orqali <span className="text-red-500">*</span>
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
