import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Check, Loader2, Plus, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CoinsAudio from "/coins.wav";

const Models = () => {
  const { toast } = useToast();

  const [packets, setPackets] = useState([]);
  const [models, setModels] = useState([]);
  const [balance, setBalance] = useState(0);
  const [selectedModels, setSelectedModels] = useState([]);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [sendingID, setSendingID] = useState(null);
  const [displayBalance, setDisplayBalance] = useState(0);

  const getPackets = async () => {
    try {
      const response = await api.get("/tailor/packets");
      setPackets(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Paketlarni olishda xatolik yuz berdi.",
      });
    }
  };

  const getModels = async () => {
    try {
      const response = await api.get("/tailor/models");
      setModels(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Modellarni olishda xatolik yuz berdi.",
      });
    }
  };

  const getBalance = async () => {
    try {
      const response = await api.get("/tailor/balance");
      setBalance(response.data);
      setDisplayBalance(
        response.data?.reduce((total, item) => {
          return total + (Number(item.amount_earned) || 0);
        }, 0)
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Balansni olishda xatolik yuz berdi.",
      });
    }
  };

  useEffect(() => {
    getPackets();
    getModels();
    getBalance();
  }, []);

  const handleDone = async (id) => {
    setSendingID(id);
    try {
      await api.post("/tailor/tarificationLog", {
        tarification_id: id,
      });
      await getBalance();
      const audio = new Audio(CoinsAudio);
      audio.play();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setSendingID(null);
    }
  };

  return (
    <>
      <Dialog open={modelsOpen} onOpenChange={setModelsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Model qo'shish</DialogTitle>
            <DialogDescription>Model tanlang</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-scroll">
            {models
              ?.filter(
                (model) =>
                  !selectedModels.includes(model) &&
                  model.tarification_categories?.length > 0
              )
              ?.map((model, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-md flex cursor-pointer justify-between gap-3 shadow-md border border-gray-200"
                  onClick={() => {
                    setSelectedModels((prev) => [
                      ...prev,
                      {
                        model: model,
                        works: [
                          {
                            id: "",
                            name: "",
                            summa: "",
                            second: "",
                            cat_id: "",
                          },
                        ],
                      },
                    ]);
                    setModelsOpen(false);
                  }}
                >
                  <div className="truncate font-medium">
                    {model.model?.name} - {model.submodel?.name}
                  </div>
                  <div className="truncate text-sm text-gray-500">
                    {model.tarification_categories?.length} ta kategoriya
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col items-center gap-1">
        <div>{localStorage.getItem("name")}</div>
        <div>{parseInt(displayBalance)?.toLocaleString("ru-RU")} so'm</div>
      </div>
      {selectedModels.length > 0 ? (
        <>
          <div className="flex gap-2 w-full flex-wrap mt-4 items-center">
            <div>Tanlangan modellar: </div>
            {selectedModels.map((model, index) => (
              <div
                key={index}
                className="text-sm rounded-sm px-2 py-1 bg-gray-200 flex items-center gap-2"
              >
                {console.log(model)}
                {model.model?.model?.name} - {model.model?.submodel?.name}
                <X
                  className="cursor-pointer"
                  size={14}
                  onClick={() => {
                    setSelectedModels((prev) =>
                      prev.filter((item) => item.model.id !== model.model.id)
                    );
                  }}
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModelsOpen(true)}
            >
              <Plus /> Model qo'shish
            </Button>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {selectedModels.map((model, index) => (
              <div
                key={index}
                className="p-4 rounded-md border-2 border-blue-300"
              >
                <div className="flex items-center gap-2 justify-between flex-wrap">
                  <div className="truncate font-medium">
                    {model.model?.model?.name} - {model.model?.submodel?.name}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      model.works.push({
                        id: "",
                        name: "",
                        summa: "",
                        second: "",
                        cat_id: "",
                      });
                      setSelectedModels((prev) => [...prev]);
                    }}
                  >
                    <PlusCircle /> Ish qo'shish
                  </Button>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {model.works?.map((work, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 bg-white p-2 rounded-md border border-gray-200 relative"
                    >
                      <div className="grid grid-cols-2 gap-2 mt-5">
                        <X
                          onClick={() => {
                            model.works.splice(index, 1);
                            setSelectedModels((prev) => [...prev]);
                            if (model.works.length === 0) {
                              setSelectedModels((prev) =>
                                prev.filter((item) => item.id !== model.id)
                              );
                            }
                          }}
                          size={16}
                          className="absolute top-2 right-2 cursor-pointer"
                        />
                        <Select
                          value={work.cat_id}
                          onValueChange={(value) => {
                            model.works[index].cat_id = value;
                            model.works[index].id = "";
                            model.works[index].name = "";
                            model.works[index].code = "";
                            model.works[index].summa = "";
                            model.works[index].second = "";
                            setSelectedModels((prev) => [...prev]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kategoriyani tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {model.model?.tarification_categories?.map(
                              (category, index) => (
                                <SelectItem key={index} value={category.id}>
                                  <div className="break-words whitespace-normal max-w-[250px] text-left">
                                    {category.name}
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        {work.cat_id && (
                          <>
                            <Select
                              value={work.id}
                              onValueChange={(value) => {
                                const selectedTarification =
                                  model.model?.tarification_categories
                                    ?.find(
                                      (category) => category.id === work.cat_id
                                    )
                                    ?.tarification?.find((t) => t.id === value);
                                model.works[index].id = value;
                                model.works[index].name =
                                  selectedTarification?.name || "";
                                model.works[index].code =
                                  selectedTarification?.code || "";
                                model.works[index].summa =
                                  selectedTarification?.summa || "";
                                model.works[index].second =
                                  selectedTarification?.second || "";
                                setSelectedModels((prev) => [...prev]);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Ishni tanlang">
                                  {work.code || ""}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {model.model?.tarification_categories
                                  ?.find(
                                    (category) => category.id === work.cat_id
                                  )
                                  ?.tarification?.filter(
                                    (tarification) =>
                                      !model.works.some(
                                        (w) =>
                                          w.id === tarification.id && w !== work
                                      )
                                  )
                                  ?.map((tarification, index) => (
                                    <SelectItem
                                      key={index}
                                      value={tarification.id}
                                    >
                                      <div className="break-words whitespace-normal max-w-[250px]">
                                        {tarification.code} -{" "}
                                        {tarification.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {work.id && (
                          <div>
                            <div>{work.name}</div>
                            <div className="text-sm text-gray-500">
                              {parseInt(work.summa)} so'm / {work.second} sekund
                            </div>
                          </div>
                        )}
                        {work.cat_id && (
                          <Button
                            onClick={() => {
                              setSendingID(work.id);
                              handleDone(work.id);
                            }}
                            disabled={sendingID === work.id || !work.id}
                            className="h-[60px]"
                          >
                            {sendingID === work.id ? (
                              <>
                                <Loader2 className="animate-spin" />{" "}
                                Bajarilmoqda
                              </>
                            ) : (
                              <>
                                <Check />
                                Bajarildi (
                                {balance?.find(
                                  (item) => item.tarification?.id === work.id
                                )?.quantity || 0}
                                )
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          <div className="text-center text-lg font-medium">
            Ish boshlash uchun modelni tanlang
          </div>
          {models
            ?.filter((model) => model.tarification_categories?.length > 0)
            ?.map((model, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-md flex cursor-pointer justify-between gap-3 shadow-md border border-gray-200"
                onClick={() => {
                  setSelectedModels((prev) => [
                    ...prev,
                    {
                      model: model,
                      works: [
                        {
                          id: "",
                          name: "",
                          summa: "",
                          second: "",
                          cat_id: "",
                        },
                      ],
                    },
                  ]);
                }}
              >
                <div className="truncate font-medium">
                  {model?.model?.name} - {model?.submodel?.name}
                </div>
                <div className="truncate text-sm text-gray-500">
                  {model.tarification_categories?.length} ta kategoriya
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default Models;
