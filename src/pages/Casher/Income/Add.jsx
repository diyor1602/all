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
    source_id: "",
    via_id: "",
    cashbox_id: "",
    purpose: "",
    comment: "",
  });

  const [currencies, setCurrencies] = useState([]);
  const [sources, setSources] = useState([]);
  const [vias, setVias] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          currenciesResponse,
          sourcesResponse,
          viasResponse,
          cashboxesResponse,
        ] = await Promise.all([
          api.get("/casher/currencies"),
          api.get("/casher/sources"),
          api.get("/casher/via"),
          api.get("/casher/balances"),
        ]);
        setCurrencies(currenciesResponse.data);
        setSources(sourcesResponse.data);
        setVias(viasResponse.data);
        setCashboxes(cashboxesResponse.data.cashboxes);
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
      const matchedVia = vias.find((v) => v.name === form.via_id);

      const payload = {
        amount: form.amount,
        currency_id: form.currency_id,
        cashbox_id: form.cashbox_id,
        purpose: form.purpose,
        comment: form.comment,
        ...(matchedSource
          ? { source_id: matchedSource.id }
          : { source_name: form.source_id }),
        ...(matchedVia ? { via_id: matchedVia.id } : { via_name: form.via_id }),
      };

      await api.post("/casher/incomes", payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Kirim qo'shildi!",
      });
      navigate("/casher/income");
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

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          <div className="w-full flex items-center gap-2 justify-between">
            <Button
              onClick={() => navigate("/casher/income")}
              variant="outline"
            >
              <ArrowLeft />
              Orqaga
            </Button>
            <div>Yangi Kirim Qo‘shish</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valyuta</Label>
              <Select
                value={form.currency_id}
                onValueChange={(value) =>
                  setForm({ ...form, currency_id: value })
                }
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

            <div>
              <Label>Kassa</Label>
              <Select
                value={form.cashbox_id}
                onValueChange={(value) =>
                  setForm({ ...form, cashbox_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cashbox) => (
                    <SelectItem key={cashbox.id} value={cashbox.id.toString()}>
                      {cashbox.name} — {cashbox.balance?.amount}{" "}
                      {cashbox.balance?.currency?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Manba</Label>
            <Input
              placeholder="Masalan: Bank, mijoz"
              list="source-list"
              value={form.source_id}
              onChange={(e) => setForm({ ...form, source_id: e.target.value })}
            />
            <datalist id="source-list">
              {sources.map((source) => (
                <option key={source.id} value={source.name} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Kim orqali</Label>
            <Input
              placeholder="Masalan: Naqd, karta"
              list="via-list"
              value={form.via_id}
              onChange={(e) => setForm({ ...form, via_id: e.target.value })}
            />
            <datalist id="via-list">
              {vias.map((via) => (
                <option key={via.id} value={via.name} />
              ))}
            </datalist>
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
