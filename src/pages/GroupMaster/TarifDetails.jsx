import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { statuses } from "@/lib/status";

const TarifDetails = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/groupMaster/orders/all/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  return (
    <>
      <div>{order?.id}</div>
      <div>{order?.name}</div>
      <div>{order?.order_model?.model?.name}</div>
      <div>
        {order?.order_model?.submodels
          ?.map((submodel) => submodel?.submodel?.name)
          .join(", ")}
      </div>
      <div
        className={`${
          statuses[order?.status]?.color
        } text-white px-2 py-1 rounded-full w-fit text-xs`}
      >
        {statuses[order?.status]?.text}
      </div>
      {order?.order_model?.sizes &&
        order.order_model.sizes.length > 0 &&
        (() => {
          // Get unique sizes and colors
          const sizes = [
            ...new Set(order.order_model.sizes.map((size) => size.size?.name)),
          ].sort((a, b) => a.localeCompare(b));
          const colors = [
            ...new Set(order.order_model.sizes.map((size) => size.color?.name)),
          ].sort((a, b) => a.localeCompare(b));

          // Create a map for quick lookup
          const sizeColorMap = new Map();
          order.order_model.sizes.forEach((item) => {
            const key = `${item.size?.name}-${item.color?.name}`;
            sizeColorMap.set(key, item.quantity || 0);
          });

          // Calculate row and column totals
          const rowTotals = new Map();
          const colTotals = new Map(colors.map((color) => [color, 0]));

          sizes.forEach((size) => {
            let total = 0;
            colors.forEach((color) => {
              const quantity = sizeColorMap.get(`${size}-${color}`) || 0;
              total += quantity;
              colTotals.set(color, (colTotals.get(color) || 0) + quantity);
            });
            rowTotals.set(size, total);
          });

          const grandTotal = Array.from(rowTotals.values()).reduce(
            (sum, val) => sum + val,
            0
          );

          return (
            <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <span>O'lchamlar</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="bg-yellow-100 border border-gray-300 p-2 text-center">
                        O'lcham
                      </th>
                      {colors.map((color, index) => (
                        <th
                          key={index}
                          className="border border-gray-300 p-2 text-center"
                        >
                          {color}
                        </th>
                      ))}
                      <th className="bg-blue-200 border border-gray-300 p-2 text-center font-semibold">
                        Jami
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size) => (
                      <tr key={size}>
                        <td className="bg-yellow-50 border border-gray-300 p-2 font-medium text-center">
                          {size}
                        </td>
                        {colors.map((color) => {
                          const quantity =
                            sizeColorMap.get(`${size}-${color}`) || 0;
                          return (
                            <td
                              key={`${size}-${color}`}
                              className="border border-gray-200 p-2 text-center"
                            >
                              {quantity || ""}
                            </td>
                          );
                        })}
                        <td className="bg-blue-100 border border-gray-300 p-2 text-center font-medium">
                          {rowTotals.get(size) || 0}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="bg-green-50 border border-gray-300 p-2 font-semibold text-center">
                        Jami
                      </td>
                      {colors.map((color) => (
                        <td
                          key={`total-${color}`}
                          className="bg-green-50 border border-gray-300 p-2 text-center font-semibold"
                        >
                          {colTotals.get(color) || 0}
                        </td>
                      ))}
                      <td className="bg-blue-100 border border-gray-300 p-2 text-center font-bold">
                        {grandTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      {order?.order_model?.submodels?.map((submodel, index) => (
        <div key={index}>
          {submodel?.submodel?.name}
          {submodel?.tarification_categories?.map((tarification_category) => (
            <div key={tarification_category?.id}>
              {tarification_category?.name}
              {tarification_category?.tarifications?.map((tarification) => (
                <div key={tarification?.id}>
                  {tarification?.code}
                  {tarification?.name}
                  {tarification?.second}
                  {tarification?.summa}
                  {tarification?.razryad?.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default TarifDetails;
