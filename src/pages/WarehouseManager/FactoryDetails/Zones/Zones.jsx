import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, ChevronLeft, ChevronRight, MapPin, UserPlus, Trash2, Users } from "lucide-react";
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

const emptyForm = { name: "", comment: "" };

const Zones = () => {
  const { floorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildingName = location.state?.buildingName || "Bino";
  const buildingId = location.state?.buildingId;
  const floorName = location.state?.floorName || "Qavat";

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState(emptyForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [responsiblesOpen, setResponsiblesOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [responsibles, setResponsibles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assigningId, setAssigningId] = useState("");
  const [responsiblesLoading, setResponsiblesLoading] = useState(false);

  const getZones = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/floors/${floorId}/zones`);
      setZones(res.data);
    } catch {
      toast({ title: "Xatolik", description: "Zonalar yuklanmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/superhr/employees?per_page=200");
      setEmployees(res.data?.data || res.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    getZones();
    fetchEmployees();
  }, [floorId]);

  const handleAdd = async () => {
    if (!addPayload.name.trim()) {
      toast({ title: "Xatolik", description: "Zona nomi kiritilmagan", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/floors/${floorId}/zones`, addPayload);
      toast({ title: "Muvaffaqiyatli", description: "Zona qo'shildi", duration: 1500, style: { background: "green", color: "white" } });
      setAddOpen(false);
      setAddPayload(emptyForm);
      getZones();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Zona qo'shishda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editPayload.name.trim()) {
      toast({ title: "Xatolik", description: "Zona nomi kiritilmagan", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/zones/${editingId}`, editPayload);
      toast({ title: "Muvaffaqiyatli", description: "Zona yangilandi", duration: 1500, style: { background: "green", color: "white" } });
      setEditOpen(false);
      setEditPayload(emptyForm);
      setEditingId(null);
      getZones();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Zona yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openResponsibles = async (zone) => {
    setSelectedZone(zone);
    setResponsiblesOpen(true);
    setResponsiblesLoading(true);
    try {
      const res = await api.get(`/zones/${zone.id}/responsibles`);
      setResponsibles(res.data);
    } catch {
      toast({ title: "Xatolik", description: "Mas'ullar yuklanmadi", variant: "destructive" });
    } finally {
      setResponsiblesLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningId) {
      toast({ title: "Xatolik", description: "Xodim tanlanmagan", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/zones/${selectedZone.id}/responsibles`, { employee_id: assigningId });
      toast({ title: "Muvaffaqiyatli", description: "Mas'ul tayinlandi", duration: 1500, style: { background: "green", color: "white" } });
      setAssigningId("");
      const res = await api.get(`/zones/${selectedZone.id}/responsibles`);
      setResponsibles(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Mas'ul tayinlashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveResponsible = async (responsibleId) => {
    try {
      await api.delete(`/zones/${selectedZone.id}/responsibles/${responsibleId}`);
      toast({ title: "Muvaffaqiyatli", description: "Mas'ul olib tashlandi", duration: 1500, style: { background: "green", color: "white" } });
      setResponsibles((prev) => prev.filter((r) => r.id !== responsibleId));
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 1500,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zona qo'shish</DialogTitle>
            <DialogDescription>{buildingName} › {floorName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Zona nomi *"
              value={addPayload.name}
              onChange={(e) => setAddPayload({ ...addPayload, name: e.target.value })}
            />
            <Textarea
              placeholder="Izoh"
              rows={3}
              value={addPayload.comment}
              onChange={(e) => setAddPayload({ ...addPayload, comment: e.target.value })}
            />
          </div>
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
            <DialogTitle>Zonani tahrirlash</DialogTitle>
            <DialogDescription>{buildingName} › {floorName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Zona nomi *"
              value={editPayload.name}
              onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
            />
            <Textarea
              placeholder="Izoh"
              rows={3}
              value={editPayload.comment}
              onChange={(e) => setEditPayload({ ...editPayload, comment: e.target.value })}
            />
          </div>
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

      {/* Responsibles Dialog */}
      <Dialog open={responsiblesOpen} onOpenChange={setResponsiblesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> {selectedZone?.name} — Mas'ullar
            </DialogTitle>
            <DialogDescription>{buildingName} › {floorName}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Select value={assigningId} onValueChange={setAssigningId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Xodim tanlang" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.name} {emp.last_name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssign} disabled={submitting} size="icon" className="bg-green-500 hover:bg-green-600">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
            {responsiblesLoading ? (
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            ) : responsibles.length === 0 ? (
              <p className="text-sm text-gray-500">Mas'ullar yo'q</p>
            ) : (
              responsibles.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm font-medium">{r.name} {r.last_name || ""}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 h-7 w-7"
                    onClick={() => handleRemoveResponsible(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              buildingId
                ? navigate(`/superhr/factory-details/buildings/${buildingId}/floors`, { state: { buildingName } })
                : navigate(-1)
            }
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-gray-500">{buildingName} › {floorName}</p>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <MapPin className="w-6 h-6 text-primary" />
              Zonalar
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
      ) : zones.length === 0 ? (
        <p className="text-gray-500">Zonalar topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone, idx) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl shadow-md hover:shadow-xl transition border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">{zone.name}</CardTitle>
                </CardHeader>
                {zone.comment && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{zone.comment}</p>
                  </CardContent>
                )}
                <CardContent className="pt-0 flex justify-between items-center gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        navigate(
                          `/superhr/factory-details/zones/${zone.id}/equipment`,
                          { state: { buildingName, floorName, zoneName: zone.name } }
                        )
                      }
                    >
                      Jihozlar <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => openResponsibles(zone)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setEditingId(zone.id);
                      setEditPayload({ name: zone.name || "", comment: zone.comment || "" });
                      setEditOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Zones;
