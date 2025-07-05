"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Deparments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new department
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    main_department_id: "",
    start_time: "07:30",
    end_time: "17:30",
    break_time: 60,
  });

  // Form state for editing a department
  const [editDepartment, setEditDepartment] = useState({
    id: null,
    name: "",
    main_department_id: "",
    start_time: "",
    end_time: "",
    break_time: 0,
  });

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/superhr/departments/`);
      setDepartments(res.data);
    } catch (error) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik!",
        description: error.response?.data?.detail || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize the component
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle input changes for adding a new department
  const handleNewDepartmentChange = (e) => {
    const { name, value } = e.target;
    setNewDepartment({
      ...newDepartment,
      [name]: value,
    });
  };

  // Handle select changes for adding a new department
  const handleNewDepartmentSelect = (name, value) => {
    setNewDepartment({
      ...newDepartment,
      [name]: value,
    });
  };

  // Handle input changes for editing a department
  const handleEditDepartmentChange = (e) => {
    const { name, value } = e.target;
    setEditDepartment({
      ...editDepartment,
      [name]: value,
    });
  };

  // Handle select changes for editing a department
  const handleEditDepartmentSelect = (name, value) => {
    setEditDepartment({
      ...editDepartment,
      [name]: value,
    });
  };

  // Open edit dialog and populate the form
  const handleOpenEdit = (department) => {
    setEditDepartment({
      id: department.id,
      name: department.name,
      main_department_id: department.main_department_id,
      start_time: department.start_time.substring(0, 5), // Format from "07:30:00" to "07:30"
      end_time: department.end_time.substring(0, 5), // Format from "17:30:00" to "17:30"
      break_time: department.break_time,
    });
    setOpenEditDialog(true);
  };

  // Add a new department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...newDepartment,
        break_time: Number.parseInt(newDepartment.break_time),
        main_department_id: Number.parseInt(newDepartment.main_department_id),
      };

      if (!newDepartment.main_department_id) {
        toast({
          title: "Diqqat",
          description: "Asosiy bo'limni tanlang!",
          variant: "destructive",
          duration: 2000,
        });
        return;
      }

      await api.post(`/superhr/departments/`, payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Bo'lim muvaffaqiyatli qo'shildi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 2000,
      });

      // Reset form and close dialog
      setNewDepartment({
        name: "",
        main_department_id: "",
        start_time: "07:30",
        end_time: "17:30",
        break_time: 60,
      });
      setOpenAddDialog(false);
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Xatolik!",
        description:
          error.response?.data?.detail || "Bo'lim qo'shishda xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit an existing department
  const handleEditDepartment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: editDepartment.name,
        main_department_id: Number.parseInt(editDepartment.main_department_id),
        start_time: editDepartment.start_time,
        end_time: editDepartment.end_time,
        break_time: Number.parseInt(editDepartment.break_time),
      };

      if (!editDepartment.main_department_id) {
        toast({
          title: "Diqqat",
          description: "Asosiy bo'limni tanlang!",
          variant: "destructive",
          duration: 2000,
        });
        return;
      }

      await api.patch(`/superhr/departments/${editDepartment.id}/`, payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Bo'lim muvaffaqiyatli tahrirlandi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 2000,
      });

      setOpenEditDialog(false);
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Xatolik!",
        description:
          error.response?.data?.detail ||
          "Bo'limni tahrirlashda xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bo'limlar</h1>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi bo'lim qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yangi bo'lim qo'shish</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDepartment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nomi
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newDepartment.name}
                    onChange={handleNewDepartmentChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="main_department" className="text-right">
                    Asosiy bo'lim
                  </Label>
                  <Select
                    value={newDepartment.main_department_id.toString()}
                    onValueChange={(value) =>
                      handleNewDepartmentSelect("main_department_id", value)
                    }
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Asosiy bo'limni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Bekor qilish
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-10 flex-wrap">
          {departments.map((mainDept) => (
            <div key={mainDept.id} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{mainDept.name}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Guruhlar</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainDept.departments.length > 0 ? (
                    mainDept.departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">
                          {dept.name}
                        </TableCell>
                        <TableCell className="text-center max-w-[200px]">
                          <div className="flex flex-col items-start gap-2">
                            {dept.groups
                              ?.sort((a, b) => a.name.localeCompare(b.name))
                              .map((group) => (
                                <Button
                                  key={group.id}
                                  onClick={() =>
                                    navigate(
                                      `/superhr/settings/edit-group/${group.id}`
                                    )
                                  }
                                >
                                  {group.name}
                                </Button>
                              ))}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/superhr/settings/add-group`)
                              }
                            >
                              <Plus className="h-4 w-4 cursor-pointer" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(dept)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Bo'limlar mavjud emas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Edit Department Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bo'limni tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditDepartment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name" className="text-right">
                  Nomi
                </Label>
                <Input
                  id="edit_name"
                  name="name"
                  value={editDepartment.name}
                  onChange={handleEditDepartmentChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_main_department" className="text-right">
                  Asosiy bo'lim
                </Label>
                <Select
                  value={editDepartment.main_department_id.toString()}
                  onValueChange={(value) =>
                    handleEditDepartmentSelect("main_department_id", value)
                  }
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Asosiy bo'limni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Bekor qilish
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda
                  </>
                ) : (
                  "Saqlash"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deparments;
