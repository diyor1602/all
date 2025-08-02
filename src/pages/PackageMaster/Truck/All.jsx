import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Plus,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  FileText,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const All = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/packageMaster/shipmentPlans");
      setTrucks(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Iltimos, qayta urinib ko'ring",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const formatDate = (dateString) => {
    return dateString?.split("-").reverse().join(".");
  };

  const calculateProgress = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleStatusChange = async (status, id) => {
    const askText = status === "active" ? "Aktiv" : "Qoralama";
    if (!window.confirm(`Statusni ${askText} ga o'zgartirmoqchimisiz?`)) return;
    try {
      setLoading(true);
      await api.patch(`/packageMaster/shipmentPlans/status/${id}`, { status });
      toast({
        title: "Muvaffaqiyatli",
        description: "Status o'zgartirildi",
        style: {
          backgroundColor: "green",
          color: "#fff",
        },
        duration: 1500,
      });
      fetchTrucks();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Iltimos, qayta urinib ko'ring",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, id) => {
    if (status === "completed") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Tugallangan
        </Badge>
      );
    }
    if (status === "active") {
      return (
        <Badge
          className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          onClick={() => {
            handleStatusChange("draft", id);
          }}
        >
          <Clock className="w-3 h-3 mr-1" />
          Aktiv
        </Badge>
      );
    }
    if (status === "draft") {
      return (
        <Badge
          className="bg-gray-500 hover:bg-gray-600 text-white shadow-lg"
          onClick={() => {
            handleStatusChange("active", id);
          }}
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Qoralama
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500 hover:bg-gray-600 text-white shadow-lg">
        <AlertCircle className="w-3 h-3 mr-1" />-
      </Badge>
    );
  };

  const getCardGradient = (index) => {
    const gradients = [
      "bg-gradient-to-br from-blue-50 to-indigo-100",
      "bg-gradient-to-br from-purple-50 to-pink-100",
      "bg-gradient-to-br from-green-50 to-emerald-100",
      "bg-gradient-to-br from-orange-50 to-red-100",
      "bg-gradient-to-br from-teal-50 to-cyan-100",
      "bg-gradient-to-br from-yellow-50 to-amber-100",
    ];
    return gradients[index % gradients.length];
  };

  const getItemCardColor = (index) => {
    const colors = [
      {
        bg: "bg-blue-500",
        icon: "text-blue-600",
      },
      {
        bg: "bg-green-500",
        icon: "text-green-600",
      },
      {
        bg: "bg-orange-500",
        icon: "text-orange-600",
      },
      {
        bg: "bg-purple-500",
        icon: "text-purple-600",
      },
      {
        bg: "bg-teal-500",
        icon: "text-teal-600",
      },
      {
        bg: "bg-yellow-500",
        icon: "text-yellow-600",
      },
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex gap-2 justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Jo'natmalar
              </h1>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg transform hover:scale-105 transition-all"
            >
              <Link to="/packageMaster/truck/add">
                <Plus className="w-4 h-4 mr-2" />
                Yangi qo'shish
              </Link>
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="Model nomi bo'yicha qidirish..."
              value={searchTerm}
              className="bg-white"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="bg-white w-fit">
                <SelectValue placeholder="Barcha holatlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="completed">Tugallangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trucks List */}
        <div className="space-y-8">
          {(() => {
            // Filter trucks based on search term and status
            const filteredTrucks = trucks.filter((truck) => {
              // Filter by status
              if (statusFilter !== "all" && truck.status !== statusFilter) {
                return false;
              }

              // Filter by model name
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const hasMatchingModel = truck.items.some((item) =>
                  item.model?.name?.toLowerCase().includes(searchLower)
                );
                if (!hasMatchingModel) return false;
              }

              return true;
            });

            return filteredTrucks.length === 0 ? (
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Truck className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm || statusFilter !== "all"
                      ? "Qidiruv bo'yicha hech narsa topilmadi"
                      : "Hech qanday plan topilmadi"}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    {searchTerm || statusFilter !== "all"
                      ? "Boshqa so'rov yoki filtrlardan foydalaning"
                      : "Yangi yuklanish planini qo'shish uchun tugmani bosing"}
                  </p>

                  {(searchTerm || statusFilter !== "all") && (
                    <Button
                      variant="outline"
                      className="ml-3"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      Tozalash
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTrucks
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((truck, truckIndex) => {
                  const totalQuantity = truck.items.reduce(
                    (acc, item) => acc + item.quantity,
                    0
                  );
                  const totalCompleted = truck.items.reduce(
                    (acc, item) => acc + item.completed,
                    0
                  );
                  const overallProgress = calculateProgress(
                    totalCompleted,
                    totalQuantity
                  );

                  return (
                    <Card
                      key={truck.id}
                      className={`${getCardGradient(
                        truckIndex
                      )} shadow-xl border-0`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div className="">
                              <CardTitle className="text-2xl text-gray-900 font-bold">
                                Muddat: {formatDate(truck.date)}
                              </CardTitle>
                              <p className="text-gray-600 mt-1 font-medium">
                                {truck.items.length} ta model turi
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(truck.status, truck.id)}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Overall Progress */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">
                              Umumiy holat
                            </h3>
                            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              {overallProgress}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="flex items-center space-x-3 bg-blue-100 rounded-lg p-3">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="text-sm text-blue-600 font-medium">
                                  Jami
                                </span>
                                <div className="font-bold text-blue-900 text-lg">
                                  {totalQuantity}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 bg-green-100 rounded-lg p-3">
                              <div className="p-2 bg-green-500 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="text-sm text-green-600 font-medium">
                                  Bajarilgan
                                </span>
                                <div className="font-bold text-green-900 text-lg">
                                  {totalCompleted}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Progress value={overallProgress} className="h-4" />
                        </div>

                        <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                        {/* Items Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {truck.items.map((item, itemIndex) => {
                            const itemProgress = calculateProgress(
                              item.completed,
                              item.quantity
                            );
                            const colorScheme = getItemCardColor(itemIndex);

                            return (
                              <Card
                                key={item.id}
                                className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all transform"
                              >
                                <CardContent className="p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`p-2 ${colorScheme.bg} rounded-lg shadow-md`}
                                      >
                                        <Box className="w-4 h-4 text-white" />
                                      </div>
                                      <h4 className="font-bold text-gray-900 text-lg">
                                        {item.model?.name || "Model nomi yo'q"}
                                      </h4>
                                    </div>
                                    <Badge
                                      className={`${colorScheme.bg} text-white shadow-md`}
                                    >
                                      {itemProgress}%
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                      <span className="text-gray-600 text-sm font-medium">
                                        Miqdori
                                      </span>
                                      <div className="font-bold text-gray-900 text-xl">
                                        {item.quantity}
                                      </div>
                                    </div>
                                    <div className="bg-gray-100 rounded-lg p-3">
                                      <span className="text-gray-600 text-sm font-medium">
                                        Bajarilgan
                                      </span>
                                      <div className="font-bold text-gray-900 text-xl">
                                        {item.completed}
                                      </div>
                                    </div>
                                  </div>

                                  <Progress
                                    value={itemProgress}
                                    className="h-3 mb-4"
                                  />

                                  {/* Item Details */}
                                  {item.details && item.details.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                                        <div
                                          className={`p-1 ${colorScheme.bg} rounded`}
                                        >
                                          <FileText className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="font-medium">
                                          Tafsilotlar ({item.details.length})
                                        </span>
                                      </div>
                                      {item.details.map((detail, i) => (
                                        <div
                                          key={i}
                                          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm"
                                        >
                                          <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600 font-medium">
                                                Holati:
                                              </span>
                                              <span
                                                className={`text-white px-2 py-1 rounded-full text-xs ${
                                                  statuses[detail.order?.status]
                                                    ?.color || ""
                                                }`}
                                              >
                                                {statuses[detail.order?.status]
                                                  ?.text || "Holati yo'q"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600 font-medium">
                                                Buyurtma:
                                              </span>
                                              <span className="font-bold text-gray-900">
                                                {detail.order?.name ||
                                                  "Nomi yo'q"}
                                              </span>{" "}
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600 font-medium">
                                                Submodel:
                                              </span>
                                              <span className="font-bold text-gray-900">
                                                {detail.submodel?.name ||
                                                  "Nomi yo'q"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600 font-medium">
                                                Miqdori:
                                              </span>
                                              <span className="font-bold text-gray-900">
                                                {detail.quantity}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default All;
