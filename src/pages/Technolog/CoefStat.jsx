import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import formatNumber from "@/utils/formatNumber";

const CoefStat = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("selectedMonth") ||
      new Date().toISOString().slice(0, 7),
  );

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("technologist/sewing-groups-analysis", {
        params: { month: selectedMonth },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedMonth]);

  return (
    <div>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("selectedMonth", e.target.value);
        }}
        className="w-fit bg-white"
      />
      <div className="w-full overflow-auto">
        <table>
          <thead>
            <tr>
              <th>Guruh</th>
              <th>Tikilgan maxsulot</th>
              <th>Oy mobaynida tikilgan mahsulotlarga sarflangan vaqt</th>
              <th>Davomat</th>
              <th>Ishchilarning umumiy vaqti daqiqada</th>
              <th>Oy mobaynida yo'qotilgan vaqt</th>
              <th>1 kunda har bir ishchi yo'qotgan vaqt</th>
              <th>Yo'qotilgan vaqt foiz ko'rinishda</th>
              <th>Har bir ishchining koeffitsienti</th>
              <th>Kishi boshiga</th>
            </tr>
          </thead>
          <tbody>
            {data
              ?.sort((a, b) => a.group_name.localeCompare(b.group_name))
              ?.map((item, index) => (
                <tr key={index}>
                  <td>{item.group_name}</td>
                  <td>{formatNumber(item.total_quantity)}</td>
                  <td>{formatNumber(item.total_produced_minutes)}</td>
                  <td>{formatNumber(item.total_present_days)}</td>
                  <td>{formatNumber(item.expected_minutes)}</td>
                  <td>{formatNumber(item.lost_minutes)}</td>
                  <td>
                    {formatNumber(item.lost_minutes / item.total_present_days)}
                  </td>
                  <td>{formatNumber(item.lost_percentage)}</td>
                  <td>
                    {formatNumber(
                      100 + (item.lost_minutes / item.expected_minutes) * 100,
                    )}
                  </td>
                  <td>{formatNumber(item.avg_production_per_person_day)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoefStat;
