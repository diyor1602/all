import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Eye, Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const colorPalette = [
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
];

const Positions = () => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [selectedDep, setSelectedDep] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPos, setViewingPos] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addPayload, setAddPayload] = useState({
    name: "",
    main_department_id: "",
    department_id: 0,
    duties: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPayload, setEditPayload] = useState({
    name: "",
    main_department_id: "",
    department_id: 0,
    duties: "",
  });
  const [editingPos, setEditingPos] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get("/superhr/positions");
      setRoles(response.data);
    } catch {
      toast({
        title: "Xatolik",
        description: "Lavozimlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // restore saved dep/sub when departments are loaded
    if (departments.length > 0) {
      const savedDepId = localStorage.getItem("positionSelectedDep");
      const savedSubId = localStorage.getItem("positionSelectedSub");

      const foundDep = departments.find((d) => d.id == savedDepId);
      const foundSub = foundDep?.departments.find((s) => s.id == savedSubId);

      if (foundDep) {
        setSelectedDep(foundDep);
        setSelectedSub(foundSub || foundDep.departments?.[0] || null);
      } else {
        // fallback to first department
        const firstDep = departments[0];
        setSelectedDep(firstDep);
        setSelectedSub(firstDep.departments?.[0] || null);
      }
    }
  }, [departments]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      const deps = response.data;
      setDepartments(deps);
      setSubDepartments(deps.flatMap((dep) => dep.departments));
    } catch {
      toast({
        title: "Xatolik",
        description: "Bo'limlarni olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    if (!addPayload.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Lavozim nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    if (!addPayload.main_department_id) {
      toast({
        title: "Xatolik",
        description: "Asosiy bo'lim tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    if (addPayload.main_department_id !== "0" && !addPayload.department_id) {
      toast({
        title: "Xatolik",
        description: "Bo'lim tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post("/superhr/positions", addPayload);
      setRoles([...roles, response.data]);
      setAddDialogOpen(false);
      setAddPayload({ name: "", main_department_id: "", department_id: 0 });
      toast({
        title: "Muvaffaqiyatli",
        description: "Lavozim qo'shildi",
        variant: "default",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchRoles();
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Lavozim qo'shishda xatolik",
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
        description: "Lavozim nomi kiritilmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    if (!editPayload.main_department_id) {
      toast({
        title: "Xatolik",
        description: "Asosiy bo'lim tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    if (editPayload.main_department_id !== "0" && !editPayload.department_id) {
      toast({
        title: "Xatolik",
        description: "Bo'lim tanlanmagan",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.patch(
        `/superhr/positions/${editingPos.id}`,
        editPayload
      );
      setRoles([...roles, response.data]);
      setEditDialogOpen(false);
      setEditPayload({ name: "", main_department_id: "", department_id: 0 });
      toast({
        title: "Muvaffaqiyatli",
        description: "Lavozim yangilandi",
        variant: "default",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchRoles();
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Lavozim yangilashda xatolik",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingPos?.name}</DialogTitle>
            <DialogDescription>
              {`${selectedDep?.name} -> ${selectedSub?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-line">
              {viewingPos?.duties || "Bu lavozim uchun vazifalar mavjud emas"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lavozim qo'shish</DialogTitle>
            <DialogDescription>
              {`${selectedDep?.name} -> ${selectedSub?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Lavozim nomini kiriting"
              value={addPayload.name}
              onChange={(e) =>
                setAddPayload({ ...addPayload, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Ushbu lavozimdagi xodimning vazifalarini kiriting"
              className="min-h-[40vh] max-h-[60vh]"
              value={addPayload.duties}
              onChange={(e) =>
                setAddPayload({ ...addPayload, duties: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setAddPayload({
                  name: "",
                  main_department_id: "",
                  department_id: 0,
                  duties: "",
                });
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? "Yuborilmoqda" : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lavozimni tahrirlash</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Select
              value={editPayload.main_department_id}
              onValueChange={(value) =>
                setEditPayload({
                  ...editPayload,
                  main_department_id: value,
                  department_id: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Asosiy bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={editPayload.department_id}
              onValueChange={(value) =>
                setEditPayload({ ...editPayload, department_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {subDepartments
                  .filter(
                    (dep) =>
                      dep.main_department_id === editPayload.main_department_id
                  )
                  .map((dep) => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {dep.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Lavozim nomini kiriting"
              value={editPayload.name}
              onChange={(e) =>
                setEditPayload({ ...editPayload, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Ushbu lavozimdagi xodimning vazifalarini kiriting"
              className="min-h-[40vh] max-h-[60vh]"
              value={editPayload.duties}
              onChange={(e) =>
                setEditPayload({ ...editPayload, duties: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditPayload({
                  name: "",
                  main_department_id: "",
                  department_id: 0,
                  duties: "",
                });
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Yuborilmoqda" : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-r md:min-h-[calc(100vh-4rem)] p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Bo'limlar
          </h2>
        </div>
        <div className="space-y-3">
          {departments?.map((dep, idx) => (
            <div key={idx}>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                  selectedDep?.id === dep.id
                    ? "bg-primary text-white shadow-md"
                    : "hover:bg-primary/10 text-gray-700"
                }`}
                onClick={() => {
                  setSelectedDep(dep);
                  localStorage.setItem("positionSelectedDep", dep.id);

                  const firstSub = dep.departments?.[0] || null;
                  setSelectedSub(firstSub);
                  localStorage.setItem(
                    "positionSelectedSub",
                    firstSub?.id || ""
                  );
                }}
              >
                {dep.name}
              </button>
              {selectedDep?.id === dep.id && dep.departments?.length > 0 && (
                <div className="ml-4 mt-2 space-y-1">
                  {dep.departments.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      className={`block w-full text-left px-3 py-1 rounded-md text-sm transition ${
                        selectedSub?.id === sub.id
                          ? "bg-primary/80 text-white shadow"
                          : "hover:bg-primary/10 text-gray-600"
                      }`}
                      onClick={() => {
                        setSelectedSub(sub);
                        localStorage.setItem("positionSelectedSub", sub.id);
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 bg-white">
        {/* Search */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            Lavozimlar
          </h1>
          <Button
            size="icon"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => {
              setAddPayload({
                name: "",
                main_department_id: selectedDep?.id,
                department_id: selectedSub?.id,
              });
              setAddDialogOpen(true);
            }}
          >
            <Plus />
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.filter((role) => role.department_id === selectedSub?.id)
            .length > 0 ? (
            roles
              .filter((role) => role.department_id === selectedSub?.id)
              .map((role, idx) => {
                const colorClass = colorPalette[idx % colorPalette.length];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`rounded-xl shadow-md hover:shadow-xl transition border ${colorClass}`}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold truncate">
                          {role.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          <Button
                            className="rounded-lg shadow-sm"
                            size="icon"
                            onClick={() => {
                              setViewingPos(role);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye />
                          </Button>
                          <Button
                            className="rounded-lg shadow-sm"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingPos(role);
                              setEditPayload({
                                name: role.name,
                                main_department_id: selectedDep?.id,
                                department_id: selectedSub?.id,
                                duties: role.duties || "",
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
          ) : (
            <p className="text-gray-500">Hech qanday lavozim topilmadi</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Positions;
