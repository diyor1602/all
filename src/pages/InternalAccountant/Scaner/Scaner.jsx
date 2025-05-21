"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Scaner = () => {
  const { toast } = useToast();

  const [scannedData, setScannedData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [results, setResults] = useState({});

  // Fetch data when ID is scanned
  const fetchData = useCallback(async () => {
    if (!scannedData) return;

    setIsLoading(true);
    const sendingData = scannedData.split("A")[1] || scannedData;

    try {
      const response = await api.get(
        `/internalAccountant/dailyPlan/${sendingData}`
      );
      setData(response.data);

      // Initialize results state with current values
      const initialResults = {};
      response.data?.items?.forEach((item) => {
        initialResults[item.id] = item?.actual || "";
      });
      setResults(initialResults);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [scannedData, toast]);

  // Handle input change for result fields
  const handleResultChange = (id, value) => {
    setResults((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!data) return;

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const formData = {
        employee_id: data.employee_id || 1725, // Fallback to example value if not available
        daily_plan_id: data.id || Number.parseInt(scannedData),
        tarifications: data.items.map((item) => ({
          id: item.tarification.id,
          quantity: Number.parseInt(results[item.id] || item.actual || 0),
        })),
      };

      // Send data to API
      await api.patch(
        "/internalAccountant/employeeSalaryCalculation",
        formData
      );

      toast({
        title: "Success",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi",
      });

      // Reset form after successful submission
      setScannedData("");
      setData(null);
      setResults({});
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounced input handler
  const handleInputChange = (e) => {
    const value = e.target.value;
    setScannedData(value);

    // Use setTimeout to debounce the API call
    if (value) {
      const debounceTimeout = setTimeout(() => {
        fetchData();
      }, 300);

      return () => clearTimeout(debounceTimeout);
    }
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium">ID:</span>
        <Input
          autoFocus
          onChange={handleInputChange}
          value={scannedData}
          disabled={isLoading || isSubmitting}
          placeholder={isLoading ? "Loading..." : "Scan ID"}
          className="flex-1"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        data && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                Xodim:{" "}
                <span className="font-medium">{data.employee?.name}</span>
              </div>
              <div>
                Sana:{" "}
                <span className="font-medium">
                  {data.date?.split("-").reverse().join(".")}
                </span>
              </div>
              <div>
                Umumiy vaqt:{" "}
                <span className="font-medium">{data?.total_work_minutes}</span>{" "}
                daqiqa
              </div>
              <div>
                Umumiy summa:{" "}
                <span className="font-medium">
                  {Number.parseFloat(data?.total_earned).toLocaleString(
                    "ru-RU"
                  )}{" "}
                </span>
                so'm
              </div>
              <div>
                Ishga ketadigan vaqt:{" "}
                <span className="font-medium">
                  {Number.parseFloat(data?.used_minutes).toLocaleString(
                    "ru-RU"
                  )}{" "}
                </span>
                daqiqa
              </div>
              <div>
                Qo'shimcha vaqt:{" "}
                <span className="font-medium">
                  {(
                    Number.parseFloat(data?.total_work_minutes) -
                    Number.parseFloat(data?.used_minutes)
                  ).toLocaleString("ru-RU")}{" "}
                </span>
                daqiqa
              </div>
              <div>
                Xodim topgan pul:{" "}
                <span className="font-medium">
                  {Number.parseFloat(
                    data?.items?.reduce(
                      (acc, item) =>
                        acc + item?.actual * item?.tarification?.summa,
                      0
                    )
                  ).toLocaleString("ru-RU")}{" "}
                </span>
                so'm
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Kod
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Ish nomi
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Vaqt (sekund)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Narxi (so'm)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Reja
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      Natija
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item?.tarification?.code}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item?.tarification?.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <div>
                            {Number.parseFloat(
                              item?.tarification?.second
                            ).toLocaleString("ru-RU")}
                          </div>
                          <div className="w-full h-[1px] bg-gray-300"></div>
                          <div>
                            {Number.parseFloat(
                              item?.tarification?.second * item?.count
                            ).toLocaleString("ru-RU")}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <div>
                            {Number.parseFloat(
                              item?.tarification?.summa
                            ).toLocaleString("ru-RU")}
                          </div>
                          <div className="w-full h-[1px] bg-gray-300"></div>
                          <div>
                            {Number.parseFloat(
                              item?.tarification?.summa * item?.count
                            ).toLocaleString("ru-RU")}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item?.count}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          value={results[item.id] || ""}
                          onChange={(e) =>
                            handleResultChange(item.id, e.target.value)
                          }
                          disabled={isSubmitting}
                          type="number"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Scaner;
