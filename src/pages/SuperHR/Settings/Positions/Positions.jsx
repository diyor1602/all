import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Positions = () => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newRole, setNewRole] = useState({
    name: "",
    main_department_id: "",
    department_id: 0,
  });
  const [editingRole, setEditingRole] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAddDialogOpen) {
      setNewRole({ name: "" });
    }
  }, [isAddDialogOpen]);

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/superhr/positions");
      setRoles(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Lavozimlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      setDepartments(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Departamentlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const addRole = async () => {
    if (isLoading) return;

    if (!newRole.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Lavozim tavsifi kiritilmagan",
        variant: "destructive",
      });
      return;
    }

    if (!newRole.main_department_id) {
      toast({
        title: "Xatolik",
        description: "Asosiy bo'lim tanlanmagan",
        variant: "destructive",
      });
      return;
    }

    if (newRole.main_department_id !== "0" && !newRole.department_id) {
      toast({
        title: "Xatolik",
        description: "Bo'lim tanlanmagan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/superhr/positions", {
        name: newRole.name,
        department_id:
          newRole.main_department_id === "0" ? 0 : newRole.department_id,
      });

      setRoles([...roles, response.data]);
      setNewRole({ name: "" });
      setIsAddDialogOpen(false);

      toast({
        title: "Muvaffaqiyatli",
        description: "Lavozim qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Lavozim qo'shishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async () => {
    if (isLoading) return;

    if (!editingRole.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Lavozim tavsifi kiritilmagan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/superhr/positions/${editingRole.id}`, {
        name: editingRole.name,
        department_id: editingRole.department_id,
      });

      const updatedRoles = roles.map((role) =>
        role.id === editingRole.id
          ? {
              ...role,
              name: editingRole.name,
              department_id: editingRole.department_id,
            }
          : role
      );

      setRoles(updatedRoles);
      setIsEditDialogOpen(false);

      toast({
        title: "Muvaffaqiyatli",
        description: "Lavozim yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Lavozim yangilashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (role) => {
    // Find the main department for this role
    let mainDepartmentId = "0";
    departments.forEach((mainDep) => {
      mainDep.departments.forEach((dep) => {
        if (dep.id === role.department_id) {
          mainDepartmentId = String(mainDep.id);
        }
      });
    });

    setEditingRole({
      ...role,
      main_department_id: mainDepartmentId,
    });
    setIsEditDialogOpen(true);
  };

  const getUnassignedRoles = () => {
    return roles.filter(
      (role) => role.department_id === 0 || role.department_id === null
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              Lavozimlar Boshqaruvi
            </CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus /> Yangi lavozim
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yangi lavozim qo'shish</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-1"
                      >
                        Lavozim tavsifi
                      </label>
                      <Input
                        id="name"
                        placeholder="Lavozim tavsifi"
                        value={newRole.name}
                        onChange={(e) =>
                          setNewRole({
                            ...newRole,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="mainDepartment"
                        className="block text-sm font-medium mb-1"
                      >
                        Asosiy bo'lim
                      </label>
                      <Select
                        value={String(newRole?.main_department_id || "")}
                        onValueChange={(value) => {
                          setNewRole({
                            ...newRole,
                            main_department_id: value,
                            department_id: 0,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Asosiy bo'limni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">
                            Bo'linmaga biriktirilmagan
                          </SelectItem>
                          {departments.map((dep) => (
                            <SelectItem key={dep.id} value={String(dep.id)}>
                              {dep.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newRole?.main_department_id &&
                      newRole.main_department_id !== "0" && (
                        <div>
                          <label
                            htmlFor="subDepartment"
                            className="block text-sm font-medium mb-1"
                          >
                            Bo'lim
                          </label>
                          <Select
                            value={String(newRole?.department_id || "0")}
                            onValueChange={(value) =>
                              setNewRole({
                                ...newRole,
                                department_id: parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Bo'limni tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments
                                .find(
                                  (dep) =>
                                    dep.id ===
                                    parseInt(newRole.main_department_id)
                                )
                                ?.departments.map((subdep) => (
                                  <SelectItem
                                    key={subdep.id}
                                    value={String(subdep.id)}
                                  >
                                    {subdep.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      onClick={addRole}
                      disabled={isLoading}
                      className="bg-primary text-white hover:bg-primary-dark"
                    >
                      {isLoading ? "Yuborilmoqda..." : "Saqlash"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            {departments?.map((department, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-all border-l-4 border-l-primary cursor-pointer"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2 border-b-2 pb-2">
                    <div
                      className="font-semibold text-2xl truncate"
                      title={department.name}
                    >
                      {department.name}
                    </div>
                  </div>
                  {department?.departments
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((subdep, subIndex) => (
                      <div key={subIndex}>
                        <div className="flex items-center justify-center my-4 text-xl">
                          <div
                            className="font-medium truncate"
                            title={subdep.name}
                          >
                            {subdep.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="ml-2 flex flex-wrap gap-3">
                            {roles
                              ?.filter((r) => r.department_id === subdep.id)
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((role, roleIndex) => (
                                <Button
                                  key={roleIndex}
                                  className="flex items-center gap-2 rounded p-2 text-sm"
                                  onClick={() => handleEditClick(role)}
                                >
                                  {role.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}

            {/* Unassigned Roles Section */}
            {getUnassignedRoles().length > 0 && (
              <Card className="hover:shadow-md transition-all border-l-4 border-l-yellow-500 mt-4">
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2 border-b-2 pb-2">
                    <div className="font-semibold text-2xl truncate">
                      Bo'linmaga biriktirilmagan lavozimlar
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getUnassignedRoles().map((role, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="truncate">{role.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(role)}
                          className="p-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lavozimni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium mb-1"
              >
                Lavozim nomi
              </label>
              <Input
                id="edit-name"
                placeholder="Lavozim nomi"
                value={editingRole?.name || ""}
                onChange={(e) =>
                  setEditingRole({
                    ...editingRole,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="mainDepartment"
                  className="block text-sm font-medium mb-1"
                >
                  Asosiy bo'lim
                </label>
                <Select
                  value={String(editingRole?.main_department_id || "")}
                  onValueChange={(value) => {
                    setEditingRole({
                      ...editingRole,
                      main_department_id: value,
                      department_id: 0, // Reset sub-department when main department changes
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Asosiy bo'limni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      Bo'linmaga biriktirilmagan
                    </SelectItem>
                    {departments.map((dep) => (
                      <SelectItem key={dep.id} value={String(dep.id)}>
                        {dep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingRole?.main_department_id &&
                editingRole.main_department_id !== "0" && (
                  <div>
                    <label
                      htmlFor="subDepartment"
                      className="block text-sm font-medium mb-1"
                    >
                      Bo'lim
                    </label>
                    <Select
                      value={String(editingRole?.department_id || "0")}
                      onValueChange={(value) =>
                        setEditingRole({
                          ...editingRole,
                          department_id: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bo'limni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments
                          .find(
                            (dep) =>
                              dep.id ===
                              parseInt(editingRole.main_department_id)
                          )
                          ?.departments.map((subdep) => (
                            <SelectItem
                              key={subdep.id}
                              value={String(subdep.id)}
                            >
                              {subdep.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={updateRole}
              disabled={isLoading}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              {isLoading ? "Yuborilmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Positions;
