import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, ChevronLeft, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = ["Texnik xizmat", "Remont", "Tekshiruv", "Boshqa"];
const emptyForm = { date: "", type: "", description: "", next_maintenance_date: "" };

const Maintenance = () => {
  const { equipmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildingName = location.state?.buildingName || "Bino";
  const floorName = location.state?.floorName || "Qavat";
  const zoneName = location.state?.zoneName || "Zona";
  const equipmentName = location.state?.equipmentName || "Jihoz";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState(emptyForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const getRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/equipment/${equipmentId}/maintenance`);
      setRecords(res.data);
    } catch {
      toast({ title: "Xatolik", description: "Ta'mirlash tarixi yuklanmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecords();
  }, [equipmentId]);

  const handleAdd = async () => {
    if (!addPayload.date || !addPayload.type) {
      toast({ title: "Xatolik", description: "Sana va tur kiritilishi shart", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/equipment/${equipmentId}/maintenance`, addPayload);
      toast({ title: "Muvaffaqiyatli", description: "Yozuv qo'shildi", duration: 1500, style: { background: "green", color: "white" } });
      setAddOpen(false);
      setAddPayload(emptyForm);
      getRecords();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Qo'shishda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editPayload.date || !editPayload.type) {
      toast({ title: "Xatolik", description: "Sana va tur kiritilishi shart", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/maintenance/${editingId}`, editPayload);
      toast({ title: "Muvaffaqiyatli", description: "Yozuv yangilandi", duration: 1500, style: { background: "green", color: "white" } });
      setEditOpen(false);
      setEditPayload(emptyForm);
      setEditingId(null);
      getRecords();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const MaintenanceForm = ({ payload, setPayload }) => (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Sana *</label>
          <Input
            type="date"
            value={payload.date}
            onChange={(e) => setPayload({ ...payload, date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Keyingi sana</label>
          <Input
            type="date"
            value={payload.next_maintenance_date}
            onChange={(e) => setPayload({ ...payload, next_maintenance_date: e.target.value })}
          />
        </div>
      </div>
      <Select value={payload.type} onValueChange={(v) => setPayload({ ...payload, type: v })}>
        <SelectTrigger><SelectValue placeholder="Tur tanlang *" /></SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Tavsif"
        rows={3}
        value={payload.description}
        onChange={(e) => setPayload({ ...payload, description: e.target.value })}
      />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta'mirlash yozuvi qo'shish</DialogTitle>
            <DialogDescription>{buildingName} › {floorName} › {zoneName} › {equipmentName}</DialogDescription>
          </DialogHeader>
          <MaintenanceForm payload={addPayload} setPayload={setAddPayload} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddPayload(emptyForm); }}>
              Bekor qilish
            </Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yozuvni tahrirlash</DialogTitle>
            <DialogDescription>{equipmentName}</DialogDescription>
          </DialogHeader>
          <MaintenanceForm payload={editPayload} setPayload={setEditPayload} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditPayload(emptyForm); setEditingId(null); }}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-gray-500">{buildingName} › {floorName} › {zoneName} › {equipmentName}</p>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <ClipboardList className="w-6 h-6 text-primary" />
              Ta'mirlash tarixi
            </h1>
          </div>
        </div>
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600"
          onClick={() => { setAddPayload(emptyForm); setAddOpen(true); }}
        >
          <Plus />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">Ta'mirlash yozuvlari topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl shadow-md hover:shadow-xl transition border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{record.type}</CardTitle>
                  <p className="text-sm text-gray-500">{record.date}</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {record.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>
                  )}
                  {record.next_maintenance_date && (
                    <p className="text-xs text-blue-600">
                      Keyingi: {record.next_maintenance_date}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditingId(record.id);
                        setEditPayload({
                          date: record.date || "",
                          type: record.type || "",
                          description: record.description || "",
                          next_maintenance_date: record.next_maintenance_date || "",
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
