import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  ShoppingBasket,
  Check,
  Loader2,
  Plus,
  PlusCircle,
  Send,
  Trash2,
  X,
  Play,
} from "lucide-react";
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
import { statuses } from "@/lib/status";
import MarqueeBanner from "@/components/MarqueBanner";
const coinsAudio = new Audio(CoinsAudio);

const Models = () => {
  const { toast } = useToast();

  const [packets, setPackets] = useState([]);
  const [models, setModels] = useState([]);
  const [balance, setBalance] = useState(0);
  const [selectedModels, setSelectedModels] = useState([]);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [sendingID, setSendingID] = useState(null);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [packetDialogOpen, setPacketDialogOpen] = useState(false);
  const [selectedTarifForPacket, setSelectedTarifForPacket] = useState(null);
  const [sendingPacketId, setSendingPacketId] = useState(null);
  const [dialogPacketId, setDialogPacketId] = useState(null);
  const [creatingPacketId, setCreatingPacketId] = useState(null);
  const [deletingTarifPacketId, setDeletingTarifPacketId] = useState(null);
  const [deletingPacketId, setDeletingPacketId] = useState(null);
  const [myWorksDialogOpen, setMyWorksDialogOpen] = useState(false);
  const [myWorks, setMyWorks] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const getVideoLink = async (id) => {
    try {
      setLoadingVideo(true);
      const response = await api.get(`/universalTailor/videos/${id}`);
      return response.data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Video linkni olishda xatolik yuz berdi.",
      });
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleVideoClick = async (id) => {
    try {
      const link = await getVideoLink(id);
      setSelectedVideo(link);
      setShowVideo(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Video linkni olishda xatolik yuz berdi.",
      });
    }
  };

  const getFormattedYesterday = () => {
    const date = new Date();
    const dayOfWeek = date.getDay();

    const daysBack = dayOfWeek === 1 ? 2 : 1;
    date.setDate(date.getDate() - daysBack);

    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${mm}-${dd}-${yyyy}`;
  };

  const handleLoadYesterdayWorks = async () => {
    try {
      const date = getFormattedYesterday();
      const response = await api.get(`/universalTailor/balance?date=${date}`);
      const yesterdayBalance = response.data;

      if (yesterdayBalance.length === 0) {
        toast({
          title: "Diqqat",
          description: "Kechagi ishlar topilmadi.",
        });
        return;
      }

      autoSelectFromBalance(yesterdayBalance, models, packets);
      toast({
        title: "Muvaffaqiyatli",
        description: "Kechagi ishlar yuklandi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Kechagi ishlarni olishda xatolik yuz berdi.",
      });
    }
  };

  const removeTarificationFromSelected = (tarifId) => {
    setSelectedModels((prev) =>
      prev
        .map((model) => {
          const filteredWorks = model.works.filter(
            (work) => work.id !== tarifId,
          );
          if (filteredWorks.length === 0) return null;
          return { ...model, works: filteredWorks };
        })
        .filter(Boolean),
    );
  };

  const getPackets = async () => {
    try {
      const response = await api.get("/universalTailor/packets");
      setPackets(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paketlarni olishda xatolik yuz berdi.",
      });
    }
  };

  const handleLoadMyWorks = async () => {
    setMyWorksDialogOpen(true);
    try {
      const response = await api.get("/universalTailor/myWorks");
      setMyWorks(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Mening ishlarni olishda xatolik yuz berdi.",
      });
    }
  };

  const autoSelectFromBalance = (balanceData, modelsData, packetsData) => {
    const selected = [];

    const packetTarificationIds = packetsData.flatMap((p) =>
      p.tarification_packets_items.map((item) => item.tarification_id),
    );

    balanceData.forEach((entry) => {
      const tarificationId = entry.tarification?.id;

      if (packetTarificationIds.includes(tarificationId)) return;

      const fullModel = modelsData.find((m) => m.order_id === entry.order_id);
      if (!fullModel) return;

      let modelInSelected = selected.find(
        (s) => s.model.order_id === entry.order_id,
      );

      const category = fullModel.tarification_categories?.find((cat) =>
        cat.tarification?.some((t) => t.id === tarificationId),
      );

      const tarification = category?.tarification?.find(
        (t) => t.id === tarificationId,
      );

      if (!tarification || !category) return;

      const workData = {
        id: tarification.id,
        name: tarification.name,
        code: tarification.code,
        summa: tarification.summa,
        second: tarification.second,
        cat_id: category.id,
      };

      if (!modelInSelected) {
        selected.unshift({
          model: fullModel,
          works: [workData],
        });
      } else {
        modelInSelected.works.unshift(workData);
      }
    });

    setSelectedModels(selected);
  };

  const getBalance = async () => {
    try {
      const response = await api.get("/universalTailor/balance");
      const balanceData = response.data;
      setBalance(balanceData);

      setDisplayBalance(
        balanceData?.reduce((total, item) => {
          return total + (Number(item.amount_earned) || 0);
        }, 0),
      );

      // Call auto select
      if (models.length > 0) {
        autoSelectFromBalance(balanceData, models, packets);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Balansni olishda xatolik yuz berdi.",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [modelsRes, packetsRes, balanceRes] = await Promise.all([
          api.get("/universalTailor/models"),
          api.get("/universalTailor/packets"),
          api.get("/universalTailor/balance"),
        ]);

        const modelsData = modelsRes.data || [];
        const packetsData = packetsRes.data || [];
        const balanceData = balanceRes.data || [];

        setModels(modelsData);
        setPackets(packetsData);
        setBalance(balanceData);

        setDisplayBalance(
          balanceData.reduce((total, item) => {
            return total + (Number(item.amount_earned) || 0);
          }, 0),
        );

        // ✅ Call after all 3 are ready
        autoSelectFromBalance(balanceData, modelsData, packetsData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Ma'lumotlarni yuklashda xatolik yuz berdi.",
        });
      }
    };

    loadData();
  }, []);

  const handleDone = async (id) => {
    setSendingID(id);
    try {
      await api.post("/universalTailor/tarificationLog", {
        tarification_id: id,
      });
      await getBalance();
      coinsAudio.currentTime = 0;
      coinsAudio.play();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setSendingID(null);
    }
  };

  const handleAddPacket = async (id) => {
    setCreatingPacketId(id);
    try {
      await api.post("/universalTailor/packets", {
        items: [{ tarification_id: id }],
      });
      await getPackets();
      removeTarificationFromSelected(id);
      setPacketDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paket qo'shishda xatolik yuz berdi.",
      });
    } finally {
      setCreatingPacketId(null);
    }
  };

  const handleAddPacketExisting = async (id) => {
    setDialogPacketId(id);
    try {
      await api.patch(`/universalTailor/packets/${id}`, {
        items: [{ tarification_id: selectedTarifForPacket }],
      });
      await getPackets();
      removeTarificationFromSelected(selectedTarifForPacket);
      setPacketDialogOpen(false); // close dialog
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paket qo'shishda xatolik yuz berdi.",
      });
    } finally {
      setDialogPacketId(null);
    }
  };

  const handleSendPacket = async (id) => {
    setSendingPacketId(id);
    try {
      const packet = packets.find((p) => p.id === id);
      if (!packet) {
        throw new Error("Paket topilmadi.");
      }

      const requests = packet.tarification_packets_items.map((item) =>
        api.post("/universalTailor/tarificationLog", {
          tarification_id: item.tarification_id,
        }),
      );

      await Promise.all(requests);
      coinsAudio.currentTime = 0;
      coinsAudio.play();
      await getBalance();
      await getPackets();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paket yuborishda xatolik yuz berdi.",
      });
    } finally {
      setSendingPacketId(null);
    }
  };

  const handleDeletingtTarifPacketId = async (id) => {
    setDeletingTarifPacketId(id);
    try {
      // Delete the packet item
      await api.delete(`/universalTailor/packets/item/${id}`);

      // ✅ Fetch updated data
      const [updatedPacketsRes, updatedBalanceRes, updatedModelsRes] =
        await Promise.all([
          api.get("/universalTailor/packets"),
          api.get("/universalTailor/balance"),
          api.get("/universalTailor/models"),
        ]);

      const updatedPackets = updatedPacketsRes.data || [];
      const updatedBalance = updatedBalanceRes.data || [];
      const updatedModels = updatedModelsRes.data || [];

      // ✅ Set new states
      setPackets(updatedPackets);
      setBalance(updatedBalance);
      setModels(updatedModels);

      setDisplayBalance(
        updatedBalance.reduce(
          (total, item) => total + (Number(item.amount_earned) || 0),
          0,
        ),
      );

      // ✅ Refresh selected models correctly
      autoSelectFromBalance(updatedBalance, updatedModels, updatedPackets);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paket elementini o‘chirishda xatolik yuz berdi.",
      });
    } finally {
      setDeletingTarifPacketId(null);
    }
  };

  const handleDeletingPacket = async (id) => {
    setDeletingPacketId(id);
    try {
      await api.delete(`/universalTailor/packets/${id}`);
      await getPackets();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Paket yuborishda xatolik yuz berdi.",
      });
    } finally {
      setDeletingPacketId(null);
    }
  };

  return (
    <>
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVideo?.id}</DialogTitle>
            <DialogDescription>{selectedVideo?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            <iframe
              src={selectedVideo?.link}
              width="100%"
              height="600"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={myWorksDialogOpen} onOpenChange={setMyWorksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mening ishlarim</DialogTitle>
            <DialogDescription>Biriktirilgan ishlar</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {Object.entries(
              myWorks?.reduce((acc, work) => {
                const modelName = work.model?.name || "Noma'lum model";
                if (!acc[modelName]) acc[modelName] = [];
                acc[modelName].push(work);
                return acc;
              }, {}),
            ).map(([modelName, works]) => (
              <div key={modelName}>
                <div className="font-bold text-blue-600 border-b border-gray-300 pb-1 mb-2">
                  {modelName}
                </div>
                <div className="flex flex-col gap-2">
                  {works.map((myWork) => {
                    const isInBalance = balance?.some(
                      (b) => b.tarification?.id === myWork.id,
                    );
                    const isInPacket = packets?.some((packet) =>
                      packet.tarification_packets_items?.some(
                        (item) => item.tarification_id === myWork.id,
                      ),
                    );
                    const isInSelected = selectedModels?.some((m) =>
                      m.works?.some((w) => w.id === myWork.id),
                    );

                    const isUsed = isInBalance || isInPacket || isInSelected;

                    return (
                      <div
                        key={myWork.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="truncate font-medium">
                          {myWork.code} - {myWork.name}
                        </div>
                        <Button
                          variant={isUsed ? "secondary" : "outline"}
                          size="sm"
                          disabled={isUsed || sendingID === myWork.id}
                          onClick={async () => {
                            const modelObj = models.find(
                              (m) => m.model?.id === myWork.model.id,
                            );
                            if (!modelObj) return;

                            const category =
                              modelObj.tarification_categories?.find((cat) =>
                                cat.tarification?.some(
                                  (t) => t.id === myWork.id,
                                ),
                              );
                            if (!category) return;

                            const alreadySelected = selectedModels.find(
                              (s) => s.model.id === modelObj.id,
                            );

                            const workData = {
                              id: myWork.id,
                              name: myWork.name,
                              code: myWork.code,
                              summa: myWork.summa,
                              second: myWork.second,
                              cat_id: category.id,
                            };

                            if (alreadySelected) {
                              alreadySelected.works.unshift(workData);
                              setSelectedModels([...selectedModels]);
                            } else {
                              setSelectedModels((prev) => [
                                {
                                  model: modelObj,
                                  works: [workData],
                                },
                                ...prev,
                              ]);
                            }

                            // ✅ Send backend request
                            setSendingID(myWork.id);
                            try {
                              await api.post(
                                "/universalTailor/tarificationLog",
                                {
                                  tarification_id: myWork.id,
                                },
                              );
                              const audio = new Audio("/coins.wav");
                              audio.play();
                              await getBalance(); // refresh balance
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Xatolik!",
                                description:
                                  error.response?.data?.message ||
                                  "Ishni qo'shishda xatolik yuz berdi.",
                              });
                            } finally {
                              setSendingID(null);
                            }
                          }}
                        >
                          {sendingID === myWork.id
                            ? "⏳ Bajarilmoqda"
                            : isUsed
                              ? "✅ Qo'shilgan"
                              : "➕ Qo'shish"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={packetDialogOpen} onOpenChange={setPacketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paketlar</DialogTitle>
            <DialogDescription>Paket tanlang</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
            {packets?.map((packet, index) => (
              <button
                key={index}
                className={`bg-green-50 p-4 text-lg rounded-md flex justify-between items-center gap-3 shadow-md border border-green-500 transition-all duration-300 ${
                  dialogPacketId === packet.id
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                }`}
                onClick={() => handleAddPacketExisting(packet.id)}
                disabled={dialogPacketId === packet.id}
              >
                <div className="truncate font-medium flex-1">
                  {packet.tarification_packets_items
                    ?.map((item) => item.tarification?.code)
                    .join(", ")}
                </div>

                {dialogPacketId === packet.id && (
                  <Loader2 className="animate-spin w-5 h-5 text-green-600" />
                )}
              </button>
            ))}
            <Button
              variant="link"
              className="mt-4 w-fit"
              onClick={() => {
                handleAddPacket(selectedTarifForPacket);
              }}
              disabled={creatingPacketId === selectedTarifForPacket}
            >
              {creatingPacketId === selectedTarifForPacket ? (
                <Loader2 className="animate-spin text-green-600" />
              ) : (
                "Yangi paketga qo'shish"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  !selectedModels.some((s) => s.model.id === model.id) &&
                  model.tarification_categories?.length > 0,
              )
              ?.map((model, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-md flex cursor-pointer justify-between gap-3 shadow-md border border-gray-200"
                  onClick={() => {
                    setSelectedModels((prev) => [
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
                      ...prev,
                    ]);
                    setModelsOpen(false);
                  }}
                >
                  <div className="truncate font-medium">
                    {model.order?.name} - {model.submodel?.name}
                  </div>
                  <div
                    className={`truncate text-xs px-2 py-1 rounded-full text-white ${
                      statuses[model.status]?.color
                    }`}
                  >
                    {statuses[model.status]?.text}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <MarqueeBanner
        texts={[
          "Qarg‘aydigan ish tikmang — baraka topmaysiz.",
          "2026-yil, Sifatni yuksaltirish yili!",
        ]}
        interval={5000}
      />
      <div className="flex flex-col items-center gap-1">
        <div>{localStorage.getItem("name")}</div>
        <div className="text-2xl font-bold text-yellow-500">
          {parseInt(displayBalance)?.toLocaleString("ru-RU")} so'm
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleLoadYesterdayWorks}
            className="mt-2 bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
          >
            Kechagi ishlarni qilish
          </Button>
          <Button
            onClick={handleLoadMyWorks}
            className="mt-2 bg-green-500 text-white hover:bg-green-600 hover:text-white"
          >
            Mening ishlarim
          </Button>
        </div>
      </div>

      {packets.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {packets.map((packet, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-yellow-100 border border-yellow-500 shadow-sm"
            >
              <div className="flex items-center gap-3 justify-between flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {packet.tarification_packets_items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white border border-gray-300 p-2 rounded-lg shadow-sm"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-800">
                          {item.tarification?.code}
                        </span>
                        <span className="text-xs text-gray-500">
                          {balance?.find(
                            (b) => b.tarification?.id === item.tarification?.id,
                          )?.quantity || "0"}
                        </span>
                      </div>
                      {deletingTarifPacketId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X
                          className="cursor-pointer text-gray-500 hover:text-red-500 transition"
                          size={14}
                          onClick={() => {
                            handleDeletingtTarifPacketId(item.id);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="w-full mt-4 h-[60px]"
                  disabled={sendingPacketId === packet.id}
                  onClick={() => {
                    setSendingPacketId(packet.id);
                    handleSendPacket(packet.id);
                  }}
                >
                  {sendingPacketId === packet.id ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Bajarilmoqda
                    </>
                  ) : (
                    <>
                      <Send />
                      Bajarish
                    </>
                  )}
                </Button>
                <Button
                  className="w-fit mt-4 h-[60px]"
                  variant="outline"
                  disabled={deletingPacketId === packet.id}
                  onClick={() => {
                    setDeletingPacketId(packet.id);
                    handleDeletingPacket(packet.id);
                  }}
                >
                  {deletingPacketId === packet.id ? (
                    <>
                      <Loader2 className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <Trash2 />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedModels.length > 0 ? (
        <>
          <div className="flex gap-2 w-full flex-wrap mt-4 items-center">
            <div>Tanlangan modellar: </div>
            {selectedModels.map((model, index) => (
              <div
                key={index}
                className="text-sm rounded-sm px-2 py-1 bg-gray-200 flex items-center gap-2"
              >
                {model.model?.model?.name} - {model.model?.submodel?.name}
                <X
                  className="cursor-pointer"
                  size={14}
                  onClick={() => {
                    setSelectedModels((prev) =>
                      prev.filter((item) => item.model.id !== model.model.id),
                    );
                  }}
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModelsOpen(true)}
              className="bg-green-500 text-white hover:bg-green-600 hover:text-white"
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
                      const lastCatId = model.works[0]?.cat_id || "";

                      model.works.unshift({
                        id: "",
                        name: "",
                        summa: "",
                        second: "",
                        cat_id: lastCatId,
                      });

                      setSelectedModels((prev) => [...prev]);
                    }}
                    className="bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white"
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
                      <div className="grid grid-cols-2 gap-2 mt-10">
                        <ShoppingBasket
                          onClick={() => {
                            if (!work.id) {
                              toast({
                                variant: "destructive",
                                title: "Diqqat!",
                                description: "Avval ishni tanlang.",
                                duration: 1200,
                              });
                              return;
                            }
                            if (
                              packets.some((packet) =>
                                packet.tarification_packets_items.some(
                                  (item) => item.tarification_id === work.id,
                                ),
                              )
                            ) {
                              toast({
                                variant: "destructive",
                                title: "Diqqat!",
                                description:
                                  "Bu ishni allaqachon paketga qo'shilgan.",
                                duration: 1200,
                              });
                              return;
                            }
                            if (packets.length === 0) {
                              handleAddPacket(work.id);
                            } else {
                              setSelectedTarifForPacket(work.id);
                              setPacketDialogOpen(true);
                            }
                          }}
                          size={30}
                          className="absolute top-2 left-2 cursor-pointer text-red-500"
                        />
                        <X
                          onClick={() => {
                            model.works.splice(index, 1);
                            setSelectedModels((prev) => [...prev]);

                            if (model.works.length === 0) {
                              setSelectedModels((prev) =>
                                prev.filter(
                                  (item) => item.model.id !== model.model.id,
                                ),
                              );
                            }
                          }}
                          size={30}
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
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            {model.model?.tarification_categories?.map(
                              (category, index) => (
                                <SelectItem key={index} value={category.id}>
                                  <div className="break-words whitespace-normal max-w-[250px] text-left">
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ),
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
                                      (category) => category.id === work.cat_id,
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
                                model.works[index].video_id =
                                  selectedTarification?.video_id || "";
                                setSelectedModels((prev) => [...prev]);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Ishni tanlang">
                                  {work.code || ""}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-[250px] overflow-y-auto">
                                {model.model?.tarification_categories
                                  ?.find(
                                    (category) => category.id === work.cat_id,
                                  )
                                  ?.tarification?.filter(
                                    (tarification) =>
                                      // not already selected in this model
                                      !model.works.some(
                                        (w) =>
                                          w.id === tarification.id &&
                                          w !== work,
                                      ) &&
                                      // not already included in any packet
                                      !packets.some((packet) =>
                                        packet.tarification_packets_items.some(
                                          (item) =>
                                            item.tarification_id ===
                                            tarification.id,
                                        ),
                                      ),
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
                              {parseInt(work.summa)} so'm /{" "}
                              {parseFloat(work.second).toFixed(2)} sekund
                            </div>
                          </div>
                        )}
                        {work.video_id && (
                          <Button
                            onClick={() => {
                              handleVideoClick(work.video_id);
                            }}
                            disabled={loadingVideo}
                          >
                            {loadingVideo ? (
                              <>
                                <Loader2 className="animate-spin" />
                                Yuklanmoqda...
                              </>
                            ) : (
                              <>
                                <Play />
                                Video
                              </>
                            )}
                          </Button>
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
                                  (item) => item.tarification?.id === work.id,
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
          {models.length === 0 && (
            <div className="text-center text-gray-600">
              Bu guruhga tegishli modellar topilmadi
            </div>
          )}
          {models
            ?.filter((model) => model.tarification_categories?.length > 0)
            ?.map((model, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-md flex cursor-pointer justify-between gap-3 shadow-md border border-gray-200"
                onClick={() => {
                  setSelectedModels((prev) => [
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
                    ...prev,
                  ]);
                }}
              >
                <div className="truncate font-medium">
                  {model?.order?.name} - {model?.submodel?.name}
                </div>
                <div
                  className={`truncate text-xs text-white p-2 rounded-full ${
                    statuses[model.status]?.color
                  }`}
                >
                  {statuses[model.status]?.text}
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default Models;
