import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Edit,
  Trash2,
  User2,
  UserPlus,
  UserMinus,
  UserPen,
  Users,
  Calendar,
  Plus,
} from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

// "Abduraxmanov Diyorbek" → "A.D"
const getShortName = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}.${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "").toUpperCase();
};

const EMPTY_MACHINE_FORM = { name: "", comment: "", position: 0, started_at: TODAY };
const EMPTY_EMPLOYEE_FORM = { employee_id: null, started_at: TODAY, type_writer_id: null };

const EmployeeAvatar = ({ img, name, size = "md" }) => {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";
  return img ? (
    <img src={img} alt={name} className={`${dim} shrink-0 rounded-full object-cover`} />
  ) : (
    <div
      className={`${dim} shrink-0 flex items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600`}
    >
      {getShortName(name)}
    </div>
  );
};

const GroupDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("panelDate") || TODAY,
  );
  const [data, setData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add machine
  const [addMachineDialog, setAddMachineDialog] = useState(false);
  const [addMachineForm, setAddMachineForm] = useState({ ...EMPTY_MACHINE_FORM });
  const [addMachineLoading, setAddMachineLoading] = useState(false);

  // Edit machine
  const [editMachineDialog, setEditMachineDialog] = useState(false);
  const [editMachineForm, setEditMachineForm] = useState(null);
  const [editMachineLoading, setEditMachineLoading] = useState(false);

  // Delete machine
  const [deleteMachineTarget, setDeleteMachineTarget] = useState(null);
  const [deleteMachineLoading, setDeleteMachineLoading] = useState(false);

  // Assign / replace employee
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ ...EMPTY_EMPLOYEE_FORM });
  const [employeeMachine, setEmployeeMachine] = useState(null);
  const [employeeDialogMode, setEmployeeDialogMode] = useState("add");
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Remove employee
  const [removeEmployeeTarget, setRemoveEmployeeTarget] = useState(null);
  const [removeEmployeeLoading, setRemoveEmployeeLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [machinesRes, groupRes] = await Promise.all([
        api.get(`/superhr/groups/${id}/type-writers`, { params: { date: selectedDate } }),
        api.get(`/tv-dashboard/${id}`, { params: { date: selectedDate } }),
      ]);
      setData(machinesRes.data);
      setGroupData(groupRes.data);
    } catch {
      toast({ title: "Xatolik", description: "Ma'lumotlar yuklanmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    localStorage.setItem("panelDate", val);
  };

  // Set of present employee IDs for O(1) lookup — handles both `employee_id` and `id` field names
  const presentIds = new Set((groupData?.present ?? []).map((e) => e.employee_id ?? e.id));

  // ── Add machine ──────────────────────────────────────────────
  const openAddMachine = () => {
    setAddMachineForm({ ...EMPTY_MACHINE_FORM });
    setAddMachineDialog(true);
  };

  const handleAddMachine = async () => {
    setAddMachineLoading(true);
    try {
      await api.post(`/superhr/type-writers`, { ...addMachineForm, group_id: id });
      setAddMachineDialog(false);
      fetchAll();
    } catch {
      toast({ title: "Xatolik", description: "Mashina qo'shishda xatolik", variant: "destructive" });
    } finally {
      setAddMachineLoading(false);
    }
  };

  // ── Edit machine ─────────────────────────────────────────────
  const openEditMachine = (machine) => {
    setEditMachineForm({
      id: machine.type_writer_id,
      name: machine.name,
      comment: machine.comment || "",
      position: machine.position ?? 0,
    });
    setEditMachineDialog(true);
  };

  const handleEditMachine = async () => {
    setEditMachineLoading(true);
    try {
      await api.patch(`/superhr/type-writers/${editMachineForm.id}`, editMachineForm);
      setEditMachineDialog(false);
      fetchAll();
    } catch {
      toast({ title: "Xatolik", description: "Mashinani tahrirlashda xatolik", variant: "destructive" });
    } finally {
      setEditMachineLoading(false);
    }
  };

  // ── Delete machine ───────────────────────────────────────────
  const handleDeleteMachine = async () => {
    setDeleteMachineLoading(true);
    try {
      await api.delete(`/superhr/type-writers/${deleteMachineTarget.type_writer_id}`);
      setDeleteMachineTarget(null);
      fetchAll();
    } catch {
      toast({ title: "Xatolik", description: "Mashinani o'chirishda xatolik", variant: "destructive" });
    } finally {
      setDeleteMachineLoading(false);
    }
  };

  // ── Assign / replace employee ────────────────────────────────
  const openEmployeeDialog = (machine, mode) => {
    setEmployeeDialogMode(mode);
    setEmployeeMachine(machine);
    setEmployeeForm({ ...EMPTY_EMPLOYEE_FORM, type_writer_id: machine.type_writer_id });
    setEmployeeDialog(true);
  };

  const handleAssignEmployee = async () => {
    setEmployeeLoading(true);
    try {
      await api.post(
        `/superhr/type-writers/${employeeForm.type_writer_id}/assign-employee`,
        employeeForm,
      );
      setEmployeeDialog(false);
      fetchAll();
    } catch {
      toast({ title: "Xatolik", description: "Xodim biriktirishda xatolik", variant: "destructive" });
    } finally {
      setEmployeeLoading(false);
    }
  };

  // ── Remove employee ──────────────────────────────────────────
  const handleRemoveEmployee = async () => {
    setRemoveEmployeeLoading(true);
    try {
      await api.post(
        `/superhr/type-writers/${removeEmployeeTarget.type_writer_id}/remove-employee`,
      );
      setRemoveEmployeeTarget(null);
      fetchAll();
    } catch {
      toast({ title: "Xatolik", description: "Xodimni olib tashlashda xatolik", variant: "destructive" });
    } finally {
      setRemoveEmployeeLoading(false);
    }
  };

  // ── Machine cell style ───────────────────────────────────────
  const getCellStyle = (machine) => {
    if (!machine.employee) return "bg-slate-100 text-slate-400 border-slate-300";
    const eid = machine.employee.employee_id ?? machine.employee.id;
    const present = presentIds.has(eid);
    if (!present) return "bg-slate-300 text-slate-600 border-slate-400 opacity-70";
    if (machine.employee.coefficient > 0) return "bg-emerald-500 text-white border-emerald-600";
    if (machine.employee.coefficient < 0) return "bg-red-500 text-white border-red-600";
    return "bg-amber-400 text-white border-amber-500";
  };

  const hasAnyEmployee =
    (groupData?.present?.length ?? 0) > 0 || (groupData?.absent?.length ?? 0) > 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  {groupData?.group_name || "Guruh"}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{groupData?.responsible_user || "—"}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-44 bg-white"
            />
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* ── Machine playground ── */}
        {!loading && data && (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 rounded-t-2xl border-b bg-blue-50 px-6 py-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">KIRISH</Badge>
              <span className="text-sm font-medium text-blue-700">KROY</span>
            </div>

            <div className="flex flex-wrap gap-3 p-6">
              {data?.machines?.map((machine) => {
                const hasEmployee = !!machine.employee;
                const name = machine.employee?.name || "";
                const coefficient = machine.employee?.coefficient ?? 0;
                const imgUrl = machine.employee?.img || null;
                const empId = machine.employee?.employee_id ?? machine.employee?.id;
                const isPresent = hasEmployee && presentIds.has(empId);

                return (
                  <ContextMenu key={machine.type_writer_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ContextMenuTrigger
                          className={`relative flex h-20 w-20 cursor-context-menu flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed text-xs font-medium transition-transform hover:scale-105 active:scale-95 select-none ${getCellStyle(machine)}`}
                        >
                          {/* Present / absent dot */}
                          {hasEmployee && (
                            <span
                              className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
                                isPresent ? "bg-green-400" : "bg-red-400"
                              }`}
                            />
                          )}

                          {hasEmployee ? (
                            <span className="text-sm font-bold leading-none">
                              {getShortName(name)}
                            </span>
                          ) : (
                            <Bot className="h-5 w-5 opacity-50" />
                          )}
                          <span className="max-w-full truncate px-1 text-center text-[10px] leading-tight opacity-80">
                            {machine.name}
                          </span>
                          {hasEmployee && (
                            <span className="text-[10px] font-semibold leading-none">
                              {coefficient}%
                            </span>
                          )}
                        </ContextMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-48">
                        <p className="font-semibold">{machine.name}</p>
                        {machine.comment && (
                          <p className="text-xs text-gray-400">{machine.comment}</p>
                        )}
                        {hasEmployee && (
                          <>
                            <p className="mt-1 text-xs">{name}</p>
                            <p className="text-xs text-emerald-400">{coefficient}%</p>
                            <p className={`text-xs ${isPresent ? "text-green-400" : "text-red-400"}`}>
                              {isPresent ? "Kelgan" : "Kelmagan"}
                            </p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>

                    <ContextMenuContent className="w-52">
                      <ContextMenuGroup>
                        <ContextMenuItem disabled className="font-medium">
                          <Bot className="mr-2 h-4 w-4" />
                          {machine.name}
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        {!hasEmployee && (
                          <ContextMenuItem onClick={() => openEmployeeDialog(machine, "add")}>
                            <UserPlus className="mr-2 h-4 w-4 text-emerald-500" />
                            Xodim biriktirish
                          </ContextMenuItem>
                        )}

                        {hasEmployee && (
                          <>
                            <ContextMenuItem disabled className="gap-2 text-xs text-gray-400">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={name}
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <User2 className="h-4 w-4" />
                              )}
                              <span className="truncate">{name}</span>
                              <span
                                className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                                  isPresent ? "bg-green-400" : "bg-red-400"
                                }`}
                              />
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => openEmployeeDialog(machine, "replace")}>
                              <UserPen className="mr-2 h-4 w-4 text-blue-500" />
                              Ishchini almashtirish
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => setRemoveEmployeeTarget(machine)}
                              className="text-orange-500 focus:text-orange-600"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Ishchini olib tashlash
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                          </>
                        )}

                        <ContextMenuItem onClick={() => openEditMachine(machine)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Mashinani tahrirlash
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          className="text-red-500 focus:text-red-600"
                          onClick={() => setDeleteMachineTarget(machine)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Mashinani o'chirish
                        </ContextMenuItem>
                      </ContextMenuGroup>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={openAddMachine}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-gray-400 hover:border-blue-400 hover:text-blue-500"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">Mashina</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Yangi mashina qo'shish</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2 rounded-b-2xl border-t bg-emerald-50 px-6 py-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">CHIQISH</Badge>
              <span className="text-sm font-medium text-emerald-700">TAYYOR</span>
            </div>
          </div>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-16 text-gray-400 shadow-sm">
            <Bot className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">Ma'lumot topilmadi</p>
          </div>
        )}
      </div>

      {/* ── Add Machine Dialog ── */}
      <Dialog open={addMachineDialog} onOpenChange={setAddMachineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi mashina qo'shish</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label>Mashina nomi *</Label>
              <Input
                value={addMachineForm.name}
                onChange={(e) => setAddMachineForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mashina nomi"
              />
            </div>
            <div className="space-y-1">
              <Label>Izoh</Label>
              <Input
                value={addMachineForm.comment}
                onChange={(e) => setAddMachineForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Izoh"
              />
            </div>
            <div className="space-y-1">
              <Label>Pozitsiya</Label>
              <Input
                type="number"
                value={addMachineForm.position}
                onChange={(e) =>
                  setAddMachineForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Qo'shilgan sana</Label>
              <Input
                type="date"
                value={addMachineForm.started_at}
                onChange={(e) => setAddMachineForm((f) => ({ ...f, started_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMachineDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleAddMachine}
              disabled={!addMachineForm.name || addMachineLoading}
            >
              {addMachineLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Machine Dialog ── */}
      <Dialog open={editMachineDialog} onOpenChange={setEditMachineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mashinani tahrirlash</DialogTitle>
          </DialogHeader>
          {editMachineForm && (
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label>Mashina nomi *</Label>
                <Input
                  value={editMachineForm.name}
                  onChange={(e) => setEditMachineForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mashina nomi"
                />
              </div>
              <div className="space-y-1">
                <Label>Izoh</Label>
                <Input
                  value={editMachineForm.comment}
                  onChange={(e) => setEditMachineForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Izoh"
                />
              </div>
              <div className="space-y-1">
                <Label>Pozitsiya</Label>
                <Input
                  type="number"
                  value={editMachineForm.position}
                  onChange={(e) =>
                    setEditMachineForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMachineDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleEditMachine}
              disabled={!editMachineForm?.name || editMachineLoading}
            >
              {editMachineLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Machine Confirm ── */}
      <AlertDialog
        open={!!deleteMachineTarget}
        onOpenChange={(open) => !open && setDeleteMachineTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mashinani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteMachineTarget?.name}</strong> mashinasini o'chirishni tasdiqlaysizmi?
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMachine}
              disabled={deleteMachineLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMachineLoading ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Assign / Replace Employee Dialog ── */}
      <Dialog open={employeeDialog} onOpenChange={setEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {employeeDialogMode === "replace" ? "Ishchini almashtirish" : "Xodim biriktirish"}
            </DialogTitle>
            {employeeMachine && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <Bot className="h-3.5 w-3.5" />
                {employeeMachine.name}
              </p>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {/* Present employees */}
              {(groupData?.present?.length ?? 0) > 0 && (
                <>
                  <p className="sticky top-0 bg-white pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Kelganlar
                  </p>
                  {groupData.present.map((emp) => (
                    <EmployeeRow
                      key={emp.employee_id}
                      emp={emp}
                      isPresent
                      selected={employeeForm.employee_id === emp.employee_id}
                      onSelect={() =>
                        setEmployeeForm((f) => ({ ...f, employee_id: emp.employee_id }))
                      }
                    />
                  ))}
                </>
              )}

              {/* Absent employees */}
              {(groupData?.absent?.length ?? 0) > 0 && (
                <>
                  <p className="sticky top-0 bg-white pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-red-500">
                    Kelmaydiganlar
                  </p>
                  {groupData.absent.map((emp) => (
                    <EmployeeRow
                      key={emp.employee_id}
                      emp={emp}
                      isPresent={false}
                      selected={employeeForm.employee_id === emp.employee_id}
                      onSelect={() =>
                        setEmployeeForm((f) => ({ ...f, employee_id: emp.employee_id }))
                      }
                    />
                  ))}
                </>
              )}

              {!hasAnyEmployee && (
                <p className="py-6 text-center text-sm text-gray-400">Xodimlar topilmadi</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Sana</Label>
              <Input
                type="date"
                value={employeeForm.started_at}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, started_at: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleAssignEmployee}
              disabled={!employeeForm.employee_id || employeeLoading}
            >
              {employeeLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Employee Confirm ── */}
      <AlertDialog
        open={!!removeEmployeeTarget}
        onOpenChange={(open) => !open && setRemoveEmployeeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ishchini olib tashlash</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeEmployeeTarget?.employee?.name}</strong> ni{" "}
              <strong>{removeEmployeeTarget?.name}</strong> mashinasidan olib tashlashni
              tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveEmployee}
              disabled={removeEmployeeLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {removeEmployeeLoading ? "Olib tashlanmoqda..." : "Olib tashlash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

const EmployeeRow = ({ emp, isPresent, selected, onSelect }) => (
  <div
    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
      selected ? "border-blue-400 bg-blue-50" : "border-transparent"
    }`}
    onClick={onSelect}
  >
    <EmployeeAvatar img={emp.img} name={emp.name} size="md" />
    <span className="min-w-0 flex-1 truncate">{emp.name}</span>
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${isPresent ? "bg-emerald-400" : "bg-red-400"}`}
    />
  </div>
);


export default GroupDetails;
