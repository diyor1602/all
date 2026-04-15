import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronDown } from "lucide-react";
import formatNumber from "@/utils/formatNumber";
import ModelImages from "@/components/ModelImages";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const All = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openTruck, setOpenTruck] = useState(null);

  // 🔹 TABLE BUILD
  const buildTable = (details) => {
    const sizes = [...new Set(details.map((d) => d.size_name))];
    const colors = [...new Set(details.map((d) => d.color_name))];

    const table = {};
    const colorSums = {};
    let grandTotal = 0;

    sizes.forEach((size) => {
      table[size] = {};
      colors.forEach((color) => {
        table[size][color] = 0;
      });
    });

    colors.forEach((color) => {
      colorSums[color] = 0;
    });

    details.forEach((d) => {
      table[d.size_name][d.color_name] = `${d.qty} (${d.capacity})`;
      colorSums[d.color_name] += d.qty || 0;
      grandTotal += d.qty || 0;
    });

    return { sizes, colors, table, colorSums, grandTotal };
  };

  // 🔹 TABLE UI
  const PackageTable = ({ details }) => {
    if (!details?.length) return null;

    const { sizes, colors, table, colorSums, grandTotal } = buildTable(details);

    return (
      <div className="overflow-x-auto mt-3 rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left">Size</th>
              {colors.map((color, i) => (
                <th key={i} className="p-2 text-center">
                  {color}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sizes.map((size, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-2 font-medium">{size}</td>
                {colors.map((color, j) => (
                  <td key={j} className="p-2 text-center">
                    {table[size][color] || "-"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 bg-primary/10 font-semibold">
              <td className="p-2">Jami</td>
              {colors.map((color, j) => (
                <td key={j} className="p-2 text-center">
                  {formatNumber(colorSums[color])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 🔹 API
  const getData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trucks");
      setData(res.data);
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

  if (loading) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <div className="text-lg font-semibold">Jo'natmalar</div>
        <Button asChild>
          <Link to="/packageMaster/truck/add">Qo'shish</Link>
        </Button>
      </div>

      {data?.map((truck, index) => {
        const isOpen = openTruck === index;

        // Calculate total quantity for this truck
        const totalQty =
          truck?.items?.reduce(
            (sum, item) => sum + (item.shipped_qty || 0),
            0,
          ) || 0;

        return (
          <div
            key={index}
            className="border rounded-xl shadow-sm overflow-hidden bg-white"
          >
            {/* 🔹 HEADER */}
            <div
              onClick={() => setOpenTruck(isOpen ? null : index)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            >
              <div>
                <div className="font-bold text-lg">🚚 {truck.number}</div>
                <div className="text-sm text-gray-500">
                  {truck.driver_name} • {truck.vehicle_number}
                </div>
                <div className="text-sm font-medium text-primary">
                  Jami: {formatNumber(totalQty)} ta
                </div>
              </div>

              <ChevronDown
                className={`transition ${isOpen ? "rotate-180" : ""}`}
              />
            </div>

            {/* 🔹 BODY */}
            {isOpen && (
              <div className="p-4 border-t space-y-4 bg-gray-50">
                {/* INFO */}
                <div className="flex gap-4 items-center">
                  <div className="text-sm space-y-1">
                    <div>{truck.comment}</div>
                    <div>{truck.driver_phone}</div>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="grid md:grid-cols-2 gap-4">
                  {truck?.items
                    ?.sort((a, b) => a.group_key?.localeCompare(b.group_key))
                    ?.map((item, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition"
                      >
                        <div className="flex gap-2 justify-between">
                          <div>
                            <div className="font-semibold">
                              {item.order?.name}
                            </div>

                            <div className="text-sm text-gray-600">
                              {formatNumber(item.shipped_qty)} ta
                            </div>

                            <div className="text-xs text-gray-500 mb-2">
                              {
                                item.order?.order_model?.submodels[0]?.submodel
                                  ?.name
                              }
                            </div>
                          </div>

                          <div className="min-w-[50px]">
                            <ModelImages
                              modelCode={item.order?.order_model?.model?.name}
                            />
                          </div>
                        </div>
                        <PackageTable details={item.package_details} />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default All;
