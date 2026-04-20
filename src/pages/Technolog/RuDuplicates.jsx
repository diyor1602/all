import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronDown, Search } from "lucide-react";

const RuDuplicates = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("technologist/tarifications/duplicate");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const calculatePercent = (base, value) => {
    if (!base) return 0;
    return (((value - base) / base) * 100).toFixed(2);
  };

  const filterData = (data, search) => {
    if (!search || !data) return data;

    const searchLower = search.toLowerCase();
    const filtered = {};

    Object.entries(data).forEach(([key, values]) => {
      const keyMatches = key.toLowerCase().includes(searchLower);
      const valuesMatch = values?.some((item) =>
        item.second.toString().toLowerCase().includes(searchLower),
      );

      if (keyMatches || valuesMatch) {
        filtered[key] = values;
      }
    });

    return filtered;
  };

  return loading ? (
    <div className="w-full h-[90vh] flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={36} />
    </div>
  ) : (
    <div className="p-4 space-y-3">
      {/* SEARCH INPUT */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Поиск по названию или значению..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {Object.entries(filterData(data, searchTerm) || {}).map(
        ([key, values]) => {
          const base = values?.[0]?.second;

          return (
            <div
              key={key}
              className="border rounded-2xl shadow-sm bg-white overflow-hidden"
            >
              {/* HEADER */}
              <button
                onClick={() => setOpenKey(openKey === key ? null : key)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="text-left">
                  <h2 className="font-semibold text-lg">{key}</h2>
                  <p className="text-sm text-gray-500">
                    Основное значение: {base}
                  </p>
                </div>

                <ChevronDown
                  className={`transition-transform ${
                    openKey === key ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* BODY */}
              {openKey === key && (
                <div className="p-4 border-t space-y-2">
                  {values?.map((item, index) => {
                    const percent = calculatePercent(base, item.second);
                    const isSame = Number(percent) === 0;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-xl border 
                      ${
                        isSame
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Значение #{index + 1}
                          </span>
                          <span className="font-medium text-lg">
                            {item.second}
                          </span>
                          {item.model_name && (
                            <span className="text-sm text-gray-600">
                              Модель: {item.model_name}
                            </span>
                          )}
                        </div>

                        <div
                          className={`text-sm font-semibold ${
                            isSame ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isSame ? "0%" : `${percent}%`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        },
      )}
    </div>
  );
};

export default RuDuplicates;
