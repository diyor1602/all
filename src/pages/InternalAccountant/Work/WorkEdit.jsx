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

const WorkEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarif, setTarif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [activePopoverIndex, setActivePopoverIndex] = useState(null);
  const newRowRef = useRef(null);

  const fetchTarif = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/internalAccountant/tarification/${id}`);
      setTarif(response.data);
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

  const handleInputChange = (index, field, value) => {
    const updateTarifications = [...tarif.tarifications];
    updateTarifications[index] = {
      ...updateTarifications[index],
      [field]: value,
    };

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

    // Focus on the new row after the state update
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.focus();
      }
    }, 0);
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

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex items-center justify-between mb-4 gap-2">
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
      <div className="w-full overflow-auto max-h-[75vh]">
        <table className="my-4 whitespace-nowrap md:whitespace-normal border w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Kodi</th>
              <th className="px-4 py-2 border">Nomi</th>
              <th className="px-4 py-2 border">Xodim</th>
              <th className="px-4 py-2 border">Razryad</th>
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
              ?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{item?.code || "-"}</td>
                  <td className="px-4 py-2 border">{item?.name || "-"}</td>
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
                  <td className="px-4 py-2 border text-center">
                    {item?.razryad?.name || "-"}
                  </td>
                  <td className="px-4 py-2 border">{item?.second || "-"}</td>
                  <td className="px-4 py-2 border">
                    {parseFloat(item?.summa).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
    </>
  );
};

export default WorkEdit;
