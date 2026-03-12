import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";

const months = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const AlertMessage = ({ message }) => {
  return (
    <div className="bg-red-500 text-white px-2 py-1 rounded w-fit">
      {message}
    </div>
  );
};

const Analysis = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/supervisor/new/orders")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response.data.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div>Buyurtmalar {data?.count} ta</div>
      <div className="w-full overflow-auto mt-4">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr>
              <th className="border border-gray-300 px-2 py-1">№</th>
              <th className="border border-gray-300 px-2 py-1">ID</th>
              <th className="border border-gray-300 px-2 py-1">Nomi</th>
              <th className="border border-gray-300 px-2 py-1">Miqdori</th>
              <th className="border border-gray-300 px-2 py-1">Guruh</th>
              <th className="border border-gray-300 px-2 py-1">Oy</th>
              <th className="border border-gray-300 px-2 py-1">Texnolog</th>
              <th className="border border-gray-300 px-2 py-1">Limit</th>
              <th className="border border-gray-300 px-2 py-1">Farq</th>
              <th className="border border-gray-300 px-2 py-1">Qozixona</th>
              <th className="border border-gray-300 px-2 py-1">Detallar</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((order, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-2 py-1">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order.order?.id}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order.order?.name} <br />{" "}
                  {order.submodels[0]?.submodel?.submodel_name}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {formatNumber(order?.order?.quantity)}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order?.groups?.length > 0 ? (
                    order.groups?.map((group) => group.name).join(", ")
                  ) : (
                    <AlertMessage message="Yo'q" />
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order.selected_months?.length > 0 ? (
                    order.selected_months
                      .map((month) => {
                        const date = new Date(month.month);
                        const monthName = months[date.getMonth()];
                        const year = date.getFullYear();
                        return `${monthName}, ${year}`;
                      })
                      .join(", ")
                  ) : (
                    <AlertMessage message="Yo'q" />
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order?.submodels[0]?.tarification_sum > 0 ? (
                    formatNumber(order?.submodels[0]?.tarification_sum)
                  ) : (
                    <AlertMessage message="Yo'q" />
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {formatNumber(order?.group_limit)}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order?.submodels[0]?.tarification_sum >
                  order?.group_limit ? (
                    <AlertMessage
                      message={formatNumber(
                        order?.submodels[0]?.tarification_sum -
                          order?.group_limit,
                      )}
                    />
                  ) : (
                    formatNumber(order?.submodels[0]?.tarification_sum)
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order?.submodels[0]?.exceeded_tarifications?.length > 0 ? (
                    <AlertMessage
                      message={
                        order?.submodels[0]?.exceeded_tarifications?.length
                      }
                    />
                  ) : (
                    "Joyida"
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {order.has_recipe ? "Bor" : <AlertMessage message="Yo'q" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analysis;
