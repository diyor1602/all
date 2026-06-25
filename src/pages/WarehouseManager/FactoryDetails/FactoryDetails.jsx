import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Layers,
  MapPin,
  Wrench,
  Plus,
  Pencil,
  ChevronRight,
  Users,
  UserPlus,
  ArrowRightLeft,
  QrCode,
  ClipboardList,
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

const MAINTENANCE_TYPES = ["Texnik xizmat", "Remont", "Tekshiruv", "Boshqa"];
const emptyBuilding = { name: "", address: "", comment: "" };
const emptyFloor = { name: "", comment: "" };
const emptyZone = { name: "", comment: "" };
const emptyEquip = { name: "", serial_number: "", qr_code: "", price: "", comment: "" };
const emptyMaintenance = {
  date: "",
  type: "",
  description: "",
  next_maintenance_date: "",
};

const TextForm = ({ fields, form, setForm }) => (
  <div className="flex flex-col gap-3">
    {fields.map(({ key, placeholder, textarea, type }) =>
      textarea ? (
        <Textarea
          key={key}
          placeholder={placeholder}
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <Input
          key={key}
          type={type || "text"}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ),
    )}
  </div>
);

const DialogFooter = ({
  onCancel,
  onSubmit,
  submitting,
  cancelLabel = "Bekor qilish",
  submitLabel = "Saqlash",
}) => (
  <div className="flex justify-end gap-2 mt-2">
    <Button variant="outline" onClick={onCancel}>
      {cancelLabel}
    </Button>
    <Button onClick={onSubmit} disabled={submitting}>
      {submitting ? "Saqlanmoqda..." : submitLabel}
    </Button>
  </div>
);

