import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  Check,
  ChevronsUpDown,
  Search,
  Plus,
  X,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const WorkEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarif, setTarif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openWorkDialog, setOpenWorkDialog] = useState(false);
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);

  // Temporary state for works being assigned in the dialog
  const [tempAssignedWorks, setTempAssignedWorks] = useState([]);
  const [dialogSaving, setDialogSaving] = useState(false);

  const fetchTarif = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/internalAccountant/tarification/${id}`);
      setTarif(response.data);

      // Initialize with empty assigned works - will be populated when employee is selected
      setAssignedWorks([]);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tarifikatsiyani olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/internalAccountant/users", {
        params: {
          id: tarif?.submodel_id,
        },
      });
      setWorkers(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xodimlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTarif();
  }, [id]);

  useEffect(() => {
    if (tarif?.submodel_id) {
      fetchWorkers();
    }
  }, [tarif?.submodel_id]);

  // When employee is selected, find their assigned works
  useEffect(() => {
    if (selectedEmployee && tarif?.tarifications) {
      const employeeWorks = tarif.tarifications.filter(
        (work) =>
          (work.employee && work.employee.id === selectedEmployee.id) ||
          work.employee_id === selectedEmployee.id
      );
      setAssignedWorks(employeeWorks);

      // Reset temp assigned works when employee changes
      setTempAssignedWorks([]);
    }
  }, [selectedEmployee, tarif]);

  // When dialog opens, initialize temp assigned works
  useEffect(() => {
    if (openWorkDialog) {
      // Initialize with currently assigned works
      setTempAssignedWorks([...assignedWorks.map((work) => work.id)]);
    }
  }, [openWorkDialog, assignedWorks]);

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setOpenEmployeeSelect(false);
  };

  const handleTempAssignWork = (work) => {
    // Add to temporary assigned works if not already there
    if (!tempAssignedWorks.includes(work.id)) {
      setTempAssignedWorks([...tempAssignedWorks, work.id]);
    }
  };

  const handleTempRemoveWork = (workId) => {
    // Remove from temporary assigned works
    setTempAssignedWorks(tempAssignedWorks.filter((id) => id !== workId));
  };

  const applyTempAssignments = () => {
    setDialogSaving(true);

    try {
      // Create a copy of tarifications
      const updatedTarifications = [...tarif.tarifications];

      // First, remove all assignments for this employee
      updatedTarifications.forEach((work, index) => {
        const isAssignedToEmployee =
          (work.employee && work.employee.id === selectedEmployee.id) ||
          work.employee_id === selectedEmployee.id;

        if (isAssignedToEmployee) {
          updatedTarifications[index] = {
            ...work,
            employee_id: null,
            employee: null,
          };
        }
      });

      // Then, apply all temp assignments
      tempAssignedWorks.forEach((workId) => {
        const workIndex = updatedTarifications.findIndex(
          (work) => work.id === workId
        );

        if (workIndex !== -1) {
          updatedTarifications[workIndex] = {
            ...updatedTarifications[workIndex],
            employee_id: selectedEmployee.id,
            employee: null,
          };
        }
      });

      // Update the tarif state
      setTarif({
        ...tarif,
        tarifications: updatedTarifications,
      });

      // Update assigned works
      const newAssignedWorks = updatedTarifications.filter(
        (work) => work.employee_id === selectedEmployee.id
      );
      setAssignedWorks(newAssignedWorks);

      // Close the dialog
      setOpenWorkDialog(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ishlarni biriktirish jarayonida xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDialogSaving(false);
    }
  };

  const handleRemoveWork = (work) => {
    // Create a copy of tarifications
    const updatedTarifications = [...tarif.tarifications];

    // Find the work in the tarifications array
    const workIndex = updatedTarifications.findIndex(
      (item) => item.id === work.id
    );

    if (workIndex !== -1) {
      // Update the work to remove the employee
      updatedTarifications[workIndex] = {
        ...updatedTarifications[workIndex],
        employee_id: null,
        employee: null,
      };

      // Update the tarif state
      setTarif({
        ...tarif,
        tarifications: updatedTarifications,
      });

      // Remove from assigned works
      setAssignedWorks(assignedWorks.filter((item) => item.id !== work.id));
    }
  };

  const handleDirectEmployeeChange = (workId, employeeId) => {
    // Create a copy of tarifications
    const updatedTarifications = [...tarif.tarifications];

    // Find the work in the tarifications array
    const workIndex = updatedTarifications.findIndex(
      (item) => item.id === workId
    );

    if (workIndex !== -1) {
      // Update the work with the new employee
      updatedTarifications[workIndex] = {
        ...updatedTarifications[workIndex],
        employee_id: employeeId,
        employee: null, // Remove the employee object reference when directly setting employee_id
      };

      // Update the tarif state
      setTarif({
        ...tarif,
        tarifications: updatedTarifications,
      });

      // If the selected employee is affected, update their assigned works
      if (selectedEmployee) {
        if (employeeId === selectedEmployee.id) {
          // Work was assigned to the selected employee, add to their assigned works
          if (!assignedWorks.some((work) => work.id === workId)) {
            setAssignedWorks([
              ...assignedWorks,
              updatedTarifications[workIndex],
            ]);
          }
        } else if (assignedWorks.some((work) => work.id === workId)) {
          // Work was removed from the selected employee, remove from their assigned works
          setAssignedWorks(assignedWorks.filter((work) => work.id !== workId));
        }
      }
    }

    setActivePopoverIndex(null);
  };

  const saveTarifications = async () => {
    setSaving(true);

    try {
      // Prepare data for submission
      const tarificationsToSubmit = tarif.tarifications.map((item) => {
        const preparedItem = {
          name: item.name || "",
          // Use employee_id if available, otherwise use employee.id if available
          employee_id:
            item.employee_id || (item.employee ? item.employee.id : null),
          // Use razryad_id if available, otherwise use razryad.id if available
          razryad_id:
            item.razryad_id || (item.razryad ? item.razryad.id : null),
          // Use typewriter_id if available, otherwise use typewriter.id if available
          typewriter_id:
            item.typewriter_id || (item.typewriter ? item.typewriter.id : null),
          second: item.second || 0,
        };

        // Only include code if it exists
        if (item.code) {
          preparedItem.code = item.code;
        }

        // Include ID if it exists (for existing records)
        if (item.id) {
          preparedItem.id = item.id;
        }

        return preparedItem;
      });

      await api.patch(`/internalAccountant/tarification/${id}`, {
        name: tarif.name,
        submodel_id: tarif.submodel_id,
        tarifications: tarificationsToSubmit,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Tarifikatsiya muvaffaqiyatli saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      fetchTarif();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tarifikatsiyani saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get all works from tarifications
  const allWorks = tarif?.tarifications || [];

  // Filter works for the dialog
  const filteredWorks = searchTerm
    ? allWorks.filter(
        (work) =>
          work.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allWorks;

  // Sort works: first unassigned, then by ID
  const sortedWorks = [...filteredWorks].sort((a, b) => {
    // First sort by assignment status (unassigned first)
    const aAssigned = a.employee_id || (a.employee && a.employee.id);
    const bAssigned = b.employee_id || (b.employee && b.employee.id);

    if (!aAssigned && bAssigned) return -1;
    if (aAssigned && !bAssigned) return 1;

    // Then sort by ID
    return a.id - b.id;
  });

  // Sort all works by ID for the view table
  const allWorksSorted = [...allWorks].sort((a, b) => a.id - b.id);

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="w-full flex items-center justify-between mb-6 gap-2">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <div className="text-xl font-semibold">{tarif?.name || "-"}</div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Employee Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Xodimni tanlang</CardTitle>
            <CardDescription>
              Ishlarni biriktirish uchun avval xodimni tanlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Popover
              open={openEmployeeSelect}
              onOpenChange={setOpenEmployeeSelect}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEmployeeSelect}
                  className="w-full justify-between"
                >
                  {selectedEmployee ? selectedEmployee.name : "Xodimni tanlang"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Qidirish..." className="h-9" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Xodimlar topilmadi.</CommandEmpty>
                    <CommandGroup>
                      {workers.map((worker) => (
                        <CommandItem
                          key={worker.id}
                          value={worker.name}
                          onSelect={() => handleSelectEmployee(worker)}
                        >
                          {worker.name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedEmployee?.id === worker.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Assigned Works Card */}
        {selectedEmployee && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Biriktirilgan ishlar</CardTitle>
                <CardDescription>
                  {selectedEmployee.name} ga biriktirilgan ishlar
                </CardDescription>
              </div>
              <Dialog open={openWorkDialog} onOpenChange={setOpenWorkDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ish biriktirish
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Ish biriktirish</DialogTitle>
                    <DialogDescription>
                      {selectedEmployee.name} ga biriktirish uchun ishlarni
                      tanlang
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="mb-4">
                      <Input
                        placeholder="Qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4"
                        prefix={
                          <Search className="h-4 w-4 text-muted-foreground" />
                        }
                      />
                    </div>
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white">
                          <TableRow>
                            <TableHead className="w-[80px] border">
                              Kod
                            </TableHead>
                            <TableHead className="border">Nomi</TableHead>
                            <TableHead className="border">Xodim</TableHead>
                            <TableHead className="w-[80px] border">
                              Amallar
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedWorks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                Ishlar topilmadi
                              </TableCell>
                            </TableRow>
                          ) : (
                            sortedWorks.map((work) => {
                              // Determine if work is already assigned to someone
                              const assignedToId =
                                work.employee_id ||
                                (work.employee && work.employee.id);
                              const assignedToCurrentUser =
                                assignedToId === selectedEmployee.id;
                              const assignedToOther =
                                assignedToId && !assignedToCurrentUser;

                              // Find the employee name if assigned to someone else
                              let assignedToName = "";
                              if (assignedToOther) {
                                const assignedWorker = workers.find(
                                  (w) => w.id === assignedToId
                                );
                                assignedToName = assignedWorker
                                  ? assignedWorker.name
                                  : "Boshqa xodim";
                              }

                              // Check if work is in temp assigned works
                              const isInTempAssigned =
                                tempAssignedWorks.includes(work.id);

                              return (
                                <TableRow
                                  key={work.id}
                                  className={cn(
                                    isInTempAssigned && "bg-green-50",
                                    assignedToOther &&
                                      !isInTempAssigned &&
                                      "bg-gray-50"
                                  )}
                                >
                                  <TableCell className="font-medium border text-center">
                                    {work.code || "-"}
                                  </TableCell>
                                  <TableCell className="border">
                                    {work.name || "-"}
                                  </TableCell>
                                  <TableCell className="border text-center">
                                    {isInTempAssigned ? (
                                      <span className="text-green-600 text-sm font-medium">
                                        Tanlandi
                                      </span>
                                    ) : assignedToCurrentUser ? (
                                      <span className="text-green-600 text-sm font-medium">
                                        Joriy xodim
                                      </span>
                                    ) : assignedToOther ? (
                                      <span className="text-gray-600 text-sm">
                                        {assignedToName}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="border text-center">
                                    {isInTempAssigned ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleTempRemoveWork(work.id)
                                        }
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleTempAssignWork(work)
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={applyTempAssignments}
                      disabled={dialogSaving}
                      className="w-full sm:w-auto"
                    >
                      {dialogSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Saqlash
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {assignedWorks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Hozircha biriktirilgan ishlar yo'q
                </div>
              ) : (
                <div className="rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-center border">
                          Kodi
                        </TableHead>
                        <TableHead className="border">Nomi</TableHead>
                        <TableHead className="border">Razryad</TableHead>
                        <TableHead className="text-center border">
                          Sekund
                        </TableHead>
                        <TableHead className="text-center border">
                          Summa
                        </TableHead>
                        <TableHead className="w-[80px] border">
                          Amallar
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium border text-center">
                            {work.code || "-"}
                          </TableCell>
                          <TableCell className="border">
                            {work.name || "-"}
                          </TableCell>
                          <TableCell className="border">
                            {work.razryad?.name || "-"}
                          </TableCell>
                          <TableCell className="border text-center">
                            {work.second || "-"}
                          </TableCell>
                          <TableCell className="border text-center">
                            {Number.parseFloat(work.summa).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </TableCell>
                          <TableCell className="border text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveWork(work)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Works View Card */}
        <Card>
          <CardHeader>
            <CardTitle>Barcha ishlar</CardTitle>
            <CardDescription>Mavjud barcha ishlar ro'yxati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[80px] text-center border">
                        Kodi
                      </TableHead>
                      <TableHead className="border">Nomi</TableHead>
                      <TableHead className="border">Xodim</TableHead>
                      <TableHead className="border">Razryad</TableHead>
                      <TableHead className="border">Sekund</TableHead>
                      <TableHead className="border">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allWorksSorted.map((work, index) => {
                      // Determine if work is assigned to someone
                      const assignedToId =
                        work.employee_id || (work.employee && work.employee.id);

                      // Find the employee name if assigned
                      let assignedToName = "";
                      let assignedWorker = null;
                      if (assignedToId) {
                        assignedWorker = workers.find(
                          (w) => w.id === assignedToId
                        );
                        assignedToName = assignedWorker
                          ? assignedWorker.name
                          : "Boshqa xodim";
                      }

                      return (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium border text-center">
                            {work.code || "-"}
                          </TableCell>
                          <TableCell className="border">
                            {work.name || "-"}
                          </TableCell>
                          <TableCell className="border">
                            <Popover
                              open={activePopoverIndex === `worker-${index}`}
                              onOpenChange={(open) =>
                                setActivePopoverIndex(
                                  open ? `worker-${index}` : null
                                )
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 justify-start p-2 text-left font-normal"
                                  size="sm"
                                  role="combobox"
                                  aria-expanded={
                                    activePopoverIndex === `worker-${index}`
                                  }
                                >
                                  {assignedToId ? (
                                    <span className="text-gray-700 text-sm">
                                      {assignedToName}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      Xodim tanlanmagan
                                    </span>
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Qidirish..." />
                                  <CommandList>
                                    <CommandEmpty>Xodim topilmadi</CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() =>
                                          handleDirectEmployeeChange(
                                            work.id,
                                            null
                                          )
                                        }
                                        className="text-sm"
                                      >
                                        <span>Xodim tanlanmagan</span>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            !assignedToId
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                      {workers
                                        .sort((a, b) =>
                                          a.name.localeCompare(b.name)
                                        )
                                        .map((worker) => (
                                          <CommandItem
                                            key={worker.id}
                                            onSelect={() =>
                                              handleDirectEmployeeChange(
                                                work.id,
                                                worker.id
                                              )
                                            }
                                            className="text-sm"
                                          >
                                            {worker.name}
                                            <Check
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                assignedToId === worker.id
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="border text-center">
                            {work.razryad?.name || "-"}
                          </TableCell>
                          <TableCell className="border text-center">
                            {work.second || "-"}
                          </TableCell>
                          <TableCell className="border text-center">
                            {Number.parseFloat(work.summa).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full flex justify-end mt-6 gap-4 flex-wrap">
        <Button
          className="flex items-center gap-2"
          onClick={saveTarifications}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          Saqlash
        </Button>
      </div>
    </div>
  );
};

export default WorkEdit;
