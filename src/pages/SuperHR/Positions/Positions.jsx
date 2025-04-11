import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
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
import { Pencil, Plus, Search } from "lucide-react";

const Positions = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newRole, setNewRole] = useState({ name: "" });
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
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = roles.filter((role) =>
        role.name.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredRoles(filtered);
    }
  }, [searchQuery, roles]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/superhr/positions");
      setRoles(response.data);
      setFilteredRoles(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        name: "Lavozimlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      const response = await api.post("/superhr/positions", {
        name: newRole.name,
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
      });

      const updatedRoles = roles.map((role) =>
        role.id === editingRole.id
          ? {
              ...role,
              name: editingRole.name,
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

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              Lavozimlar Boshqaruvi
            </CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-primary text-white hover:bg-primary-dark"
                  >
                    <Plus className="h-4 w-4" /> Yangi lavozim
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addRole();
                          }
                        }}
                      />
                    </div>
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
          {isLoading && roles.length === 0 ? (
            <div className="text-center py-6">Lavozimlar yuklanmoqda...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {searchQuery
                ? "Qidiruv bo'yicha natijalar topilmadi"
                : "Lavozimlar mavjud emas"}
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-3">
              {filteredRoles.map((role) => (
                <Card
                  key={role.id}
                  className="hover:shadow-md transition-all border-l-4 border-l-primary hover:scale-105"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate" title={role.name}>
                        {role.name}
                      </div>
                      <Dialog
                        open={isEditDialogOpen && editingRole?.id === role.id}
                        onOpenChange={(open) => {
                          if (!open) setIsEditDialogOpen(false);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingRole(role);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
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
                                Lavozim tavsifi
                              </label>
                              <Input
                                id="edit-name"
                                placeholder="Lavozim tavsifi"
                                value={editingRole?.name || ""}
                                onChange={(e) =>
                                  setEditingRole({
                                    ...editingRole,
                                    name: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    updateRole();
                                  }
                                }}
                              />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Positions;
