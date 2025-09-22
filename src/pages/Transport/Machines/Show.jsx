import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { ArrowLeft, MapPin, Phone, Truck, User, Wallet } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Ensure it's only digits
  const cleaned = phone.toString().replace(/\D/g, "");

  // Match Uzbek format (998XXXXXXXXX)
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);

  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }

  return phone; // return original if not matching
};

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
    } catch {
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

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("ru-RU") : "—";

  const getAttendanceTypeLabel = (type) => (type === 1 ? "Keldi" : "Kelmadi");

  const filteredAttendances = useMemo(() => {
    if (!transport) return [];
    return transport.transport_attendances.filter((a) =>
      a.date.startsWith(selectedMonth)
    );
  }, [transport, selectedMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <p className="text-lg text-gray-600 mb-4">
          Transport ma'lumotlari topilmadi
        </p>
        <Button onClick={() => navigate(-1)}>Orqaga</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Truck className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{transport.name}</h1>
              <p className="text-sm text-blue-100">ID: {transport.id}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <span
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                transport.is_active
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {transport.is_active ? "Faol" : "Faol emas"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-white text-blue-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 space-y-10">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            icon={<Truck className="h-6 w-6 text-blue-600" />}
            label="Davlat raqami"
            value={transport.state_number}
          />
          <StatCard
            icon={<User className="h-6 w-6 text-indigo-600" />}
            label="Haydovchi"
            value={
              transport.driver_full_name !== "0"
                ? transport.driver_full_name
                : "Tayinlanmagan"
            }
          />
          <StatCard
            icon={<Wallet className="h-6 w-6 text-green-600" />}
            label="Maosh"
            value={`${Number(transport.salary).toLocaleString("ru-RU")} so'm`}
          />
          <StatCard
            icon={<MapPin className="h-6 w-6 text-pink-600" />}
            label="Yo'nalish"
            value={transport?.region?.name || "Ko'rsatilmagan"}
          />
        </div>

        {/* Driver Profile + Finance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              Haydovchi ma'lumotlari
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                {transport.driver_full_name[0] || "?"}
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  {transport.driver_full_name !== "0"
                    ? transport.driver_full_name
                    : "Haydovchi tayinlanmagan"}
                </p>
                <p className="text-sm text-gray-500">
                  {transport.phone
                    ? formatPhoneNumber(transport.phone)
                    : "Ko'rsatilmagan"}
                </p>
                {transport.phone_2 && (
                  <p className="text-sm text-gray-500">
                    {formatPhoneNumber(transport.phone_2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              Moliyaviy ma'lumotlar
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow
                label="Yoqilg'i bonusi"
                value={`${Number(transport.fuel_bonus).toLocaleString(
                  "ru-RU"
                )} so'm`}
              />
              <InfoRow
                label="Balans"
                value={`${Number(transport.balance).toLocaleString(
                  "ru-RU"
                )} so'm`}
              />
              <InfoRow
                label="Sig'imi"
                value={`${transport.capacity} o'rindiq`}
              />
              <InfoRow label="Masofa" value={`${transport.distance} km`} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
          <Tabs
            defaultValue="attendances"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border-b">
              <TabsTrigger value="attendances">Davomat</TabsTrigger>
              <TabsTrigger value="payments">To'lovlar</TabsTrigger>
            </TabsList>

            <TabsContent value="attendances" className="p-6">
              <TableWithMonthFilter
                title="Davomat ro'yxati"
                data={filteredAttendances}
                emptyText="Davomat ma'lumotlari mavjud emas"
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                columns={[
                  { header: "Sana", render: (a) => formatDate(a.date) },
                  {
                    header: "Holat",
                    render: (a) => (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.attendance_type === 1
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {getAttendanceTypeLabel(a.attendance_type)}
                      </span>
                    ),
                  },
                  {
                    header: "Maosh",
                    render: (a) => `${Number(a.salary).toLocaleString()} so'm`,
                  },
                  {
                    header: "Yoqilg'i bonusi",
                    render: (a) =>
                      `${Number(a.fuel_bonus).toLocaleString()} so'm`,
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="payments" className="p-6">
              <TableWithMonthFilter
                title="To'lovlar tarixi"
                data={transport?.payments}
                emptyText="To'lovlar mavjud emas"
                hideMonthFilter
                columns={[
                  { header: "Sana", render: (p) => formatDate(p.date) },
                  {
                    header: "Summa",
                    render: (p) => `${Number(p.amount).toLocaleString()} so'm`,
                  },
                  { header: "Izoh", render: (p) => p.description || "-" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

/* Reusable Components */
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white shadow-lg rounded-xl p-5 flex items-start gap-3 hover:shadow-xl transition">
    <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-gray-700">
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const TableWithMonthFilter = ({
  title,
  data,
  emptyText,
  columns,
  selectedMonth,
  setSelectedMonth,
  hideMonthFilter,
}) => (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {!hideMonthFilter && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="month"
            className="text-sm font-medium text-gray-600 whitespace-nowrap"
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
      )}
    </div>

    {!data || data.length === 0 ? (
      <div className="text-center py-8 text-gray-500">{emptyText}</div>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((col, i) => (
                  <td key={i} className="px-6 py-4">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
);

export default Show;
