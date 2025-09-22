import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { ArrowLeft, MapPin, Phone, Truck, User } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Show = () => {
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendances");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchTransport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transport/transports/show/${id}`);
      setTransport(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Transport ma'lumotlari olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Ko'rsatilmagan";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  const getAttendanceTypeLabel = (type) => {
    return type === 1 ? "Keldi" : "Kelmadi";
  };

  const filteredAttendances = useMemo(() => {
    if (!transport) return [];
    return transport.transport_attendances.filter((attendance) => {
      return attendance.date.startsWith(selectedMonth);
    });
  }, [transport, selectedMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg mb-4">Transport ma'lumotlari topilmadi</p>
        <Button onClick={() => navigate(-1)}>Orqaga</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga
        </Button>
        <h1 className="text-2xl font-bold">Transport ma'lumotlari</h1>
      </div>

      {/* Transport header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{transport.name}</h2>
              <p className="text-gray-500">ID: {transport.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                transport.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {transport.is_active ? "Faol" : "Faol emas"}
            </span>
          </div>
        </div>
      </div>

      {/* Transport details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Vehicle Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Transport ma'lumotlari</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Davlat raqami:</span>
              <span className="font-medium">{transport.state_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sig'imi:</span>
              <span className="font-medium">{transport.capacity} o'rindiq</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Masofa:</span>
              <span className="font-medium">{transport.distance} km</span>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Haydovchi ma'lumotlari</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="font-medium">
                {transport.driver_full_name !== "0"
                  ? transport.driver_full_name
                  : "Haydovchi tayinlanmagan"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-500" />
              <span>{transport?.phone || "Ko'rsatilmagan"}</span>
            </div>
            {transport?.phone_2 && (
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-500" />
                <span>{transport.phone_2}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Moliyaviy ma'lumotlar</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Maosh:</span>
              <span className="font-medium">
                {Number(transport.salary).toLocaleString("ru-RU")} so'm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Yoqilg'i bonusi:</span>
              <span className="font-medium">
                {Number(transport.fuel_bonus).toLocaleString("ru-RU")} so'm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Balans:</span>
              <span className="font-medium">
                {Number(transport.balance).toLocaleString("ru-RU")} so'm
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>Hudud: {transport?.region?.name || "Ko'rsatilmagan"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Attendances and Payments */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Tabs
          defaultValue="attendances"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendances">Davomat</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
          </TabsList>

          <TabsContent value="attendances" className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold">Davomat ro'yxati</h3>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="month"
                  className="text-sm font-medium text-gray-700"
                >
                  Oy:
                </label>
                <input
                  type="month"
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {filteredAttendances?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Sana
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Holat
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Maosh
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Yoqilg'i bonusi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendances.map((attendance) => (
                      <tr key={attendance.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(attendance.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendance.attendance_type === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {getAttendanceTypeLabel(attendance.attendance_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(attendance.salary).toLocaleString()} so'm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(attendance.fuel_bonus).toLocaleString()} so'm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Davomat ma'lumotlari mavjud emas
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">To'lovlar tarixi</h3>
            </div>

            {transport?.payments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Sana
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Summa
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Izoh
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transport?.payments?.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(payment.amount).toLocaleString()} so'm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                To'lovlar mavjud emas
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Show;
