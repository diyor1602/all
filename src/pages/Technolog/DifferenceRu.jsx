import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DifferenceRu = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/technologist/new/orders")
      .then((res) => {
        setData(res.data?.data || []);
      })
      .catch(() => {
        toast({
          title: "Xatolik",
          description: "Xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {loading ? (
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Buyurtma</th>
                <th>Miqdor</th>
                <th>Yil</th>
                <th>Mavsum</th>
                <th>Model</th>
                <th>UZ</th>
                <th>RU</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.order?.name}</td>
                  <td>{item.order?.quantity}</td>
                  <td>{item.order?.season_year}</td>
                  <td>
                    {item?.order?.season_type ? (
                      <Badge
                        variant={
                          item.order.season_type === "winter" ? "blue" : "green"
                        }
                      >
                        {item.order.season_type === "winter" ? "Qish" : "Bahor"}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td>
                    {item.submodels[0]?.submodel?.model_name || "-"}
                    {item.submodels[0]?.submodel?.submodel_name || "-"}
                  </td>
                  <td>{item.submodels[0]?.tarification_sum?.uz || "-"}</td>
                  <td>{item.submodels[0]?.tarification_sum?.ru || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DifferenceRu;
