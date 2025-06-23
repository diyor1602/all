import api from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const YesterdayAbsence = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/superhr/yesterdayAbsent");
        setData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description:
            error.response?.data?.message ||
            "Ma'lumotlar olishda xatolik yuz berish mumkin",
        });
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="text-2xl font-bold mb-2">
        Bugun kelgan, kecha (
        {data?.[0]?.absent_date?.split("-").reverse().join(".")}) kelmaganlar.
        Jami: {data?.length} ta
      </div>
      <div className="w-full overflow-auto">
        <table className="whitespace-nowrap border border-gray-500 w-full border-collapse text-xs bg-white">
          <thead>
            <tr>
              <th className="border border-gray-500 p-2">№</th>
              <th className="border border-gray-500 p-2">F.I.SH</th>
              <th className="border border-gray-500 p-2">Bo'lim</th>
              <th className="border border-gray-500 p-2">Lavozim</th>
              <th className="border border-gray-500 p-2">Kelmagan kuni</th>
            </tr>
          </thead>
          <tbody>
            {data?.sort(
              // first show was_on_holiday, then sort by name
              (a, b) => {
                if (a.was_on_holiday && !b.was_on_holiday) return -1;
                if (!a.was_on_holiday && b.was_on_holiday) return 1;
                return a.name.localeCompare(b.name);
              }
            ) &&
              data?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-500 p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-500 p-2">
                    <Link to={`/superhr/employees/view/${item.id}`}>
                      <div className="flex items-center gap-2">
                        <div>{item.name}</div>
                        <div>
                          {item.was_on_holiday && (
                            <div className="rounded-full bg-green-500 text-white px-2 py-1">
                              {" "}
                              Ta'tilda bo'lgan
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="border border-gray-500 p-2">
                    <div className="flex flex-col">
                      <div>{item.department || "-"}</div>
                      <div>{item.group || "-"}</div>
                    </div>
                  </td>
                  <td className="border border-gray-500 p-2">
                    {item.position}
                  </td>
                  <td className="border border-gray-500 p-2 text-center">
                    {item.absent_date?.split("-").reverse().join(".")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default YesterdayAbsence;
