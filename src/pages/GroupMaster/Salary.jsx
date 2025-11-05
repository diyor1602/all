import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const Salary = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("salarySelectedMonth") ||
      new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await api.get("/groupMaster/myOrders", {
          params: {
            month: selectedMonth,
          },
        });
        setData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description:
            error.response.data.message || "Ma'lumotlarini olib bo'lmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  return (
    <div>
      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          localStorage.setItem("salarySelectedMonth", e.target.value);
        }}
        className="w-fit bg-white"
        disabled={loading}
      />
      {loading ? (
        <div className="w-full h-[80vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <div>
              <div>
                Jami miqdor:{" "}
                {data?.reduce((acc, item) => acc + item.order?.quantity, 0)}
              </div>
              <div>
                Jami summa:{" "}
                {data?.reduce(
                  (acc, item) => acc + item.amount_from_order_quantity,
                  0
                )}
              </div>
            </div>
            <div>
              <div>
                Jami tikuv:{" "}
                {data?.reduce((acc, item) => acc + item.sewn_quantity, 0)}
              </div>
              <div>
                Jami tikuv summa:{" "}
                {data?.reduce((acc, item) => acc + item.amount_from_sewing, 0)}
              </div>
            </div>
          </div>
          {data?.map((item, index) => (
            <div key={index} className="bg-white p-2">
              <div>{item.order?.name}</div>
              <div>
                {item.order?.submodels?.map((submodel) => submodel).join(", ")}
              </div>
              <div>{item.order?.quantity}</div>
              <div>{item.sewn_quantity}</div>
              <div>{item.amount_from_sewing}</div>
              <div>{item.amount_from_order_quantity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Salary;
