import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "edit_tarif_draft";
import {
  ArrowLeft,
  CheckCheck,
  CirclePlus,
  Loader2,
  Check,
  ChevronsUpDown,
  Timer,
  Trash,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimerDialog from "./TimerDialog";

const EditTarif = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serverTarif, setServerTarif] = useState(null);
  const [localChanges, setLocalChanges] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Combined tarif state that merges server data with local changes
  const tarif = useMemo(() => {
    if (!serverTarif) return null;
    if (!localChanges) return serverTarif;

    // Merge server data with local changes
    return {
      ...serverTarif,
      ...localChanges,
      // For arrays, we need to merge them carefully
      tarifications: localChanges.tarifications || serverTarif.tarifications,
    };
  }, [serverTarif, localChanges]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const newRowRef = useRef(null);
  const formSubmittedRef = useRef(false);

  // Timer dialog state
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [activeTimerRowIndex, setActiveTimerRowIndex] = useState(null);

  const fetchTarif = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/technologist/tarification/${id}`);
      // Always update server data with the latest from the server
      setServerTarif(response.data);

      // Check for local changes
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Only apply local changes if they're for this tarif
        if (parsed.id === id) {
          setLocalChanges(parsed);
        } else {
          // Clear any unrelated saved data
          localStorage.removeItem(STORAGE_KEY);
          setLocalChanges(null);
        }
      } else {
        setLocalChanges(null);
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tarifikatsiyani olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/technologist/users", {
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

  const fetchRanks = async () => {
    try {
      const response = await api.get("/technologist/razryads");
      setRanks(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Razryadlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await api.get("/technologist/typewriter");
      setMachines(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mashinalar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  // Save local changes to localStorage
  useEffect(() => {
    // Don't save if form was already submitted or no changes
    if (formSubmittedRef.current || !localChanges || initialLoad) return;

    const saveDraft = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...localChanges,
            id, // Ensure the current ID is always included
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        toast({
          title: "Xatolik",
          description: "Tarifikatsiyani qoralamaga saqlashda xatolik",
          variant: "destructive",
          duration: 1000,
        });
      }
    };

    // Save immediately on change
    saveDraft();

    // Cleanup - save on unmount if not submitted
    return () => {
      if (!formSubmittedRef.current) {
        saveDraft();
      }
    };
  }, [localChanges, id, initialLoad]);

  // Load saved changes on initial render
  useEffect(() => {
    if (!initialLoad) return;

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.id === id) {
          setLocalChanges(parsed);
        }
      } catch (e) {
        toast({
          title: "Xatolik",
          description: "Tarifikatsiyani qoralamadan olishda xatolik",
          variant: "destructive",
          duration: 1000,
        });
      }
    }
    setInitialLoad(false);
  }, [id, initialLoad]);

  // Initial data fetch
  useEffect(() => {
    fetchTarif();
    fetchRanks();
    fetchMachines();
    fetchWorkers();
  }, [id]);

  const updateLocalChanges = (updater) => {
    setLocalChanges((prev) => {
      const current = prev || { tarifications: [] };
      const updated =
        typeof updater === "function" ? updater(current) : updater;
      return { ...current, ...updated };
    });
  };

  const handleInputChange = (index, field, value) => {
    updateLocalChanges((prev) => {
      const updateTarifications = [
        ...(prev?.tarifications || serverTarif?.tarifications || []),
      ];
      updateTarifications[index] = {
        ...updateTarifications[index],
        [field]: value,
      };
      return {
        ...prev,
        tarifications: updateTarifications,
      };
    });
  };

  const handleWorkerSelect = (index, workerId) => {
    updateLocalChanges((prev) => {
      const updateTarifications = [
        ...(prev?.tarifications || serverTarif?.tarifications || []),
      ];
      updateTarifications[index] = {
        ...updateTarifications[index],
        employee_id: workerId,
        employee: null,
      };
      return {
        ...prev,
        tarifications: updateTarifications,
      };
    });
    setActivePopoverIndex(null);
  };

  const handleRazryadSelect = (index, razryadId) => {
    updateLocalChanges((prev) => {
      const updateTarifications = [...(prev?.tarifications || [])];
      const tarification = { ...updateTarifications[index] };

      // Update razryad_id and remove razryad object
      tarification.razryad_id = razryadId;
      tarification.razryad = null;

      // Calculate new summa based on selected razryad and current second value
      if (razryadId) {
        const razryad = ranks.find((r) => r.id === razryadId);
        if (razryad && razryad.salary && tarification.second) {
          // Calculate the summa and round to 1 decimal place
          const calculatedSumma = (
            parseFloat(razryad.salary) * parseFloat(tarification.second)
          ).toFixed(1);
          tarification.summa = calculatedSumma;
        }
      }

      updateTarifications[index] = tarification;
      return { tarifications: updateTarifications };
    });
  };

  const handleMachineSelect = (index, machineId) => {
    updateLocalChanges((prev) => {
      const updateTarifications = [...(prev?.tarifications || [])];
      updateTarifications[index] = {
        ...updateTarifications[index],
        typewriter_id: machineId,
        typewriter: null,
      };
      return { tarifications: updateTarifications };
    });
  };

  const handleSecondChange = (index, value) => {
    updateLocalChanges((prev) => {
      const updateTarifications = [...(prev?.tarifications || [])];
      const tarification = { ...updateTarifications[index] };

      // Update the second value
      tarification.second = value;

      // Calculate summa based on razryad salary * second
      const razryadId =
        tarification.razryad_id ||
        (tarification.razryad ? tarification.razryad.id : null);
      if (razryadId) {
        const razryad = ranks.find((r) => r.id === razryadId);
        if (razryad && razryad.salary) {
          // Calculate the summa and round to 1 decimal place
          const calculatedSumma = (parseFloat(razryad.salary) * value).toFixed(
            1
          );
          tarification.summa = calculatedSumma;
        }
      }

      updateTarifications[index] = tarification;
      return { tarifications: updateTarifications };
    });
  };

  // Open the timer dialog for a specific row
  const openTimerDialog = (index) => {
    setActiveTimerRowIndex(index);
    setIsTimerDialogOpen(true);
  };

  // Handle saving the timer value
  const handleTimerSave = (averageTime) => {
    if (activeTimerRowIndex !== null) {
      handleSecondChange(activeTimerRowIndex, averageTime);

      toast({
        title: "Muvaffaqiyatli",
        description: "Vaqt o'lchovi muvaffaqiyatli saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    }
    setIsTimerDialogOpen(false);
    setActiveTimerRowIndex(null);
  };

  const handleDeleteRow = (index) => {
    if (
      (serverTarif?.tarifications?.length || 0) +
        (localChanges?.tarifications?.length || 0) <=
      1
    ) {
      toast({
        title: "Diqqat",
        description: "Kamida bitta qator bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    updateLocalChanges((prev) => {
      const updatedTarifications = [...(prev?.tarifications || [])];
      updatedTarifications.splice(index, 1);
      return { tarifications: updatedTarifications };
    });
  };

  const addNewRow = () => {
    const newRow = {
      name: "",
      employee_id: null,
      razryad_id: null,
      typewriter_id: null,
      second: 0,
      code: "",
      summa: 0,
      is_new: true, // Mark as new row that doesn't exist on server
    };

    updateLocalChanges((prev) => {
      // Get existing local changes or initialize empty array
      const existingLocalChanges = prev?.tarifications || [];
      // Get server tarifications that haven't been modified locally
      const unmodifiedServerTarifs = (serverTarif?.tarifications || []).filter(
        (serverItem) =>
          !existingLocalChanges.some(
            (localItem) => localItem.id === serverItem.id
          )
      );

      return {
        ...prev,
        // Combine unmodified server tarifs, existing local changes, and the new row
        tarifications: [
          ...unmodifiedServerTarifs,
          ...existingLocalChanges,
          newRow,
        ],
      };
    });

    // Focus on the new row after the state update
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.focus();
      }
    }, 0);
  };

  const saveTarifications = async () => {
    if (!serverTarif) return;

    // Mark form as submitting
    formSubmittedRef.current = true;

    // Check if any name is empty
    const hasEmptyNames = tarif?.tarifications?.some((item) => !item?.name);
    const hasEmptyRazryad = tarif?.tarifications?.some(
      (item) => !item?.razryad_id && !item?.razryad?.id
    );
    const hasEmptySecond = tarif?.tarifications?.some((item) => !item?.second);
    if (hasEmptyNames || hasEmptyRazryad || hasEmptySecond) {
      toast({
        title: "Diqqat",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    // check second
    if (tarif?.tarifications?.some((item) => parseFloat(item?.second) <= 0)) {
      toast({
        title: "Diqqat",
        description: "Sekundni to'g'ri kiriting",
        variant: "destructive",
      });
      return;
    }

    // check tarif name
    if (!tarif?.name) {
      toast({
        title: "Diqqat",
        description: "Tarifikatsiya nomi bo'lishi shart",
        variant: "destructive",
      });
      return;
    }

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

      await api.patch(`/technologist/tarification/${id}`, {
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
      // Only clear localStorage after successful API call
      localStorage.removeItem(STORAGE_KEY);
      fetchTarif();
    } catch (error) {
      // Reset form submission state on error
      formSubmittedRef.current = false;
      toast({
        title: "Xatolik",
        description: "Tarifikatsiyani saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex items-center mb-4 gap-2">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Tarifikatsiya nomi"
              className="w-full"
              value={tarif?.name || ""}
              onChange={(e) => updateLocalChanges({ name: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="w-full overflow-auto max-h-[75vh]">
        <table className="my-4 whitespace-nowrap border w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Kodi</th>
              <th className="px-4 py-2 border">Nomi</th>
              <th className="px-4 py-2 border">Xodim</th>
              <th className="px-4 py-2 border">Razryad</th>
              <th className="px-4 py-2 border">Mashina</th>
              <th className="px-4 py-2 border">Sekund</th>
              <th className="px-4 py-2 border">Summa (so'm)</th>
            </tr>
          </thead>
          <tbody>
            {tarif?.tarifications
              ?.sort((a, b) =>
                a?.code?.localeCompare(b?.code, undefined, {
                  numeric: true,
                  sensitivity: "base",
                })
              )
              .map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">
                    {item?.code ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item?.code}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-red-500">Saqlanmagan</div>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    <>
                      <Input
                        placeholder="Nomi"
                        className="min-w-[400px]"
                        type="text"
                        value={item?.name || ""}
                        onChange={(e) =>
                          handleInputChange(index, "name", e.target.value)
                        }
                        ref={
                          index === tarif.tarifications.length - 1
                            ? newRowRef
                            : null
                        }
                        list="nomi-options"
                      />
                      {index === 0 && (
                        <datalist id="nomi-options">
                          {Array.from(
                            new Set(
                              tarif.tarifications
                                .map((t) => t.name)
                                .filter(Boolean)
                            )
                          ).map((name, idx) => (
                            <option key={idx} value={name} />
                          ))}
                        </datalist>
                      )}
                    </>
                  </td>
                  <td className="px-4 py-2 border">
                    <Popover
                      open={activePopoverIndex === `worker-${index}`}
                      onOpenChange={(open) =>
                        setActivePopoverIndex(open ? `worker-${index}` : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={
                            activePopoverIndex === `worker-${index}`
                          }
                          className="w-[200px] justify-between"
                        >
                          {item?.employee?.id
                            ? workers.find(
                                (worker) => worker.id === item.employee.id
                              )?.name || "Xodimni tanlang"
                            : item?.employee_id
                            ? workers.find(
                                (worker) => worker.id === item.employee_id
                              )?.name || "Xodimni tanlang"
                            : "Xodimni tanlang"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Qidirish..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>Xodimlar topilmadi.</CommandEmpty>
                            <CommandGroup>
                              {workers.map((worker) => (
                                <CommandItem
                                  key={worker.id}
                                  value={worker.name}
                                  onSelect={() =>
                                    handleWorkerSelect(index, worker.id)
                                  }
                                >
                                  {worker.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      item?.employee?.id === worker.id ||
                                        item?.employee_id === worker.id
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
                  </td>
                  <td className="px-4 py-2 border">
                    <Select
                      value={(
                        item?.razryad_id || item?.razryad?.id
                      )?.toString()}
                      onValueChange={(value) =>
                        handleRazryadSelect(index, parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Razryadni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ranks
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((rank) => (
                              <SelectItem
                                key={rank.id}
                                value={rank.id.toString()}
                              >
                                {rank.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 border">
                    <Select
                      value={(
                        item?.typewriter_id || item?.typewriter?.id
                      )?.toString()}
                      onValueChange={(value) =>
                        handleMachineSelect(index, parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Mashinani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {machines
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((machine) => (
                              <SelectItem
                                key={machine.id}
                                value={machine.id.toString()}
                              >
                                {machine.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={item?.second}
                        onChange={(e) =>
                          handleSecondChange(index, parseFloat(e.target.value))
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openTimerDialog(index)}
                        title="Vaqtni o'lchash"
                      >
                        <Timer className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center justify-between">
                      <span>
                        {parseFloat(item?.summa).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(index);
                        }}
                        title="O'chirish"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="w-full flex justify-end mt-6 gap-4 flex-wrap">
        <Button
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
          onClick={addNewRow}
        >
          <CirclePlus className="size-4" /> Qo'shish
        </Button>
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

      {/* Timer Dialog Component */}
      <TimerDialog
        isOpen={isTimerDialogOpen}
        onClose={() => setIsTimerDialogOpen(false)}
        onSave={handleTimerSave}
      />
    </>
  );
};

export default EditTarif;
