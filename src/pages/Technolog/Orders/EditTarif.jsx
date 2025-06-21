import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [tarif, setTarif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const newRowRef = useRef(null);

  const [lastTarifs, setLastTarifs] = useState([]);

  // Timer dialog state
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [activeTimerRowIndex, setActiveTimerRowIndex] = useState(null);

  const [selectedTarifLang, setSelectedTarifLang] = useState(
    localStorage.getItem("tarifLang") || "uz"
  );

  const fetchTarif = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/technologist/tarification/${id}`);
      setTarif(response.data);
      setSelectedTarifLang(response.data?.region);
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

  const fetchLastTarifs = async () => {
    try {
      const response = await api.get("/technologist/lastTarifications");
      setLastTarifs(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tarifikatsiyalar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLastTarifs();
  }, []);

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

  useEffect(() => {
    fetchTarif();
    fetchRanks();
    fetchMachines();
  }, [id]);

  useEffect(() => {
    if (tarif?.submodel_id) {
      fetchWorkers();
    }
  }, [tarif?.submodel_id]);

  const handleInputChange = (index, field, value) => {
    const updateTarifications = [...tarif.tarifications];

    // If this is a name change, check if it matches any last tarification
    if (field === "name") {
      const matchingTarif = lastTarifs.find((t) => t.name === value);
      if (matchingTarif) {
        // Update the razryad and second fields from the matched tarification
        updateTarifications[index] = {
          ...updateTarifications[index],
          [field]: value,
          razryad_id: matchingTarif.razryad?.id || null,
          razryad: matchingTarif.razryad,
          second: matchingTarif.second,
        };

        // Calculate summa if razryad has a salary
        if (matchingTarif.razryad?.salary) {
          const calculatedSumma = (
            parseFloat(matchingTarif.razryad.salary) *
            parseFloat(matchingTarif.second)
          ).toFixed(1);
          updateTarifications[index].summa = calculatedSumma;
        }
      } else {
        // Just update the name if no matching tarification found
        updateTarifications[index] = {
          ...updateTarifications[index],
          [field]: value,
        };
      }
    } else {
      // Handle other field changes normally
      updateTarifications[index] = {
        ...updateTarifications[index],
        [field]: value,
      };
    }

    setTarif({
      ...tarif,
      tarifications: updateTarifications,
    });
  };

  const handleWorkerSelect = (index, workerId) => {
    const updateTarifications = [...tarif.tarifications];
    updateTarifications[index] = {
      ...updateTarifications[index],
      employee_id: workerId,
      // Remove the employee object reference when directly setting employee_id
      employee: null,
    };

    setTarif({
      ...tarif,
      tarifications: updateTarifications,
    });

    // Close the popover after selection
    setActivePopoverIndex(null);
  };

  const handleRazryadSelect = (index, razryadId) => {
    const updateTarifications = [...tarif.tarifications];
    const tarification = updateTarifications[index];

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

    setTarif({
      ...tarif,
      tarifications: updateTarifications,
    });
  };

  const handleMachineSelect = (index, machineId) => {
    const updateTarifications = [...tarif.tarifications];
    updateTarifications[index] = {
      ...updateTarifications[index],
      typewriter_id: machineId,
      // Remove the typewriter object reference when directly setting typewriter_id
      typewriter: null,
    };

    setTarif({
      ...tarif,
      tarifications: updateTarifications,
    });
  };

  const handleSecondChange = (index, value) => {
    const updateTarifications = [...tarif.tarifications];
    const tarification = updateTarifications[index];

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
        const calculatedSumma = (parseFloat(razryad.salary) * value).toFixed(1);
        tarification.summa = calculatedSumma;
      }
    }

    setTarif({
      ...tarif,
      tarifications: updateTarifications,
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
    if (tarif?.tarifications?.length <= 1) {
      toast({
        title: "Diqqat",
        description: "Kamida bitta qator bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    const updatedTarifications = [...tarif.tarifications];
    updatedTarifications.splice(index, 1);

    setTarif({
      ...tarif,
      tarifications: updatedTarifications,
    });
  };

  const addNewRow = () => {
    const newRow = {
      name: "",
      employee_id: null,
      razryad_id: null,
      typewriter_id: null,
      second: 0,
      // Preserve these fields as read-only
      code: "",
      summa: 0,
    };

    setTarif({
      ...tarif,
      tarifications: [...tarif.tarifications, newRow],
    });
  };

  const saveTarifications = async () => {
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
        region: selectedTarifLang,
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
        <div className="text-xl font-semibold w-full">
          <Input
            type="text"
            placeholder="Tarifikatsiya nomi"
            className="w-full"
            value={tarif?.name}
            onChange={(e) => setTarif({ ...tarif, name: e.target.value })}
          />
        </div>
        <Select
          value={selectedTarifLang}
          onValueChange={(value) => {
            setSelectedTarifLang(value);
            localStorage.setItem("tarifLang", value);
          }}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Tarif tili" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uz">O'zbek</SelectItem>
            <SelectItem value="ru">Rus</SelectItem>
          </SelectContent>
        </Select>
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
                a.code.localeCompare(b.code, undefined, {
                  numeric: true,
                  sensitivity: "base",
                })
              )
              .map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{item?.code || "-"}</td>
                  <td className="px-4 py-2 border">
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
                        {lastTarifs?.map((tarif, idx) => (
                          <option
                            key={idx}
                            value={`${tarif?.name} (${tarif?.second})`}
                          />
                        ))}
                      </datalist>
                    )}
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
