import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import formatNumber from "@/utils/formatNumber";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
} from "lucide-react";

const Balance = () => {
  const { toast } = useToast();

  const [balance, setBalance] = useState(2450000);

  const incomes = [
    {
      id: 1,
      name: "Yo'lovchi tushumlari",
      description: "Toshkent - Samarqand marshruti",
      amount: 3500000,
      date: "2024-07-10",
      category: "Ticket",
      passenger: "15 ta yo'lovchi",
    },
    {
      id: 2,
      name: "Yuk tashish",
      description: "Buxoro - Xiva marshruti",
      amount: 2800000,
      date: "2024-07-09",
      category: "Cargo",
      passenger: "3 tonna yuk",
    },
    {
      id: 3,
      name: "Ijaraga berish",
      description: "Kunlik avtomobil ijarasi",
      amount: 1500000,
      date: "2024-07-08",
      category: "Rental",
      passenger: "1 kun",
    },
    {
      id: 4,
      name: "Yo'lovchi tushumlari",
      description: "Farg'ona - Andijon marshruti",
      amount: 1200000,
      date: "2024-07-07",
      category: "Ticket",
      passenger: "8 ta yo'lovchi",
    },
    {
      id: 5,
      name: "Korporativ tushum",
      description: "Kompaniya uchun xizmat",
      amount: 5000000,
      date: "2024-07-06",
      category: "Corporate",
      passenger: "Shartnoma #1234",
    },
  ];

  const outcomes = [
    {
      id: 1,
      name: "Benzin to'lovi",
      description: "AI-95 benzin, 40 litr",
      amount: 520000,
      date: "2024-07-10",
      category: "Fuel",
      status: "completed",
    },
    {
      id: 2,
      name: "Haydovchi maoshi",
      description: "Iyul oyi uchun maosh",
      amount: 2500000,
      date: "2024-07-09",
      category: "Salary",
      status: "completed",
    },
    {
      id: 3,
      name: "Texnik xizmat",
      description: "Moy almashtirish",
      amount: 350000,
      date: "2024-07-08",
      category: "Maintenance",
      status: "completed",
    },
    {
      id: 4,
      name: "Yo'l haqi",
      description: "Toll yo'l to'lovi",
      amount: 150000,
      date: "2024-07-07",
      category: "Toll",
      status: "completed",
    },
    {
      id: 5,
      name: "Avtomobil yuvashi",
      description: "Tashqi va ichki tozalash",
      amount: 80000,
      date: "2024-07-06",
      category: "Cleaning",
      status: "completed",
    },
    {
      id: 6,
      name: "Qismlar va ehtiyot qismlar",
      description: "Tormoz kolodkasi",
      amount: 420000,
      date: "2024-07-05",
      category: "Parts",
      status: "pending",
    },
  ];

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalOutcome = outcomes.reduce((sum, item) => sum + item.amount, 0);

  const getCategoryColor = (category) => {
    const colors = {
      Ticket: "bg-blue-100 text-blue-800",
      Cargo: "bg-purple-100 text-purple-800",
      Rental: "bg-orange-100 text-orange-800",
      Corporate: "bg-indigo-100 text-indigo-800",
      Fuel: "bg-red-100 text-red-800",
      Salary: "bg-green-100 text-green-800",
      Maintenance: "bg-yellow-100 text-yellow-800",
      Toll: "bg-pink-100 text-pink-800",
      Cleaning: "bg-cyan-100 text-cyan-800",
      Parts: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moliyaviy Balans</h1>
          <p className="text-gray-500 mt-1">
            Transport tizimi moliyaviy hisoboti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">2024-yil Iyul</span>
        </div>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">
              Joriy Balans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(balance)} so'm
            </div>
            <div className="flex items-center mt-2 text-sm text-blue-100">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12.5% o'tgan oyga nisbatan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100">
              Jami Tushumlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totalIncome)} so'm
            </div>
            <div className="flex items-center mt-2 text-sm text-green-100">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>{incomes.length} ta operatsiya</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-100">
              Jami Xarajatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totalOutcome)} so'm
            </div>
            <div className="flex items-center mt-2 text-sm text-red-100">
              <ArrowDownRight className="w-4 h-4 mr-1" />
              <span>{outcomes.length} ta operatsiya</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="incomes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incomes" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tushumlar ({incomes.length})
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Xarajatlar ({outcomes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomes" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {incomes.map((income) => (
              <Card
                key={income.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {income.name}
                        </h3>
                        <Badge className={getCategoryColor(income.category)}>
                          {income.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {income.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{income.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{income.passenger}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatNumber(income.amount)}
                      </div>
                      <div className="text-sm text-gray-500">so'm</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {outcomes.map((outcome) => (
              <Card
                key={outcome.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {outcome.name}
                        </h3>
                        <Badge className={getCategoryColor(outcome.category)}>
                          {outcome.category}
                        </Badge>
                        {outcome.status === "pending" && (
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-700"
                          >
                            Kutilmoqda
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {outcome.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{outcome.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        -{formatNumber(outcome.amount)}
                      </div>
                      <div className="text-sm text-gray-500">so'm</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hisobotlar Xulosasi</CardTitle>
          <CardDescription>Oylik moliyaviy ko'rsatkichlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {incomes.length}
              </div>
              <div className="text-sm text-gray-500">Tushumlar soni</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {outcomes.length}
              </div>
              <div className="text-sm text-gray-500">Xarajatlar soni</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(totalIncome - totalOutcome)}
              </div>
              <div className="text-sm text-gray-500">Sof Foyda</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(((totalIncome - totalOutcome) / totalIncome) * 100).toFixed(
                  1,
                )}
                %
              </div>
              <div className="text-sm text-gray-500">Foyda Foizi</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Balance;
