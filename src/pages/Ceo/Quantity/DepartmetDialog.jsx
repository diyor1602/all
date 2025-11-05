import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
const formatNumber = (number) => {
  if (!number) return "0";
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
};
const DepartmetDialog = ({ department, order, open, setOpen }) => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (!department?.id || !open) return;
      setLoading(true);
      try {
        const response = await api.get("/ceo/departmentPayments", {
          params: { department_id: department?.id, order_id: order?.order?.id },
        });
        setData(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description:
            error.response.data.message || "Ma'lumotlar olishda xatolik",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department?.name}</DialogTitle>
          <DialogDescription>
            {data?.length} ta xodim
            {order ? ` (${order?.order?.name})` : ""}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          //  add table skeleton
          <div className="mt-4 overflow-auto w-full">
            <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs">
              <thead>
                <tr>
                  <th className="py-1 px-2 border border-gray-300">№</th>
                  <th className="py-1 px-2 border border-gray-300">Xodim</th>
                  <th className="py-1 px-2 border border-gray-300">%</th>
                  <th className="py-1 px-2 border border-gray-300">
                    Topgan puli
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, index) => (
                  <tr key={index}>
                    <td className="py-1 px-2 border border-gray-300">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-1 px-2 border border-gray-300">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-1 px-2 border border-gray-300">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-1 px-2 border border-gray-300">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 overflow-auto w-full max-h-[80vh]">
            <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white text-xs">
              <thead>
                <tr>
                  <th className="py-1 px-2 border border-gray-300">№</th>
                  <th className="py-1 px-2 border border-gray-300">Xodim</th>
                  <th className="py-1 px-2 border border-gray-300">%</th>
                  <th className="py-1 px-2 border border-gray-300">
                    Topgan puli
                  </th>
                </tr>
              </thead>
              <tbody>
                {data
                  ?.sort(
                    (a, b) => b?.employee_percentage - a?.employee_percentage
                  )
                  ?.map((item, index) => (
                    <tr key={index} className="text-center">
                      <td className="py-1 px-2 border border-gray-300">
                        {index + 1}
                      </td>
                      <td className="py-1 px-2 border border-gray-300">
                        {item?.employee?.name}
                      </td>
                      <td className="py-1 px-2 border border-gray-300">
                        {item?.employee_percentage}
                      </td>
                      <td className="py-1 px-2 border border-gray-300">
                        {formatNumber(item?.calculated_amount)} so'm
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    className="py-1 px-2 border border-gray-300 text-right"
                    colSpan={2}
                  >
                    Jami
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-center">
                    {formatNumber(
                      data?.reduce(
                        (total, item) => total + item?.employee_percentage,
                        0
                      )
                    )}
                  </td>
                  <td className="py-1 px-2 border border-gray-300 text-center">
                    {formatNumber(
                      data?.reduce(
                        (total, item) =>
                          total + parseFloat(item?.calculated_amount),
                        0
                      )
                    )}{" "}
                    so'm
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default DepartmetDialog;
