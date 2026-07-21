import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store,
  Plus,
  Loader2,
  Phone,
  MapPin,
  MessageSquare,
} from "lucide-react";

const Stores = () => {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [filterActive, setFilterActive] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
    is_active: true,
  });

  const getData = async () => {
    try {
      setLoading(true);
      const res = await api.get("v1/supplier/stores", {
        params: { is_active: filterActive },
      });
      setData(res.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (storeId, currentStatus) => {
    try {
      await api.patch(`v1/supplier/stores/${storeId}`, {
        is_active: !currentStatus,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Do'kon holati o'zgartirildi",
      });
      getData();
    } catch {
      toast({
        title: "Xatolik",
        description: "Do'kon holatini o'zgartirib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingStore(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      comment: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || "",
      phone: store.phone || "",
      address: store.address || "",
      comment: store.comment || "",
      is_active: store.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Do'kon nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingStore) {
        await api.patch(`v1/supplier/stores/${editingStore.id}`, formData);
        toast({
          title: "Muvaffaqiyatli",
          description: "Do'kon ma'lumotlari yangilandi",
        });
      } else {
        await api.post("v1/supplier/stores", formData);
        toast({
          title: "Muvaffaqiyatli",
          description: "Do'kon yaratildi",
        });
      }
      setDialogOpen(false);
      getData();
    } catch {
      toast({
        title: "Xatolik",
        description: editingStore
          ? "Do'kon ma'lumotlarini yangilab bo'lmadi"
          : "Do'kon yaratib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getData();
  }, [filterActive]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Do'konlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.length ? `Jami ${data.length} ta do'kon` : "0 ta do'kon"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterActive(!filterActive)}
            className="flex items-center gap-2"
          >
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                filterActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  filterActive ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-xs font-medium">
              {filterActive ? "Faol" : "Nofaol"}
            </span>
          </button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi do'kon
          </Button>
        </div>
      </div>

      {/* Stores table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold">Do'konlar ro'yxati</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.length ? `Jami ${data.length} ta do'kon` : "0 ta do'kon"}
          </p>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="text-sm whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14 text-xs font-semibold text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Nom
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Telefon
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Manzil
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Izoh
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Holat
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Amallar
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((store) => (
                  <TableRow
                    key={store.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {store.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{store.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{store.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {store.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{store.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {store.comment ? (
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{store.comment}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleActive(store.id, store.is_active)}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            store.is_active ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              store.is_active
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {store.is_active ? "Faol" : "Nofaol"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(store)}
                        className="h-8"
                      >
                        Tahrirlash
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Ma'lumot topilmadi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Hali hech qanday do'kon yo'q
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "Do'konni tahrirlash" : "Yangi do'kon yaratish"}
            </DialogTitle>
            <DialogDescription>
              {editingStore
                ? "Do'kon ma'lumotlarini tahrirlang"
                : "Yangi do'kon ma'lumotlarini kiriting"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Do'kon nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Do'kon nomini kiriting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Manzilni kiriting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Izoh</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                placeholder="Qo'shimcha izoh"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, is_active: !formData.is_active })
                }
                className="flex items-center gap-2"
              >
                <div
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    formData.is_active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium">
                  {formData.is_active ? "Faol" : "Nofaol"}
                </span>
              </button>
              <Label htmlFor="is_active" className="text-sm">
                Do'kon holati
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : editingStore ? (
                "Saqlash"
              ) : (
                "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;