const FactoryDetails = () => {
  const { toast } = useToast();

  // Data
  const [buildings, setBuildings] = useState([]);
  const [equipment, setEquipment] = useState([]);

  // Employee search for responsible assignment
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);

  // Expansion (multiple can be open at once)
  const [expandedBuildings, setExpandedBuildings] = useState(new Set());
  const [expandedFloors, setExpandedFloors] = useState(new Set());

  // Data maps keyed by parent ID
  const [floorsMap, setFloorsMap] = useState({});
  const [zonesMap, setZonesMap] = useState({});

  // Active zone selection (single)
  const [activeZone, setActiveZone] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(null); // { building, floor }

  // Context for dialogs (which building/floor owns the current add/edit)
  const [ctxBuildingId, setCtxBuildingId] = useState(null);
  const [ctxFloorId, setCtxFloorId] = useState(null);

  // Loading
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloorIds, setLoadingFloorIds] = useState(new Set());
  const [loadingZoneIds, setLoadingZoneIds] = useState(new Set());
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cache = useRef({ floors: {}, zones: {}, equipment: {} });

  // Building dialogs
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [editBuildingOpen, setEditBuildingOpen] = useState(false);
  const [buildingForm, setBuildingForm] = useState(emptyBuilding);
  const [editingBuildingId, setEditingBuildingId] = useState(null);

  // Floor dialogs
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [editFloorOpen, setEditFloorOpen] = useState(false);
  const [floorForm, setFloorForm] = useState(emptyFloor);
  const [editingFloorId, setEditingFloorId] = useState(null);

  // Zone dialogs
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editZoneOpen, setEditZoneOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [editingZoneId, setEditingZoneId] = useState(null);

  // Responsibles
  const [responsiblesOpen, setResponsiblesOpen] = useState(false);
  const [responsiblesZone, setResponsiblesZone] = useState(null);
  const [responsibles, setResponsibles] = useState([]);
  const [loadingResponsibles, setLoadingResponsibles] = useState(false);
  const [assigningId, setAssigningId] = useState("");

  // Equipment dialogs
  const [addEquipOpen, setAddEquipOpen] = useState(false);
  const [editEquipOpen, setEditEquipOpen] = useState(false);
  const [equipForm, setEquipForm] = useState(emptyEquip);
  const [editingEquipId, setEditingEquipId] = useState(null);

  // Transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEquip, setTransferEquip] = useState(null);
  const [transferFloors, setTransferFloors] = useState([]);
  const [transferZones, setTransferZones] = useState([]);
  const [transferBuildingId, setTransferBuildingId] = useState("");
  const [transferFloorId, setTransferFloorId] = useState("");
  const [transferZoneId, setTransferZoneId] = useState("");

  // QR
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Maintenance
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceEquip, setMaintenanceEquip] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [maintenanceView, setMaintenanceView] = useState("list");
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
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
      setLoadingBuildings(false);
    }
  };

  const fetchFloors = async (buildingId) => {
    setLoadingFloorIds((prev) => new Set([...prev, buildingId]));
    try {
      const res = await api.get(`/buildings/${buildingId}/floors`);
      cache.current.floors[buildingId] = res.data;
      setFloorsMap((prev) => ({ ...prev, [buildingId]: res.data }));
    } catch {
      toast({
        title: "Xatolik",
        description: "Qavatlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingFloorIds((prev) => {
        const n = new Set(prev);
        n.delete(buildingId);
        return n;
      });
    }
  };

  const fetchZones = async (floorId) => {
    setLoadingZoneIds((prev) => new Set([...prev, floorId]));
    try {
      const res = await api.get(`/floors/${floorId}/zones`);
      cache.current.zones[floorId] = res.data;
      setZonesMap((prev) => ({ ...prev, [floorId]: res.data }));
    } catch {
      toast({
        title: "Xatolik",
        description: "Zonalar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingZoneIds((prev) => {
        const n = new Set(prev);
        n.delete(floorId);
        return n;
      });
    }
  };

  const fetchEquipment = async (zoneId) => {
    setLoadingEquipment(true);
    try {
      const res = await api.get(`/zones/${zoneId}/equipment`);
      cache.current.equipment[zoneId] = res.data;
      setEquipment(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Jihozlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingEquipment(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (!employeeSearch.trim()) {
      setEmployeeSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setEmployeeSearchLoading(true);
      try {
        const res = await api.get(
          `/superhr/employees?search=${encodeURIComponent(employeeSearch)}&per_page=20`,
        );
        setEmployeeSearchResults(res.data?.data || res.data || []);
      } catch {
        setEmployeeSearchResults([]);
      } finally {
        setEmployeeSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleBuilding = (b) => {
    const next = new Set(expandedBuildings);
    if (next.has(b.id)) {
      next.delete(b.id);
    } else {
      next.add(b.id);
      if (!cache.current.floors[b.id]) fetchFloors(b.id);
      else
        setFloorsMap((prev) => ({
          ...prev,
          [b.id]: cache.current.floors[b.id],
        }));
    }
    setExpandedBuildings(next);
  };

  const toggleFloor = (f) => {
    const next = new Set(expandedFloors);
    if (next.has(f.id)) {
      next.delete(f.id);
    } else {
      next.add(f.id);
      if (!cache.current.zones[f.id]) fetchZones(f.id);
      else
        setZonesMap((prev) => ({ ...prev, [f.id]: cache.current.zones[f.id] }));
    }
    setExpandedFloors(next);
  };

  const selectZone = (z, building, floor) => {
    setActiveZone(z);
    setBreadcrumb({ building, floor });
    const cached = cache.current.equipment[z.id];
    if (cached) {
      setEquipment(cached);
    } else {
      fetchEquipment(z.id);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const ok = (msg) =>
    toast({
      title: "Muvaffaqiyatli",
      description: msg,
      duration: 1500,
      style: { background: "green", color: "white" },
    });
  const err = (e, fallback) =>
    toast({
      title: "Xatolik",
      description: e?.response?.data?.message || fallback,
      variant: "destructive",
      duration: 1500,
    });

  // ── Building handlers ──────────────────────────────────────────────────────

  const handleAddBuilding = async () => {
    if (!buildingForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Bino nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post("/buildings", buildingForm);
      ok("Bino qo'shildi");
      setAddBuildingOpen(false);
      setBuildingForm(emptyBuilding);
      fetchBuildings();
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBuilding = async () => {
    if (!buildingForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Bino nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.patch(`/buildings/${editingBuildingId}`, buildingForm);
      ok("Bino yangilandi");
      setEditBuildingOpen(false);
      setBuildingForm(emptyBuilding);
      fetchBuildings();
      if (breadcrumb?.building?.id === editingBuildingId)
        setBreadcrumb((p) => ({
          ...p,
          building: { ...p.building, name: buildingForm.name },
        }));
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Floor handlers ─────────────────────────────────────────────────────────

  const handleAddFloor = async () => {
    if (!floorForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Qavat nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(`/buildings/${ctxBuildingId}/floors`, floorForm);
      ok("Qavat qo'shildi");
      setAddFloorOpen(false);
      setFloorForm(emptyFloor);
      delete cache.current.floors[ctxBuildingId];
      fetchFloors(ctxBuildingId);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFloor = async () => {
    if (!floorForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Qavat nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.patch(`/floors/${editingFloorId}`, floorForm);
      ok("Qavat yangilandi");
      setEditFloorOpen(false);
      setFloorForm(emptyFloor);
      delete cache.current.floors[ctxBuildingId];
      fetchFloors(ctxBuildingId);
      if (breadcrumb?.floor?.id === editingFloorId)
        setBreadcrumb((p) => ({
          ...p,
          floor: { ...p.floor, name: floorForm.name },
        }));
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Zone handlers ──────────────────────────────────────────────────────────

  const handleAddZone = async () => {
    if (!zoneForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Zona nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(`/floors/${ctxFloorId}/zones`, zoneForm);
      ok("Zona qo'shildi");
      setAddZoneOpen(false);
      setZoneForm(emptyZone);
      delete cache.current.zones[ctxFloorId];
      fetchZones(ctxFloorId);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditZone = async () => {
    if (!zoneForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Zona nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.patch(`/zones/${editingZoneId}`, zoneForm);
      ok("Zona yangilandi");
      setEditZoneOpen(false);
      setZoneForm(emptyZone);
      delete cache.current.zones[ctxFloorId];
      fetchZones(ctxFloorId);
      if (activeZone?.id === editingZoneId)
        setActiveZone((p) => ({ ...p, name: zoneForm.name }));
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Responsibles ───────────────────────────────────────────────────────────

  const openResponsibles = async (zone) => {
    setResponsiblesZone(zone);
    setResponsiblesOpen(true);
    setAssigningId("");
    setEmployeeSearch("");
    setEmployeeSearchResults([]);
    setLoadingResponsibles(true);
    try {
      const res = await api.get(`/zones/${zone.id}/responsibles`);
      setResponsibles(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Mas'ullar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingResponsibles(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningId)
      return toast({
        title: "Xatolik",
        description: "Xodim tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(`/zones/${responsiblesZone.id}/responsibles`, {
        employee_id: assigningId,
      });
      ok("Mas'ul tayinlandi");
      setAssigningId("");
      const res = await api.get(`/zones/${responsiblesZone.id}/responsibles`);
      setResponsibles(res.data);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Equipment handlers ─────────────────────────────────────────────────────

  const handleAddEquip = async () => {
    if (!equipForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Jihoz nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(`/zones/${activeZone.id}/equipment`, {
        ...equipForm,
        price: equipForm.price !== "" ? parseFloat(equipForm.price) : null,
      });
      ok("Jihoz qo'shildi");
      setAddEquipOpen(false);
      setEquipForm(emptyEquip);
      delete cache.current.equipment[activeZone.id];
      fetchEquipment(activeZone.id);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEquip = async () => {
    if (!equipForm.name.trim())
      return toast({
        title: "Xatolik",
        description: "Jihoz nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.patch(`/equipment/${editingEquipId}`, {
        ...equipForm,
        price: equipForm.price !== "" ? parseFloat(equipForm.price) : null,
      });
      ok("Jihoz yangilandi");
      setEditEquipOpen(false);
      setEquipForm(emptyEquip);
      delete cache.current.equipment[activeZone.id];
      fetchEquipment(activeZone.id);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Transfer ───────────────────────────────────────────────────────────────

  const openTransfer = (item) => {
    setTransferEquip(item);
    setTransferBuildingId("");
    setTransferFloorId("");
    setTransferZoneId("");
    setTransferFloors([]);
    setTransferZones([]);
    setTransferOpen(true);
  };

  const onTransferBuilding = async (bId) => {
    setTransferBuildingId(bId);
    setTransferFloorId("");
    setTransferZoneId("");
    setTransferZones([]);
    try {
      const r = await api.get(`/buildings/${bId}/floors`);
      setTransferFloors(r.data);
    } catch {
      setTransferFloors([]);
    }
  };

  const onTransferFloor = async (fId) => {
    setTransferFloorId(fId);
    setTransferZoneId("");
    try {
      const r = await api.get(`/floors/${fId}/zones`);
      setTransferZones(r.data);
    } catch {
      setTransferZones([]);
    }
  };

  const handleTransfer = async () => {
    if (!transferZoneId)
      return toast({
        title: "Xatolik",
        description: "Zona tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(`/equipment/${transferEquip.id}/transfer`, {
        to_zone_id: Number(transferZoneId),
      });
      ok("Jihoz ko'chirildi");
      setTransferOpen(false);
      delete cache.current.equipment[activeZone.id];
      fetchEquipment(activeZone.id);
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── QR ─────────────────────────────────────────────────────────────────────

  const handleQr = async () => {
    if (!qrCode.trim()) return;
    setQrLoading(true);
    setQrResult(null);
    try {
      const r = await api.get(`/equipment/qr/${qrCode.trim()}`);
      setQrResult(r.data);
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

  // ── Maintenance ────────────────────────────────────────────────────────────

  const openMaintenance = async (item) => {
    setMaintenanceEquip(item);
    setMaintenanceView("list");
    setMaintenanceOpen(true);
    setLoadingMaintenance(true);
    try {
      const r = await api.get(`/equipment/${item.id}/maintenance`);
      setMaintenanceRecords(r.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ta'mirlash tarixi yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const refetchMaintenance = async () => {
    try {
      const r = await api.get(`/equipment/${maintenanceEquip.id}/maintenance`);
      setMaintenanceRecords(r.data);
    } catch (_) {
      /* silent */
    }
  };

  const handleAddMaintenance = async () => {
    if (!maintenanceForm.date || !maintenanceForm.type)
      return toast({
        title: "Xatolik",
        description: "Sana va tur shart",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.post(
        `/equipment/${maintenanceEquip.id}/maintenance`,
        maintenanceForm,
      );
      ok("Yozuv qo'shildi");
      setMaintenanceForm(emptyMaintenance);
      setMaintenanceView("list");
      refetchMaintenance();
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMaintenance = async () => {
    if (!maintenanceForm.date || !maintenanceForm.type)
      return toast({
        title: "Xatolik",
        description: "Sana va tur shart",
        variant: "destructive",
        duration: 1500,
      });
    try {
      setSubmitting(true);
      await api.patch(`/maintenance/${editingMaintenanceId}`, maintenanceForm);
      ok("Yozuv yangilandi");
      setMaintenanceForm(emptyMaintenance);
      setMaintenanceView("list");
      refetchMaintenance();
    } catch (e) {
      err(e, "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* ── ALL DIALOGS ─────────────────────────────────────────────────── */}

      {/* Add Building */}
      <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bino qo'shish</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <TextForm
            form={buildingForm}
            setForm={setBuildingForm}
            fields={[
              { key: "name", placeholder: "Bino nomi *" },
              { key: "address", placeholder: "Manzil" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setAddBuildingOpen(false);
              setBuildingForm(emptyBuilding);
            }}
            onSubmit={handleAddBuilding}
            submitting={submitting}
            submitLabel="Qo'shish"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Building */}
      <Dialog open={editBuildingOpen} onOpenChange={setEditBuildingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Binoni tahrirlash</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <TextForm
            form={buildingForm}
            setForm={setBuildingForm}
            fields={[
              { key: "name", placeholder: "Bino nomi *" },
              { key: "address", placeholder: "Manzil" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setEditBuildingOpen(false);
              setBuildingForm(emptyBuilding);
            }}
            onSubmit={handleEditBuilding}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Add Floor */}
      <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qavat qo'shish</DialogTitle>
            <DialogDescription>
              {buildings.find((b) => b.id === ctxBuildingId)?.name}
            </DialogDescription>
          </DialogHeader>
          <TextForm
            form={floorForm}
            setForm={setFloorForm}
            fields={[
              { key: "name", placeholder: "Qavat nomi * (masalan: 1-qavat)" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setAddFloorOpen(false);
              setFloorForm(emptyFloor);
            }}
            onSubmit={handleAddFloor}
            submitting={submitting}
            submitLabel="Qo'shish"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Floor */}
      <Dialog open={editFloorOpen} onOpenChange={setEditFloorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qavatni tahrirlash</DialogTitle>
            <DialogDescription>
              {buildings.find((b) => b.id === ctxBuildingId)?.name}
            </DialogDescription>
          </DialogHeader>
          <TextForm
            form={floorForm}
            setForm={setFloorForm}
            fields={[
              { key: "name", placeholder: "Qavat nomi *" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setEditFloorOpen(false);
              setFloorForm(emptyFloor);
            }}
            onSubmit={handleEditFloor}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Add Zone */}
      <Dialog open={addZoneOpen} onOpenChange={setAddZoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zona qo'shish</DialogTitle>
            <DialogDescription>
              {buildings.find((b) => b.id === ctxBuildingId)?.name} ›{" "}
              {
                (floorsMap[ctxBuildingId] || []).find(
                  (f) => f.id === ctxFloorId,
                )?.name
              }
            </DialogDescription>
          </DialogHeader>
          <TextForm
            form={zoneForm}
            setForm={setZoneForm}
            fields={[
              { key: "name", placeholder: "Zona nomi *" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setAddZoneOpen(false);
              setZoneForm(emptyZone);
            }}
            onSubmit={handleAddZone}
            submitting={submitting}
            submitLabel="Qo'shish"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Zone */}
      <Dialog open={editZoneOpen} onOpenChange={setEditZoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zonani tahrirlash</DialogTitle>
            <DialogDescription>
              {buildings.find((b) => b.id === ctxBuildingId)?.name} ›{" "}
              {
                (floorsMap[ctxBuildingId] || []).find(
                  (f) => f.id === ctxFloorId,
                )?.name
              }
            </DialogDescription>
          </DialogHeader>
          <TextForm
            form={zoneForm}
            setForm={setZoneForm}
            fields={[
              { key: "name", placeholder: "Zona nomi *" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setEditZoneOpen(false);
              setZoneForm(emptyZone);
            }}
            onSubmit={handleEditZone}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Responsibles */}
      <Dialog open={responsiblesOpen} onOpenChange={setResponsiblesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {responsiblesZone?.name} — Mas'ullar
            </DialogTitle>
            <DialogDescription>
              {breadcrumb?.building?.name} › {breadcrumb?.floor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Xodim ismi yoki username..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setAssigningId("");
                }}
                onBlur={() =>
                  setTimeout(() => setEmployeeSearchResults([]), 150)
                }
              />
              {(employeeSearchLoading || employeeSearchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto mt-0.5">
                  {employeeSearchLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-400">
                      Qidirilmoqda...
                    </p>
                  ) : (
                    employeeSearchResults.map((e) => (
                      <button
                        key={e.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex flex-col"
                        onMouseDown={() => {
                          setAssigningId(String(e.id));
                          setEmployeeSearch(
                            `${e.name}${e.last_name ? " " + e.last_name : ""}`,
                          );
                          setEmployeeSearchResults([]);
                        }}
                      >
                        <span className="font-medium">
                          {e.name} {e.last_name || ""}
                        </span>
                        <span className="text-xs text-gray-400">
                          {e.user?.username || ""} · {e.department?.name || ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              size="icon"
              className="bg-green-500 hover:bg-green-600"
              onClick={handleAssign}
              disabled={submitting || !assigningId}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {loadingResponsibles ? (
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            ) : responsibles.length === 0 ? (
              <p className="text-sm text-gray-500">Mas'ullar yo'q</p>
            ) : (
              responsibles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {r.employee?.name || r.name || "—"}
                    </span>
                    {r.employee?.phone && (
                      <span className="text-xs text-gray-400">
                        {r.employee.phone}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Equipment */}
      <Dialog open={addEquipOpen} onOpenChange={setAddEquipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jihoz qo'shish</DialogTitle>
            <DialogDescription>
              {breadcrumb?.building?.name} › {breadcrumb?.floor?.name} ›{" "}
              {activeZone?.name}
            </DialogDescription>
          </DialogHeader>
          <TextForm
            form={equipForm}
            setForm={setEquipForm}
            fields={[
              { key: "name", placeholder: "Jihoz nomi *" },
              { key: "serial_number", placeholder: "Seriya raqami" },
              { key: "qr_code", placeholder: "QR kod" },
              { key: "price", placeholder: "Narxi (so'm)", type: "number" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setAddEquipOpen(false);
              setEquipForm(emptyEquip);
            }}
            onSubmit={handleAddEquip}
            submitting={submitting}
            submitLabel="Qo'shish"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Equipment */}
      <Dialog open={editEquipOpen} onOpenChange={setEditEquipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jihozni tahrirlash</DialogTitle>
            <DialogDescription>{activeZone?.name}</DialogDescription>
          </DialogHeader>
          <TextForm
            form={equipForm}
            setForm={setEquipForm}
            fields={[
              { key: "name", placeholder: "Jihoz nomi *" },
              { key: "serial_number", placeholder: "Seriya raqami" },
              { key: "qr_code", placeholder: "QR kod" },
              { key: "price", placeholder: "Narxi (so'm)", type: "number" },
              { key: "comment", placeholder: "Izoh", textarea: true },
            ]}
          />
          <DialogFooter
            onCancel={() => {
              setEditEquipOpen(false);
              setEquipForm(emptyEquip);
            }}
            onSubmit={handleEditEquip}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Ko'chirish
            </DialogTitle>
            <DialogDescription>{transferEquip?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={transferBuildingId}
              onValueChange={onTransferBuilding}
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
              value={transferFloorId}
              onValueChange={onTransferFloor}
              disabled={!transferBuildingId}
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
              value={transferZoneId}
              onValueChange={setTransferZoneId}
              disabled={!transferFloorId}
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
          <DialogFooter
            onCancel={() => setTransferOpen(false)}
            onSubmit={handleTransfer}
            submitting={submitting}
            submitLabel="Ko'chirish"
          />
        </DialogContent>
      </Dialog>

      {/* QR Search */}
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
              <QrCode className="w-4 h-4" />
              QR kod qidirish
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="QR kod"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQr()}
            />
            <Button onClick={handleQr} disabled={qrLoading}>
              {qrLoading ? "..." : "Qidirish"}
            </Button>
          </div>
          {qrResult && (
            <div className="rounded-lg border p-4 space-y-1 text-sm mt-1">
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

      {/* Maintenance */}
      <Dialog
        open={maintenanceOpen}
        onOpenChange={(o) => {
          setMaintenanceOpen(o);
          if (!o) setMaintenanceView("list");
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              {maintenanceEquip?.name} — Ta'mirlash
            </DialogTitle>
            <DialogDescription>
              {breadcrumb?.building?.name} › {breadcrumb?.floor?.name} ›{" "}
              {activeZone?.name}
            </DialogDescription>
          </DialogHeader>

          {maintenanceView === "list" && (
            <>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 gap-1"
                  onClick={() => {
                    setMaintenanceForm(emptyMaintenance);
                    setMaintenanceView("add");
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Yangi yozuv
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingMaintenance ? (
                  <p className="text-sm text-gray-500">Yuklanmoqda...</p>
                ) : maintenanceRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">Yozuvlar topilmadi</p>
                ) : (
                  maintenanceRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start justify-between rounded-lg border p-3 gap-3"
                    >
                      <div className="space-y-0.5 flex-1">
                        <p className="text-sm font-medium">
                          {rec.type}{" "}
                          <span className="text-gray-400 font-normal">
                            — {rec.date}
                          </span>
                        </p>
                        {rec.description && (
                          <p className="text-xs text-gray-600">
                            {rec.description}
                          </p>
                        )}
                        {rec.next_maintenance_date && (
                          <p className="text-xs text-blue-600">
                            Keyingi: {rec.next_maintenance_date}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => {
                          setEditingMaintenanceId(rec.id);
                          setMaintenanceForm({
                            date: rec.date || "",
                            type: rec.type || "",
                            description: rec.description || "",
                            next_maintenance_date:
                              rec.next_maintenance_date || "",
                          });
                          setMaintenanceView("edit");
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {(maintenanceView === "add" || maintenanceView === "edit") && (
            <>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Sana *
                    </label>
                    <Input
                      type="date"
                      value={maintenanceForm.date}
                      onChange={(e) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Keyingi sana
                    </label>
                    <Input
                      type="date"
                      value={maintenanceForm.next_maintenance_date}
                      onChange={(e) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          next_maintenance_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Select
                  value={maintenanceForm.type}
                  onValueChange={(v) =>
                    setMaintenanceForm({ ...maintenanceForm, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tur tanlang *" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Tavsif"
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  onClick={() => setMaintenanceView("list")}
                >
                  ← Orqaga
                </Button>
                <Button
                  onClick={
                    maintenanceView === "add"
                      ? handleAddMaintenance
                      : handleEditMaintenance
                  }
                  disabled={submitting}
                >
                  {submitting
                    ? "Saqlanmoqda..."
                    : maintenanceView === "add"
                      ? "Qo'shish"
                      : "Saqlash"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}

      <aside className="w-full md:w-72 border-r md:min-h-[calc(100vh-10rem)] flex-shrink-0 bg-white overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Binolar
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setBuildingForm(emptyBuilding);
              setAddBuildingOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-2 space-y-0.5">
          {loadingBuildings ? (
            <p className="text-sm text-gray-500 px-3 py-2">Yuklanmoqda...</p>
          ) : buildings.length === 0 ? (
            <p className="text-sm text-gray-500 px-3 py-2">Binolar topilmadi</p>
          ) : (
            buildings.map((b) => (
              <div key={b.id}>
                {/* Building row */}
                <div className="group flex items-center gap-0.5">
                  <button
                    className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                      expandedBuildings.has(b.id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => toggleBuilding(b)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${expandedBuildings.has(b.id) ? "rotate-90" : ""}`}
                    />
                    <span className="truncate">{b.name}</span>
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                    onClick={() => {
                      setEditingBuildingId(b.id);
                      setBuildingForm({
                        name: b.name,
                        address: b.address || "",
                        comment: b.comment || "",
                      });
                      setEditBuildingOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Floors */}
                {expandedBuildings.has(b.id) && (
                  <div className="ml-3 mt-0.5 border-l pl-2 space-y-0.5">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Qavatlar
                      </span>
                      <button
                        className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                        onClick={() => {
                          setCtxBuildingId(b.id);
                          setFloorForm(emptyFloor);
                          setAddFloorOpen(true);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {loadingFloorIds.has(b.id) ? (
                      <p className="text-xs text-gray-400 px-2 py-1">
                        Yuklanmoqda...
                      </p>
                    ) : (floorsMap[b.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-400 px-2 py-1">
                        Qavatlar yo'q
                      </p>
                    ) : (
                      (floorsMap[b.id] || []).map((f) => (
                        <div key={f.id}>
                          <div className="group flex items-center gap-0.5">
                            <button
                              className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                                expandedFloors.has(f.id)
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-gray-100 text-gray-600"
                              }`}
                              onClick={() => toggleFloor(f)}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${expandedFloors.has(f.id) ? "rotate-90" : ""}`}
                              />
                              <span className="truncate">{f.name}</span>
                            </button>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                              onClick={() => {
                                setCtxBuildingId(b.id);
                                setEditingFloorId(f.id);
                                setFloorForm({
                                  name: f.name,
                                  comment: f.comment || "",
                                });
                                setEditFloorOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Zones */}
                          {expandedFloors.has(f.id) && (
                            <div className="ml-3 mt-0.5 border-l pl-2 space-y-0.5">
                              <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> Zonalar
                                </span>
                                <button
                                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                                  onClick={() => {
                                    setCtxBuildingId(b.id);
                                    setCtxFloorId(f.id);
                                    setZoneForm(emptyZone);
                                    setAddZoneOpen(true);
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {loadingZoneIds.has(f.id) ? (
                                <p className="text-xs text-gray-400 px-2 py-1">
                                  Yuklanmoqda...
                                </p>
                              ) : (zonesMap[f.id] || []).length === 0 ? (
                                <p className="text-xs text-gray-400 px-2 py-1">
                                  Zonalar yo'q
                                </p>
                              ) : (
                                (zonesMap[f.id] || []).map((z) => (
                                  <div
                                    key={z.id}
                                    className="group flex items-center gap-0.5"
                                  >
                                    <button
                                      className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                                        activeZone?.id === z.id
                                          ? "bg-blue-500 text-white"
                                          : "hover:bg-gray-100 text-gray-600"
                                      }`}
                                      onClick={() => selectZone(z, b, f)}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeZone?.id === z.id ? "bg-white" : "bg-gray-400"}`}
                                      />
                                      <span className="truncate">{z.name}</span>
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center">
                                      <button
                                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                                        title="Mas'ullar"
                                        onClick={() => openResponsibles(z)}
                                      >
                                        <Users className="w-3 h-3" />
                                      </button>
                                      <button
                                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                                        onClick={() => {
                                          setCtxBuildingId(b.id);
                                          setCtxFloorId(f.id);
                                          setEditingZoneId(z.id);
                                          setZoneForm({
                                            name: z.name,
                                            comment: z.comment || "",
                                          });
                                          setEditZoneOpen(true);
                                        }}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}

      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {!activeZone ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 mt-16">
            <Building2 className="w-16 h-16 opacity-20" />
            <div className="text-center">
              <p className="text-base font-medium text-gray-500">
                Zona tanlanmagan
              </p>
              <p className="text-sm text-gray-400">
                Chap paneldan bino → qavat → zonani tanlang
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">
                  {breadcrumb?.building?.name} › {breadcrumb?.floor?.name}
                </p>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {activeZone.name}
                </h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQrOpen(true)}
                  title="QR qidirish"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 gap-1"
                  onClick={() => {
                    setEquipForm(emptyEquip);
                    setAddEquipOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Jihoz
                </Button>
              </div>
            </div>

            {loadingEquipment ? (
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            ) : equipment.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Wrench className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p className="text-sm">Jihozlar topilmadi</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {equipment.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="rounded-xl shadow-sm hover:shadow-md transition border bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold truncate">
                          {item.name}
                        </CardTitle>
                        {item.serial_number && (
                          <p className="text-xs text-gray-400">
                            S/N: {item.serial_number}
                          </p>
                        )}
                        {item.price != null && item.price !== "" && (
                          <p className="text-xs font-semibold text-green-600">
                            {Number(item.price).toLocaleString("uz-UZ")} UZS
                          </p>
                        )}
                      </CardHeader>
                      {item.comment && (
                        <CardContent className="pt-0 pb-2">
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {item.comment}
                          </p>
                        </CardContent>
                      )}
                      <CardContent className="pt-0 flex gap-1.5 justify-end">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          title="Ta'mirlash"
                          onClick={() => openMaintenance(item)}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          title="Ko'chirish"
                          onClick={() => openTransfer(item)}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditingEquipId(item.id);
                            setEquipForm({
                              name: item.name || "",
                              serial_number: item.serial_number || "",
                              qr_code: item.qr_code || "",
                              price: item.price != null ? String(item.price) : "",
                              comment: item.comment || "",
                            });
                            setEditEquipOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FactoryDetails;
