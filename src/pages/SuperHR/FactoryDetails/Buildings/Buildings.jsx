import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const emptyForm = { name: "", address: "", comment: "" };

const Buildings = () => {
  const { toast } = useToast();

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState(emptyForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const getBuildings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buildings");
      setBuildings(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Binolar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBuildings();
  }, []);

  const handleAdd = async () => {
    if (!addPayload.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Bino nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/buildings", addPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Bino qo'shildi",
        duration: 1500,
        style: { background: "green", color: "white" },
      });
      setAddOpen(false);
      setAddPayload(emptyForm);
      getBuildings();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Bino qo'shishda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editPayload.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Bino nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/buildings/${editingId}`, editPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Bino yangilandi",
        duration: 1500,
        style: { background: "green", color: "white" },
      });
      setEditOpen(false);
      setEditPayload(emptyForm);
      setEditingId(null);
      getBuildings();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Bino yangilashda xatolik",
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
            <DialogTitle>Bino qo'shish</DialogTitle>
            <DialogDescription>
              Yangi bino ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Bino nomi *"
              value={addPayload.name}
              onChange={(e) =>
                setAddPayload({ ...addPayload, name: e.target.value })
              }
            />
            <Input
              placeholder="Manzil"
              value={addPayload.address}
              onChange={(e) =>
                setAddPayload({ ...addPayload, address: e.target.value })
              }
            />
            <Textarea
              placeholder="Izoh"
              rows={3}
              value={addPayload.comment}
              onChange={(e) =>
                setAddPayload({ ...addPayload, comment: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setAddPayload(emptyForm);
              }}
            >
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
            <DialogTitle>Binoni tahrirlash</DialogTitle>
            <DialogDescription>
              Bino ma'lumotlarini o'zgartiring
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Bino nomi *"
              value={editPayload.name}
              onChange={(e) =>
                setEditPayload({ ...editPayload, name: e.target.value })
              }
            />
            <Input
              placeholder="Manzil"
              value={editPayload.address}
              onChange={(e) =>
                setEditPayload({ ...editPayload, address: e.target.value })
              }
            />
            <Textarea
              placeholder="Izoh"
              rows={3}
              value={editPayload.comment}
              onChange={(e) =>
                setEditPayload({ ...editPayload, comment: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditPayload(emptyForm);
                setEditingId(null);
              }}
            >
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
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Building2 className="w-6 h-6 text-primary" />
          Binolar
        </h1>
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600"
          onClick={() => {
            setAddPayload(emptyForm);
            setAddOpen(true);
          }}
        >
          <Plus />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : buildings.length === 0 ? (
        <p className="text-gray-500">Binolar topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building, idx) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl shadow-md hover:shadow-xl transition border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">
                    {building.name}
                  </CardTitle>
                  {building.address && (
                    <p className="text-sm text-gray-500 truncate">
                      {building.address}
                    </p>
                  )}
                </CardHeader>
                {building.comment && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {building.comment}
                    </p>
                  </CardContent>
                )}
                <CardContent className="pt-0 flex justify-end">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setEditingId(building.id);
                      setEditPayload({
                        name: building.name || "",
                        address: building.address || "",
                        comment: building.comment || "",
                      });
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

export default Buildings;
