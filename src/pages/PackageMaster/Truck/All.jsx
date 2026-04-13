import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import ModelImages from "@/components/ModelImages";

const All = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 TABLE BUILD FUNCTION
  const buildTable = (details) => {
    const sizes = [...new Set(details.map((d) => d.size_name))];
    const colors = [...new Set(details.map((d) => d.color_name))];

    const table = {};

    sizes.forEach((size) => {
      table[size] = {};
      colors.forEach((color) => {
        table[size][color] = 0;
      });
    });

    details.forEach((d) => {
      table[d.size_name][d.color_name] = `${d.qty} (${d.capacity})`;
    });

    return { sizes, colors, table };
  };

  //  TABLE COMPONENT
  const PackageTable = ({ details }) => {
    if (!details || details.length === 0) return null;

    const { sizes, colors, table } = buildTable(details);

    // Calculate sums for each color
    const calculateSums = () => {
      const sums = {};
      colors.forEach((color) => {
        sums[color] = 0;
      });

      details.forEach((d) => {
        if (sums[d.color_name] !== undefined) {
          sums[d.color_name] += d.qty;
        }
      });

      return sums;
    };

    const sums = calculateSums();

    return (
      <div className="overflow-x-auto mt-3">
        <table className="border border-collapse w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Size / Color</th>
              {colors.map((color, i) => (
                <th key={i} className="border p-2 text-center">
                  {color}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size, i) => (
              <tr key={i}>
                <td className="border p-2 font-semibold">{size}</td>
                {colors.map((color, j) => (
                  <td key={j} className="border p-2 text-center">
                    {table[size][color] || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {/* Sum row */}
            <tr className="bg-blue-50 font-semibold">
              <td className="border p-2">Jami</td>
              {colors.map((color, i) => (
                <td key={i} className="border p-2 text-center">
                  {sums[color] || 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 🔹 API CALL
  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/trucks");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // 🔹 UI
  return loading ? (
    <div className="w-full h-[90vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  ) : (
    <div className="space-y-6">
      {data?.map((truck, index) => (
        <div key={index} className="border p-4 rounded-xl shadow-sm">
          <div className="font-bold text-lg">{truck.number}</div>
          <div className="text-gray-500 mb-3">{truck.comment}</div>

          <div className="space-y-4">
            {truck?.items
              ?.sort((a, b) => a.group_key.localeCompare(b.group_key))
              ?.map((item, index) => (
                <div key={index} className="border p-3 rounded-lg bg-gray-50">
                  <div className="font-semibold">{item.order?.name}</div>
                  <ModelImages
                    modelCode={item.order?.order_model?.model?.name}
                  />

                  <div className="text-sm text-gray-600">
                    {formatNumber(item.shipped_qty)} ta
                  </div>

                  <div className="text-sm mb-2">
                    {item.order?.order_model?.submodels[0]?.submodel?.name}
                  </div>

                  {/* 🔥 TABLE HERE */}
                  <PackageTable details={item.package_details} />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default All;
