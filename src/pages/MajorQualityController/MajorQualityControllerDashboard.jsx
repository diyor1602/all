import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MajorQualityControllerDashboard = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.get("majorQualityController/dashboard", {
        params: {
          date: selectedDate,
        },
      });
      setData(res.data);
    } catch {
      toast({
        title: "Diqqat",
        description: "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [selectedDate]);

  const qc = data?.quality_controls;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-fit bg-white"
        />
      </div>

      {loading ? (
        <div className="w-full h-[90vh] flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={42} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bugungi braklar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{qc?.today_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Haftalik braklar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{qc?.week_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  To'g'irlangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {qc?.status_breakdown_today?.find(
                    (s) => s.status === "approved",
                  )?.total || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kutilmoqda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {qc?.status_breakdown_today?.find(
                    (s) => s.status === "pending",
                  )?.total || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Breakers Today */}
          <Card>
            <CardHeader>
              <CardTitle>Bugungi eng ko'p brak qilganlar (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Braklar soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qc?.top_brakers?.today?.map((breaker, index) => (
                    <TableRow key={breaker.employee_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={breaker.img} alt={breaker.name} />
                            <AvatarFallback>
                              {breaker.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{breaker.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {breaker.fail_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Breakers Week */}
          <Card>
            <CardHeader>
              <CardTitle>Haftalik eng ko'p brak qilganlar (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Braklar soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qc?.top_brakers?.week?.map((breaker, index) => (
                    <TableRow key={breaker.employee_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={breaker.img} alt={breaker.name} />
                            <AvatarFallback>
                              {breaker.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{breaker.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {breaker.fail_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Fixers Week */}
          <Card>
            <CardHeader>
              <CardTitle>Haftalik eng ko'p tuzatganlar (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Tuzatganlar soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qc?.top_fixers_week?.map((fixer, index) => (
                    <TableRow key={fixer.employee_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={fixer.img} alt={fixer.name} />
                            <AvatarFallback>
                              {fixer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{fixer.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {fixer.fixed_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Stage Tarifications Week */}
          <Card>
            <CardHeader>
              <CardTitle>
                Haftalik eng ko'p brak bo'lgan bosqichlar (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Bosqich nomi</TableHead>
                    <TableHead>Braklar soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qc?.top_stage_tarifications_week?.map((stage, index) => (
                    <TableRow key={stage.tarification_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {stage.tarification_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stage.total}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Kutilmoqda ({qc?.pending_list?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rasm</TableHead>
                      <TableHead>Buyurtma</TableHead>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Vaqt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qc?.pending_list.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <img
                            src={item.image}
                            alt="QC"
                            className="h-12 w-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedImage(item.image);
                              setImgDialogOpen(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.order_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {item.order_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={item.employee?.img}
                                alt={item.employee?.name}
                              />
                              <AvatarFallback>
                                {item.employee?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">{item.employee?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.created_at).toLocaleString("ru-RU")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Image Dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Brak rasmi</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Brak rasmi"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MajorQualityControllerDashboard;
