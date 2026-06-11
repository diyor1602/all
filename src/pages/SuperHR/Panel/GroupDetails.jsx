import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Bot, Edit, Trash2, User2, UserPlus } from "lucide-react";

const GroupDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [addMachineDialog, setAddMachineDialog] = useState(false);
  const [addMachineForm, setAddMachineForm] = useState({
    name: "",
    comment: "",
    group_id: id,
    position: 0,
    started_at: null,
  });
  const [groupData, setGroupData] = useState(null);
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState({
    employee_id: null,
    started_at: new Date().toISOString().split("T")[0],
    type_writer_id: null,
  });

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/superhr/groups/${id}/type-writers`);
      setData(res.data);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Guruh ma'lumotlari yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const res = await api.get(`/tv-dashboard/${id}`);
      setGroupData(res.data);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Xodimlar ma'lumotlari yuklanmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchGroupDetails();
  }, [id]);

  const handleAddMachine = async () => {
    try {
      await api.post(`/superhr/type-writers`, addMachineForm);
      setAddMachineDialog(false);
      setAddMachineForm({
        name: "",
        comment: "",
        group_id: id,
        position: 0,
        started_at: null,
      });
      fetchGroup();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Mashina qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleAddEmployee = async () => {
    try {
      await api.post(
        `/superhr/type-writers/${addEmployeeForm.type_writer_id}/assign-employee`,
        addEmployeeForm,
      );
      setAddEmployeeDialog(false);
      setAddEmployeeForm({
        employee_id: null,
        started_at: null,
        type_writer_id: null,
      });
      fetchGroup();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Xodim qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {loading && <p className="text-sm text-gray-500">Yuklanmoqda...</p>}
      {!loading && data && (
        <div>
          {/* Group Info */}
          <div>
            <div>{groupData?.group_name || "-"}</div>
            <div>{groupData?.responsible_user || "-"}</div>
          </div>

          {/* Machines */}
          <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-lg">
            <div className="font-semibold text-lg">KIRISH - KROY</div>
            {/* start of playground */}
            <div className="flex gap-2">
              {data?.machines?.map((machine, index) => {
                const employeeName =
                  machine.employee?.name || "Xodim biriktirish";
                const hasEmployee = machine.employee;
                const imgUrl = machine.employee?.image || null;
                const cellColor = hasEmployee
                  ? machine.employee?.coefficient > 0
                    ? "bg-green-500"
                    : "bg-red-500 text-white"
                  : "bg-gray-300";
                const empInitials = hasEmployee ? (
                  `${employeeName.split(" ")[0].charAt(0)}${employeeName
                    .split(" ")[1]
                    .charAt(0)}`
                ) : (
                  <Bot className="w-4 h-4" />
                );
                const coefficient = machine.employee?.coefficient || 0;
                return (
                  <ContextMenu key={index}>
                    <ContextMenuTrigger
                      className={`flex flex-col gap-1 w-12 h-12 items-center justify-center rounded-xl border border-dashed text-sm ${cellColor}`}
                    >
                      <div>{empInitials}</div>
                      {hasEmployee && (
                        <div className="text-xs">{coefficient} %</div>
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuGroup>
                        <ContextMenuItem disabled>
                          <Bot className="w-4 h-4 mr-2" />
                          {machine.name}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => {
                            setAddEmployeeForm({
                              ...addEmployeeForm,
                              type_writer_id: machine.type_writer_id,
                            });
                            setAddEmployeeDialog(true);
                          }}
                        >
                          {hasEmployee ? (
                            imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={employeeName}
                                className="w-4 h-4 mr-2 object-cover"
                              />
                            ) : (
                              <User2 className="w-4 h-4 mr-2" />
                            )
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          {employeeName}
                        </ContextMenuItem>
                        <ContextMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Mashinani tahrirlash
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          className="text-red-500"
                          onClick={() => {
                            // TODO: Delete machine
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Mashinani o'chirish
                        </ContextMenuItem>
                      </ContextMenuGroup>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
              <Button
                variant="outline"
                className="w-12 h-12"
                onClick={() => setAddMachineDialog(true)}
              >
                +
              </Button>
            </div>
            {/* end of playground */}
            <div className="font-semibold text-lg">CHIQISH - TAYYOR</div>
          </div>
        </div>
      )}
      <Dialog open={addMachineDialog} onOpenChange={setAddMachineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi mashina qo'shish</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Mashina nomi</Label>
              <Input
                value={addMachineForm.name}
                onChange={(e) =>
                  setAddMachineForm({ ...addMachineForm, name: e.target.value })
                }
                placeholder="Mashina nomi"
              />
            </div>
            <div>
              <Label>Izoh</Label>
              <Input
                value={addMachineForm.comment}
                onChange={(e) =>
                  setAddMachineForm({
                    ...addMachineForm,
                    comment: e.target.value,
                  })
                }
                placeholder="Izoh"
              />
            </div>
            <div>
              <Label>Mashina pozitsiyasi</Label>
              <Input
                type="number"
                value={addMachineForm.position}
                onChange={(e) =>
                  setAddMachineForm({
                    ...addMachineForm,
                    position: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Qo'shilgan sana</Label>
              <Input
                type="date"
                value={addMachineForm.started_at}
                onChange={(e) =>
                  setAddMachineForm({
                    ...addMachineForm,
                    started_at: e.target.value,
                  })
                }
              />
            </div>
            <Button onClick={handleAddMachine}>Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addEmployeeDialog} onOpenChange={setAddEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi xodim qo'shish</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="overflow-y-auto max-h-96 space-y-2">
              {groupData?.present?.map((employee, index) => (
                <div
                  key={index}
                  className={`p-2 border rounded cursor-pointer hover:bg-gray-100 ${
                    addEmployeeForm?.employee_id === employee.employee_id
                      ? "bg-gray-200"
                      : "bg-red-50"
                  }`}
                  onClick={() => {
                    setAddEmployeeForm({
                      ...addEmployeeForm,
                      employee_id: employee.employee_id,
                    });
                  }}
                >
                  {employee.name}
                </div>
              ))}
            </div>
            <Button onClick={handleAddEmployee}>Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetails;
