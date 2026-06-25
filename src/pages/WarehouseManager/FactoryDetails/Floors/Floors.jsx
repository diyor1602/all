import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const emptyForm = { name: "", comment: "" };

const Floors = () => {
  const { buildingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildingName = location.state?.buildingName || "Bino";

  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState(emptyForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const getFloors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/buildings/${buildingId}/floors`);
      setFloors(res.data);
    } catch {
      toast({ title: "Xatolik", description: "Qavatlar yuklanmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFloors();
  }, [buildingId]);

  const handleAdd = async () => {
    if (!addPayload.name.trim()) {
      toast({ title: "Xatolik", description: "Qavat nomi kiritilmagan", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/buildings/${buildingId}/floors`, addPayload);
      toast({ title: "Muvaffaqiyatli", description: "Qavat qo'shildi", duration: 1500, style: { background: "green", color: "white" } });
      setAddOpen(false);
      setAddPayload(emptyForm);
      getFloors();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Qavat qo'shishda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editPayload.name.trim()) {
      toast({ title: "Xatolik", description: "Qavat nomi kiritilmagan", variant: "destructive", duration: 1500 });
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/floors/${editingId}`, editPayload);
      toast({ title: "Muvaffaqiyatli", description: "Qavat yangilandi", duration: 1500, style: { background: "green", color: "white" } });
      setEditOpen(false);
      setEditPayload(emptyForm);
      setEditingId(null);
      getFloors();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Qavat yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qavat qo'shish</DialogTitle>
            <DialogDescription>{buildingName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Qavat nomi * (masalan: 1-qavat)"
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
            <DialogTitle>Qavatni tahrirlash</DialogTitle>
            <DialogDescription>{buildingName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Qavat nomi *"
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/superhr/factory-details")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-gray-500">{buildingName}</p>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Layers className="w-6 h-6 text-primary" />
              Qavatlar
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
      ) : floors.length === 0 ? (
        <p className="text-gray-500">Qavatlar topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {floors.map((floor, idx) => (
            <motion.div
              key={floor.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl shadow-md hover:shadow-xl transition border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">{floor.name}</CardTitle>
                </CardHeader>
                {floor.comment && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{floor.comment}</p>
                  </CardContent>
                )}
                <CardContent className="pt-0 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      navigate(
                        `/superhr/factory-details/floors/${floor.id}/zones`,
                        { state: { buildingName, buildingId, floorName: floor.name } }
                      )
                    }
                  >
                    Zonalar <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setEditingId(floor.id);
                      setEditPayload({ name: floor.name || "", comment: floor.comment || "" });
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

export default Floors;
