import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import formatNumber from "@/utils/formatNumber";

const Overall2 = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dollarRate, setDollarRate] = useState(
    localStorage.getItem("newSeasonDollarRate") || 12000,
  );
  const [selectedYear, setSelectedYear] = useState(
    localStorage.getItem("newSeasonSelectedYear") || new Date().getFullYear(),
  );
  const [selectedType, setSelectedType] = useState(
    localStorage.getItem("newSeasonSelectedType") || "winter",
  );

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ceo/calculateSeasonWithCostsBySeason", {
        params: {
          season_year: selectedYear,
          season_type: selectedType,
          dollar_rate: dollarRate,
        },
      });
      setData(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotni yuklab bo'lmadi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedYear, selectedType, dollarRate]);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Input
          type="number"
          value={selectedYear}
          onChange={(e) => {
            localStorage.setItem("newSeasonSelectedYear", e.target.value);
            setSelectedYear(e.target.value);
          }}
          className="w-fit bg-white"
        />
        <div className="flex gap-2">
          <Button
            className="w-fit"
            variant={selectedType === "winter" ? "default" : "outline"}
            onClick={() => {
              localStorage.setItem("newSeasonSelectedType", "winter");
              setSelectedType("winter");
            }}
          >
            Qish
          </Button>
          <Button
            className="w-fit"
            variant={selectedType === "summer" ? "default" : "outline"}
            onClick={() => {
              localStorage.setItem("newSeasonSelectedType", "summer");
              setSelectedType("summer");
            }}
          >
            Yoz
          </Button>
        </div>
      </div>
      <div>
        <div>Buyurtmalar: {formatNumber(data?.season?.orders_count || 0)}</div>
        <div>Miqdor: {formatNumber(data?.season?.planned?.qty || 0)} dona</div>
        <div>{formatNumber(data?.season?.planned?.minutes || 0, 0)} daqiqa</div>
      </div>
    </>
  );
};

export default Overall2;
