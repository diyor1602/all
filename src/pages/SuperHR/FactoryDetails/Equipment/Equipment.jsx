import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ArrowRightLeft,
  QrCode,
} from "lucide-react";
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

const emptyForm = { name: "", serial_number: "", qr_code: "", comment: "" };

const Equipment = () => {
  const { zoneId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildingName = location.state?.buildingName || "Bino";
  const floorName = location.state?.floorName || "Qavat";
  const zoneName = location.state?.zoneName || "Zona";

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState(emptyForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferringId, setTransferringId] = useState(null);
  const [transferringName, setTransferringName] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [transferFloors, setTransferFloors] = useState([]);
  const [transferZones, setTransferZones] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");

  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const getEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/zones/${zoneId}/equipment`);
      setEquipment(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Jihozlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await api.get("/buildings");
      setBuildings(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    getEquipment();
    fetchBuildings();
  }, [zoneId]);

  const handleBuildingChange = async (buildingId) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId("");
    setSelectedZoneId("");
    setTransferZones([]);
    try {
      const res = await api.get(`/buildings/${buildingId}/floors`);
      setTransferFloors(res.data);
    } catch {
      setTransferFloors([]);
    }
  };

  const handleFloorChange = async (flId) => {
    setSelectedFloorId(flId);
    setSelectedZoneId("");
    try {
      const res = await api.get(`/floors/${flId}/zones`);
      setTransferZones(res.data);
    } catch {
      setTransferZones([]);
    }
  };

  const handleAdd = async () => {
    if (!addPayload.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Jihoz nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/zones/${zoneId}/equipment`, addPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Jihoz qo'shildi",
        duration: 1500,
        style: { background: "green", color: "white" },
      });
      setAddOpen(false);
      setAddPayload(emptyForm);
      getEquipment();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Jihoz qo'shishda xatolik",
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
        description: "Jihoz nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/equipment/${editingId}`, editPayload);
      toast({
        title: "Muvaffaqiyatli",
        description: "Jihoz yangilandi",
        duration: 1500,
        style: { background: "green", color: "white" },
      });
      setEditOpen(false);
      setEditPayload(emptyForm);
      setEditingId(null);
      getEquipment();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Jihoz yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedZoneId) {
      toast({
        title: "Xatolik",
        description: "Zona tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/equipment/${transferringId}/transfer`, {
        to_zone_id: selectedZoneId,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Jihoz ko'chirildi",
        duration: 1500,
        style: { background: "green", color: "white" },
      });
      setTransferOpen(false);
      setSelectedBuildingId("");
      setSelectedFloorId("");
      setSelectedZoneId("");
      getEquipment();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error?.response?.data?.message || "Ko'chirishda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQrSearch = async () => {
    if (!qrCode.trim()) return;
    setQrLoading(true);
    setQrResult(null);
    try {
      const res = await api.get(`/equipment/qr/${qrCode.trim()}`);
      setQrResult(res.data);
    } catch {
      toast({
        title: "Topilmadi",
        description: "Bu QR kodli jihoz topilmadi",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jihoz qo'shish</DialogTitle>
            <DialogDescription>
              {buildingName} › {floorName} › {zoneName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Jihoz nomi *"
              value={addPayload.name}
              onChange={(e) =>
                setAddPayload({ ...addPayload, name: e.target.value })
              }
            />
            <Input
              placeholder="Seriya raqami"
              value={addPayload.serial_number}
              onChange={(e) =>
                setAddPayload({ ...addPayload, serial_number: e.target.value })
              }
            />
            <Input
              placeholder="QR kod"
              value={addPayload.qr_code}
              onChange={(e) =>
                setAddPayload({ ...addPayload, qr_code: e.target.value })
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
            <DialogTitle>Jihozni tahrirlash</DialogTitle>
            <DialogDescription>
              {buildingName} › {floorName} › {zoneName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Jihoz nomi *"
              value={editPayload.name}
              onChange={(e) =>
                setEditPayload({ ...editPayload, name: e.target.value })
              }
            />
            <Input
              placeholder="Seriya raqami"
              value={editPayload.serial_number}
              onChange={(e) =>
                setEditPayload({
                  ...editPayload,
                  serial_number: e.target.value,
                })
              }
            />
            <Input
              placeholder="QR kod"
              value={editPayload.qr_code}
              onChange={(e) =>
                setEditPayload({ ...editPayload, qr_code: e.target.value })
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

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Ko'chirish
            </DialogTitle>
            <DialogDescription>{transferringName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={selectedBuildingId}
              onValueChange={handleBuildingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bino tanlang" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedFloorId}
              onValueChange={handleFloorChange}
              disabled={!selectedBuildingId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qavat tanlang" />
              </SelectTrigger>
              <SelectContent>
                {transferFloors.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedZoneId}
              onValueChange={setSelectedZoneId}
              disabled={!selectedFloorId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Zona tanlang" />
              </SelectTrigger>
              <SelectContent>
                {transferZones.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setTransferOpen(false);
                setSelectedBuildingId("");
                setSelectedFloorId("");
                setSelectedZoneId("");
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={submitting || !selectedZoneId}
            >
              {submitting ? "Ko'chirilmoqda..." : "Ko'chirish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Search Dialog */}
      <Dialog
        open={qrOpen}
        onOpenChange={(o) => {
          setQrOpen(o);
          if (!o) {
            setQrCode("");
            setQrResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" /> QR kod orqali qidirish
            </DialogTitle>
            <DialogDescription>QR kodni kiriting</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="QR kod"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQrSearch()}
            />
            <Button onClick={handleQrSearch} disabled={qrLoading}>
              {qrLoading ? "..." : "Qidirish"}
            </Button>
          </div>
          {qrResult && (
            <div className="mt-3 rounded-lg border p-4 space-y-1 text-sm">
              <p>
                <span className="font-medium">Nomi:</span> {qrResult.name}
              </p>
              {qrResult.serial_number && (
                <p>
                  <span className="font-medium">Seriya:</span>{" "}
                  {qrResult.serial_number}
                </p>
              )}
              {qrResult.comment && (
                <p>
                  <span className="font-medium">Izoh:</span> {qrResult.comment}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-gray-500">
              {buildingName} › {floorName} › {zoneName}
            </p>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Wrench className="w-6 h-6 text-primary" />
              Jihozlar
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setQrOpen(true)}>
            <QrCode className="w-4 h-4" />
          </Button>
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
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : equipment.length === 0 ? (
        <p className="text-gray-500">Jihozlar topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl shadow-md hover:shadow-xl transition border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">
                    {item.name}
                  </CardTitle>
                  {item.serial_number && (
                    <p className="text-xs text-gray-500">
                      S/N: {item.serial_number}
                    </p>
                  )}
                </CardHeader>
                {item.comment && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.comment}
                    </p>
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
                          `/superhr/factory-details/equipment/${item.id}/maintenance`,
                          {
                            state: {
                              buildingName,
                              floorName,
                              zoneName,
                              equipmentName: item.name,
                            },
                          },
                        )
                      }
                    >
                      Ta'mirlash <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setTransferringId(item.id);
                        setTransferringName(item.name);
                        setSelectedBuildingId("");
                        setSelectedFloorId("");
                        setSelectedZoneId("");
                        setTransferFloors([]);
                        setTransferZones([]);
                        setTransferOpen(true);
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditPayload({
                        name: item.name || "",
                        serial_number: item.serial_number || "",
                        qr_code: item.qr_code || "",
                        comment: item.comment || "",
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

export default Equipment;
