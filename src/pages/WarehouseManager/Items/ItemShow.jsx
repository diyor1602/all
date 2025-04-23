import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Package,
  Warehouse,
  History,
  DollarSign,
  Boxes,
  QrCode,
  Tag,
  ChevronLeft,
  CalendarDays,
  User,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { format } from "date-fns";
import { statuses } from "@/lib/status";

const ItemShow = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/warehouseManager/items/${id}`);
        setItem(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Mahsulotni olishda xatolik",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, toast]);

  const getTransactionTypeColor = (type) => {
    return type === "incoming" ? "text-green-600" : "text-red-600";
  };

  const getTransactionTypeIcon = (type) => {
    return type === "incoming" ? (
      <ArrowDownLeft className="w-4 h-4" />
    ) : (
      <ArrowUpRight className="w-4 h-4" />
    );
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center p-6">
          <CardContent className="pt-6">
            <p className="text-xl font-medium">Mahsulot topilmadi</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Orqaga
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { item: itemData, stock_balances, history } = item;

  const totalStock = stock_balances.reduce(
    (sum, balance) => sum + parseFloat(balance.quantity),
    0
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Orqaga
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Item details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center mb-2">
                <Package className="mr-2 h-6 w-6 text-primary" />
                Mahsulot
              </CardTitle>
              <Badge variant="outline">{itemData.type.name}</Badge>
            </div>
            <CardDescription>ID: {itemData.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {itemData.image && (
              <div className="rounded-md overflow-hidden border">
                <img
                  src={itemData.image}
                  alt={itemData.name}
                  className="w-full h-48 object-cover object-center"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nomi:</span>
                <span className="font-medium">{itemData.name}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kod:</span>
                <span className="font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-gray-500" />
                  {itemData.code}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Narxi:</span>
                <span className="font-medium flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                  {itemData.price} {itemData.currency.name}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">O'lchov birligi:</span>
                <Badge variant="secondary">{itemData.unit.name}</Badge>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Minimal miqdor:</span>
                <span className="font-medium">{itemData.min_quantity}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rangi:</span>
                <div className="flex items-center gap-2">
                  {itemData.color.hex && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: `#${itemData.color.hex}` }}
                    />
                  )}
                  <span>{itemData.color.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 rounded-b-lg">
            <div className="w-full flex justify-between items-center mt-5">
              <span className="text-muted-foreground">Jami zaxira:</span>
              <Badge className="text-lg px-3 py-1">
                <Boxes className="mr-2 h-4 w-4" />
                {totalStock} {itemData.unit.name}
              </Badge>
            </div>
          </CardFooter>
        </Card>

        {/* Right column - Tabs for stock and history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Batafsil ma'lumot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stock" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stock" className="flex items-center">
                  <Warehouse className="mr-2 h-4 w-4" />
                  Zaxira holati
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  Tarix
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stock" className="mt-4">
                <div className="rounded-md border">
                  <Table className="whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ombor</TableHead>
                        <TableHead>Buyurtma</TableHead>
                        <TableHead>Holati</TableHead>
                        <TableHead className="text-right">Miqdor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stock_balances.map((balance) => (
                        <TableRow key={balance.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{balance.warehouse.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {balance.warehouse.location}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {balance.order ? (
                              <div className="flex flex-col">
                                <span>
                                  {balance.order.id} {balance.order.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {balance.order.comment}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {balance.order ? (
                              <Badge
                                className={
                                  statuses[balance.order.status]?.secondaryBg +
                                  " " +
                                  statuses[balance.order.status]?.textColor +
                                  " " +
                                  statuses[balance.order.status]?.border
                                }
                              >
                                {statuses[balance.order.status]?.text}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {balance.quantity} {itemData.unit.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="rounded-md border">
                  <Table className="whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Xodim</TableHead>
                        <TableHead>Miqdor</TableHead>
                        <TableHead>Narx</TableHead>
                        <TableHead>Izoh</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                <span>{formatDate(entry.created_at)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <User className="h-4 w-4" />
                              </Avatar>
                              <span className="text-sm">
                                {entry.employee.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-1 font-medium ${getTransactionTypeColor(
                                entry.type
                              )}`}
                            >
                              {getTransactionTypeIcon(entry.type)}
                              <span>
                                {entry.quantity} {itemData.unit.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.price} {itemData.currency.name}
                          </TableCell>
                          <TableCell>
                            {entry.comment || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ItemShow;
