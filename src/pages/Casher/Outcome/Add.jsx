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
import { ArrowLeft, Loader2 } from "lucide-react";

const Add = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    currency_id: "",
    destination_id: "",
    via_id: "",
    purpose: "",
    comment: "",
  });

  const [currencies, setCurrencies] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [destinationOptions, setDestinationOptions] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (employeeSearch.trim().length < 3) return;

      try {
        const res = await api.get(`/casher/employees?search=${employeeSearch}`);
        setEmployeeOptions(res.data.data || []);
      } catch (error) {
        console.error("Employee search error:", error);
      }
    }, 500); // debounce

    return () => clearTimeout(delayDebounceFn);
  }, [employeeSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (destinationSearch.trim().length < 3) return;

      try {
        const res = await api.get(
          `/casher/employees?search=${destinationSearch}`
        );
        setDestinationOptions(res.data.data || []);
      } catch (error) {
        console.error("Destination search error:", error);
      }
    }, 500); // debounce

    return () => clearTimeout(delayDebounceFn);
  }, [destinationSearch]);

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

    if (!form.amount || !form.currency_id || !form.destination_id) {
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
        destination_id: form.destination_id,
        via_id: form.via_id,
      };

      await api.post("/casher/expenses", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Chiqim qo'shildi!",
      });
      navigate("/casher/outcome");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Chiqim qo'shishda xatolik yuz berdi!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          <div className="w-full flex items-center gap-2 justify-between">
            <Button
              onClick={() => navigate("/casher/outcome")}
              variant="outline"
            >
              <ArrowLeft />
              Orqaga
            </Button>
            <div>Yangi Chiqim Qo‘shish</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>
                Miqdor ({parseFloat(form.amount).toLocaleString("ru-Ru")})
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

          <div
            className="relative"
            tabIndex={0}
            onBlur={() => {
              setTimeout(() => {
                setEmployeeOptions([]);
              }, 100);
            }}
          >
            <Label>Kim orqali</Label>
            <Input
              placeholder="Xodimni qidiring..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
            />

            {employeeOptions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-y-auto">
                <ul>
                  {employeeOptions.map((emp) => (
                    <li
                      key={emp.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm({ ...form, via_id: emp.id });
                        setEmployeeSearch(emp.name);
                        setEmployeeOptions([]);
                      }}
                    >
                      {emp.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            className="relative"
            tabIndex={0}
            onBlur={() => {
              setTimeout(() => {
                setEmployeeOptions([]);
              }, 100);
            }}
          >
            <Label>Kimga</Label>
            <Input
              placeholder="Xodimni qidiring..."
              value={destinationSearch}
              onChange={(e) => setDestinationSearch(e.target.value)}
            />

            {destinationOptions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-y-auto">
                <ul>
                  {destinationOptions.map((dest) => (
                    <li
                      key={dest.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm({ ...form, destination_id: dest.id });
                        setDestinationSearch(dest.name);
                        setDestinationOptions([]);
                      }}
                    >
                      {dest.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              placeholder="Qo‘shimcha izoh"
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
              "Qo‘shish"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Add;
