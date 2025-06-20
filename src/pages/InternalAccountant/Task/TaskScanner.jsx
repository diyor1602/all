"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  User,
  Users,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TaskScanner = () => {
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [code, setCode] = useState("");
  const inputRef = useRef(null);
  const [data, setData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("tarification");
  const [savedData, setSavedData] = useState([]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [readCode, setReadCode] = useState("");

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchEmployees = async (term) => {
    if (!term || term.length <= 2) return;
    try {
      setIsSearching(true);
      const response = await api.get("/internalAccountant/employees", {
        params: {
          search: term,
        },
      });
      setEmployees(response.data.data);
      setIsSearching(false);
    } catch (error) {
      setIsSearching(false);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Xodimlar ro'yxatini olishda xatolik",
      });
    }
  };

  // Call API when debounce term changes
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      fetchEmployees(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handleBlur = () => {
    // Trigger immediate fetch on blur
    if (searchTerm.length > 2) {
      fetchEmployees(searchTerm);
    }
  };

  const handleScan = async () => {
    if (!code || !selectedEmployee) return;

    try {
      setIsScanning(true);

      const response = await api.get(
        `/internalAccountant/boxTarifications/${code?.split("A")[1] || code}`,
        {
          params: {
            employee_id: selectedEmployee,
          },
        }
      );

      // Make sure we're setting the correct data
      const taskData = response.data.data || response.data;

      setData(taskData);

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar muvaffaqiyatli yuklandi",
        variant: "default",
      });
      setReadCode(code.split("A")[1] || code);
      setSavedData((prev) => [
        {
          code: code.split("A")[1] || code,
          tarif_code: taskData.box_tarification?.tarification?.code,
          vaqt: taskData.box_tarification?.tarification?.second,
          summa: taskData.box_tarification?.tarification?.summa,
          miqdori: taskData.box_tarification?.quantity,
          jami_summa: taskData.box_tarification?.total,
          employee: taskData.employee?.name || "-",
          timestamp: new Date().toISOString(),
        },
        ...(Array.isArray(prev) ? prev : []),
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kodni o'qishda xatolik",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setData(null);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;

    // If the value contains multiple A prefixes, only keep the first complete entry
    if (value.indexOf("A", 1) !== -1) {
      const firstCompleteEntry = value.substring(0, value.indexOf("A", 1));
      setCode(firstCompleteEntry);
    } else {
      setCode(value);
    }

    // Always keep the input focused
    inputRef.current?.focus();
  };

  useEffect(() => {
    // Focus the input when component mounts or selectedEmployee changes
    if (selectedEmployee && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (data) {
      setCode("");
      inputRef.current?.focus();
    }
  }, [data]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vazifa Skaneri</h1>
        <p className="text-muted-foreground">
          Xodimlar va vazifalarni skanerlash va ma'lumotlarni ko'rish uchun
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Xodimni tanlash</span>
          </CardTitle>
          <CardDescription>
            Vazifani tekshirish uchun avval xodimni tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Xodimni qidirish"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={handleBlur}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <Select
            value={selectedEmployee}
            disabled={!employees?.length}
            onValueChange={(value) => setSelectedEmployee(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Xodimni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {employees
                ?.sort((a, b) => a.name.localeCompare(b.name))
                .map((employee) => (
                  <SelectItem key={employee?.id} value={employee?.id}>
                    {employee?.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <span>Vazifa kodi</span>
          </CardTitle>
          <CardDescription>
            Vazifa kodini kiriting yoki skaner orqali o'qiting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              ref={inputRef}
              disabled={!selectedEmployee}
              placeholder="Kodni kiriting"
              value={code}
              onChange={handleCodeChange}
              className={!selectedEmployee ? "opacity-60" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleScan();
                }
              }}
              autoFocus
            />
            {isScanning && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={!code && !data}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tozalash
          </Button>
          <Button
            onClick={handleScan}
            disabled={!code || !selectedEmployee || isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skanerlanmoqda...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Skanerlash
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {data ? (
        <Card className="overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/40">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Vazifa ma'lumotlari
              </CardTitle>
              <Badge
                variant={
                  data.box_tarification?.status === "completed"
                    ? "success"
                    : data.box_tarification?.status === "inactive"
                    ? "destructive"
                    : data.box_tarification?.status === "active"
                    ? "default"
                    : "default"
                }
              >
                {data.box_tarification?.status === "completed"
                  ? "Bajarilgan"
                  : data.box_tarification?.status === "inactive"
                  ? "Faol emas"
                  : data.box_tarification?.status === "active"
                  ? "Faol"
                  : "Noma'lum"}
              </Badge>
            </div>
            <CardDescription>
              Buyurtma:{" "}
              <span className="font-medium">
                {data.submodel?.order_model?.order?.name}
              </span>
            </CardDescription>
          </CardHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tarification">Tarifikatsiya</TabsTrigger>
                <TabsTrigger value="order">Buyurtma</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="m-0">
              <CardContent className="p-6"></CardContent>
            </TabsContent>

            <TabsContent value="tarification" className="m-0">
              <CardContent className="p-6">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2 border">Nomi</TableHead>
                        <TableHead className="w-1/2 border">Qiymati</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium border">
                          O'qilgan kod
                        </TableCell>
                        <TableCell className="border">{readCode}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Nomi
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification.tarification?.name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Kod
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification.tarification?.code}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Razryad
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification.tarification?.razryad?.name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Vaqt (sekund)
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification.tarification?.second} sekund
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Summa
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification.tarification?.summa} so'm
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Miqdori
                        </TableCell>
                        <TableCell className="border">
                          {data?.box_tarification?.quantity} ta
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Jami narxi
                        </TableCell>
                        <TableCell className="border">
                          {Number.parseFloat(
                            data?.box_tarification?.total
                          ).toLocaleString("ru-RU")}{" "}
                          so'm
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Bajargan xodim
                        </TableCell>
                        <TableCell className="border">
                          <div
                            className={cn(
                              "font-medium",
                              data?.employee?.id === selectedEmployee
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {data?.employee?.name || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="order" className="m-0">
              <CardContent className="p-6">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2 border">Nomi</TableHead>
                        <TableHead className="w-1/2 border">Qiymati</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Buyurtma ID
                        </TableCell>
                        <TableCell className="border">
                          {data?.box_tarification?.order_id}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Buyurtma nomi
                        </TableCell>
                        <TableCell className="border">
                          {
                            data?.box_tarification?.submodel?.order_model?.order
                              ?.name
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Model
                        </TableCell>
                        <TableCell className="border">
                          {
                            data.box_tarification?.submodel?.order_model?.model
                              ?.name
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border">
                          Submodel
                        </TableCell>
                        <TableCell className="border">
                          {data.box_tarification?.submodel?.submodel?.name}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      ) : isScanning ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-medium">
                Ma'lumotlar yuklanmoqda...
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Iltimos, kuting. Ma'lumotlar yuklanmoqda.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : selectedEmployee ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Vazifa kodini kiriting
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Vazifa ma'lumotlarini ko'rish uchun kodni kiriting yoki
                skanerlang
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <User className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Xodimni tanlang</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Vazifa ma'lumotlarini ko'rish uchun avval xodimni tanlang
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {savedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Skanerlangan ma'lumotlar tarixi</span>
            </CardTitle>
            <CardDescription>
              Oxirgi skanerlangan ma'lumotlar ({savedData.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border">Kod</TableHead>
                    <TableHead className="border">Tarif kodi</TableHead>
                    <TableHead className="border">Vaqt (sekund)</TableHead>
                    <TableHead className="border">Summa</TableHead>
                    <TableHead className="border">Miqdori</TableHead>
                    <TableHead className="border">Jami summa</TableHead>
                    <TableHead className="border">Bajargan xodim</TableHead>
                    <TableHead className="border">Skanerlangan vaqt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="border font-medium">
                        {item.code}
                      </TableCell>
                      <TableCell className="border">
                        {item.tarif_code}
                      </TableCell>
                      <TableCell className="border">
                        {item.vaqt} sekund
                      </TableCell>
                      <TableCell className="border">
                        {item.summa} so'm
                      </TableCell>
                      <TableCell className="border">
                        {item.miqdori} ta
                      </TableCell>
                      <TableCell className="border">
                        {Number.parseFloat(item.jami_summa).toLocaleString(
                          "ru-RU"
                        )}{" "}
                        so'm
                      </TableCell>
                      <TableCell className="border">{item.employee}</TableCell>
                      <TableCell className="border">
                        {new Date(item.timestamp).toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskScanner;
