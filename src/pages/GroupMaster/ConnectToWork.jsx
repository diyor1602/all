import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ConnectToWork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState({
    order: null,
    tarifications: [],
    employees: [],
  });
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleError = useCallback(
    (error) => {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tarificationsRes, employeesRes, orderRes] = await Promise.all([
        api.get(`/groupMaster/tarifications/${id}`),
        api.get("/groupMaster/employees"),
        api.get(`/groupMaster/orders/show/${id}`),
      ]);

      setData({
        tarifications: tarificationsRes.data,
        employees: employeesRes.data,
        order: orderRes.data,
      });

      // Initialize selected employees with pre-selected ones from the API data
      const initialSelections = {};
      if (tarificationsRes.data && tarificationsRes.data.submodels) {
        tarificationsRes.data.submodels.forEach((submodel) => {
          submodel.tarification_categories.forEach((category) => {
            category.tarifications.forEach((tarification) => {
              if (tarification.employee) {
                initialSelections[tarification.id] = tarification.employee.id;
              }
            });
          });
        });
      }
      setSelectedEmployees(initialSelections);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [id, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEmployeeSelect = (tarificationId, employeeId) => {
    setSelectedEmployees((prev) => ({
      ...prev,
      [tarificationId]: employeeId,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for the API
      const saveData = Object.entries(selectedEmployees).map(
        ([tarification_id, user_id]) => ({
          tarification_id: parseInt(tarification_id),
          user_id: parseInt(user_id),
        })
      );

      // Send data to the API
      await api.post(`/groupMaster/tarifications`, {
        data: saveData,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Refresh data to get updated state
      fetchData();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data.order || data.order.status !== "tailoring") {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Buyurtma topilmadi
          </h2>
          <p className="text-gray-600">
            Ushbu buyurtma mavjud emas yoki tikuvda emas
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/groupMaster/tailoring")}
          >
            Orqaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto md:px-4 py-6">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-lg mb-2">
              <span className="text-primary">#{id}</span> /{" "}
              <span>{data.order.name}</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-gray-600">Model: </span>
                <span className="font-semibold">
                  {data.order.orderModel.model.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Material: </span>
                <span className="font-semibold">
                  {data.order.orderModel.material.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Holat: </span>
                <span className="bg-primary text-white px-2 py-1 rounded text-sm">
                  Tikuvda
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {data.tarifications?.submodels?.map((submodel) => (
          <div
            key={submodel.id}
            className="bg-white my-4 rounded-xl shadow-md p-6 transition-all hover:shadow-lg"
          >
            <div className="font-bold text-center text-primary text-xl mb-6 pb-2 border-b">
              {submodel?.submodel?.name}
            </div>
            <div className="space-y-6">
              {submodel?.tarification_categories
                ?.sort((a, b) =>
                  a?.code?.localeCompare(b?.code, undefined, {
                    numeric: true,
                    sensitivity: "base",
                  })
                )
                ?.map((category) => (
                  <div key={category.id} className="mb-4">
                    <div className="font-semibold text-lg mb-3 bg-gray-50 p-2 rounded">
                      {category?.name}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">
                              Ish nomi
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">
                              Ishchi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {category?.tarifications?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="border px-4 py-3 max-w-[50%] w-full">
                                <div className="flex gap-1 flex-col">
                                  <div>{item.name}</div>
                                  <div className="text-gray-600 text-xs">
                                    {item.code}
                                  </div>
                                </div>
                              </td>
                              <td className="border px-4 py-3 max-w-[50%] w-full">
                                <Select
                                  value={selectedEmployees[item.id] || ""}
                                  onValueChange={(value) =>
                                    handleEmployeeSelect(item.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Tanlang" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {data.employees?.map((employee) => (
                                      <SelectItem
                                        key={employee.id}
                                        value={employee.id}
                                      >
                                        {employee?.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="px-8 w-full"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Saqlash
        </Button>
      </div>
    </div>
  );
};

export default ConnectToWork;
