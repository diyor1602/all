"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, animate } from "framer-motion";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Check,
  CirclePlus,
  Loader2,
  X,
  ChevronsUpDown,
  Plus,
  Send,
  Package2,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Coin from "/coin.png";

const Orders = () => {
  const { toast } = useToast();
  const [displayBalance, setDisplayBalance] = useState(0);
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [modelInputs, setModelInputs] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [coins, setCoins] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [openComboboxes, setOpenComboboxes] = useState({});
  const [showModelSelection, setShowModelSelection] = useState(false);

  // Batch selection states
  const [batchItems, setBatchItems] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [longPressStates, setLongPressStates] = useState({});

  const balanceRef = useRef(null);
  const longPressTimers = useRef({});

  const animateBalance = (fromValue, toValue, isInitial = false) => {
    const from = Number(fromValue) || 0;
    const to = Number(toValue) || 0;
    const difference = Math.abs(to - from);
    let duration;
    if (isInitial) {
      duration = Math.min(5, Math.max(1.5, to / 10000));
    } else {
      duration = Math.min(2, Math.max(0.8, difference / 5000));
    }
    animate(from, to, {
      type: "spring",
      bounce: 0.2,
      duration: duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayBalance(Math.floor(Number(latest)));
      },
    });
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get("/tailor/balance");
      let newBalance = 0;
      let balanceData = [];
      if (Array.isArray(response.data)) {
        balanceData = response.data;
        newBalance = balanceData.reduce((total, item) => {
          return total + (Number(item.amount_earned) || 0);
        }, 0);
        if (isInitialLoad && balanceData.length > 0 && models.length > 0) {
          const modelGroups = {};
          const modelsToSelect = [];
          balanceData.forEach((item) => {
            const modelId = item.model?.id;
            if (modelId) {
              const modelData = models.find((m) => m.model?.id === modelId);
              if (modelData) {
                if (!modelsToSelect.find((m) => m.id === modelData.id)) {
                  modelsToSelect.push(modelData);
                }
                if (!modelGroups[modelData.id]) {
                  modelGroups[modelData.id] = [];
                }
                const matchingTarif = modelData.tarifications?.find(
                  (t) => t.id === item.tarification?.id
                );
                if (matchingTarif) {
                  const tarifWithLogs = {
                    ...matchingTarif,
                    tarification_logs: [{ quantity: item.quantity || 0 }],
                  };
                  modelGroups[modelData.id].push({
                    code: matchingTarif.code || "",
                    tarif: tarifWithLogs,
                    searchResults: [],
                    selectedTarif: matchingTarif.id,
                    tarification_id: matchingTarif.id,
                    quantity: item.quantity || 0,
                  });
                }
              }
            }
          });
          if (modelsToSelect.length > 0) {
            setSelectedModels(modelsToSelect);
            setModelInputs(modelGroups);
          }
        }
      } else {
        newBalance = Number(response.data) || 0;
      }
      if (isInitialLoad) {
        animateBalance(0, newBalance, true);
        setIsInitialLoad(false);
      } else {
        animateBalance(Number(displayBalance) || 0, newBalance, false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Balansni olishda xatolik yuz berdi.",
      });
    }
  };

  useEffect(() => {
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
    getModels();
  }, []);

  useEffect(() => {
    if (models.length > 0) {
      fetchBalance();
    }
  }, [models]);

  const playCoinSound = () => {
    const audio = new Audio("/coins.wav");
    audio.volume = 1;
    audio.play();
  };

  // Long press handlers
  const handleLongPressStart = useCallback(
    (modelId, inputIndex) => {
      const itemKey = `${modelId}-${inputIndex}`;
      const input = modelInputs[modelId]?.[inputIndex];

      if (!input?.tarif || loadingStates[itemKey]) return;

      // Check if already in batch
      if (batchItems.find((item) => item.key === itemKey)) return;

      setLongPressStates((prev) => ({
        ...prev,
        [itemKey]: { progress: 0, active: true },
      }));

      let progress = 0;
      longPressTimers.current[itemKey] = setInterval(() => {
        progress += 5;
        setLongPressStates((prev) => ({
          ...prev,
          [itemKey]: { progress, active: true },
        }));

        if (progress >= 100) {
          clearInterval(longPressTimers.current[itemKey]);
          handleAddToBatch(modelId, inputIndex);
          setLongPressStates((prev) => ({
            ...prev,
            [itemKey]: { progress: 0, active: false },
          }));
        }
      }, 100);
    },
    [modelInputs, loadingStates, batchItems]
  );

  const handleLongPressEnd = useCallback((modelId, inputIndex) => {
    const itemKey = `${modelId}-${inputIndex}`;
    if (longPressTimers.current[itemKey]) {
      clearInterval(longPressTimers.current[itemKey]);
      delete longPressTimers.current[itemKey];
    }
    setLongPressStates((prev) => ({
      ...prev,
      [itemKey]: { progress: 0, active: false },
    }));
  }, []);

  const handleAddToBatch = (modelId, inputIndex) => {
    const itemKey = `${modelId}-${inputIndex}`;
    const input = modelInputs[modelId]?.[inputIndex];
    const model = selectedModels.find((m) => m.id === modelId);

    if (!input?.tarif || !model) return;

    const newBatchItem = {
      key: itemKey,
      modelId,
      inputIndex,
      modelName: `${model.model?.name} - ${model.submodel?.name}`,
      tarif: input.tarif,
      id: Math.random().toString(36).substring(2, 9),
    };

    setBatchItems((prev) => [...prev, newBatchItem]);

    // Visual feedback
    toast({
      title: "Paketga qo'shildi!",
      description: `${input.tarif.code} - ${input.tarif.name}`,
      duration: 2000,
    });
  };

  const removeBatchItem = (itemKey) => {
    setBatchItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const handleBatchSubmit = async () => {
    if (batchItems.length === 0) return;

    setBatchLoading(true);

    try {
      const batchRequests = batchItems.map((item) =>
        api.post("/tailor/tarificationLog", {
          tarification_id: item.tarif.id,
        })
      );

      const responses = await Promise.allSettled(batchRequests);

      let successCount = 0;
      let failureCount = 0;
      const updatedModelInputs = { ...modelInputs };

      responses.forEach((result, index) => {
        const item = batchItems[index];
        const { modelId, inputIndex } = item;

        if (result.status === "fulfilled") {
          successCount++;
          if (result.value.data?.log && updatedModelInputs[modelId]) {
            updatedModelInputs[modelId][inputIndex].tarif = {
              ...updatedModelInputs[modelId][inputIndex].tarif,
              tarification_logs: [
                {
                  ...(updatedModelInputs[modelId][inputIndex].tarif
                    ?.tarification_logs?.[0] || {}),
                  quantity: result.value.data.log.quantity,
                },
              ],
            };
            updatedModelInputs[modelId][inputIndex].code = "";
            updatedModelInputs[modelId][inputIndex].searchResults = [];
          }
        } else {
          failureCount++;
        }
      });

      setModelInputs(updatedModelInputs);

      // Coin animation from batch container
      if (successCount > 0) {
        playCoinSound();
        const batchContainer = document.getElementById("batch-container");
        const coinStart = batchContainer?.getBoundingClientRect();
        const coinEnd = balanceRef.current?.getBoundingClientRect();

        if (coinStart && coinEnd) {
          const newCoins = Array.from({ length: successCount * 4 }).map(() => {
            const id = Math.random();
            return {
              id,
              startX: coinStart.left + Math.random() * 100 - 50,
              startY: coinStart.top + Math.random() * 30 - 15,
              endX: coinEnd.left + Math.random() * 40 - 20,
              endY: coinEnd.top + Math.random() * 20 - 10,
              delay: Math.random() * 0.8,
            };
          });
          setCoins((prev) => [...prev, ...newCoins]);
        }
      }

      await fetchBalance();

      // Show results
      if (successCount > 0 && failureCount > 0) {
        toast({
          title: "Qisman muvaffaqiyat",
          description: `${successCount} ta tarif bajarildi, ${failureCount} ta xatolik.`,
        });
      } else if (successCount === 0 && failureCount > 0) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description: "Hech qanday tarif bajarilmadi.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Batch ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSubmit = async (tarifId, modelId, inputIndex) => {
    const loadingKey = `${modelId}-${inputIndex}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await api.post("/tailor/tarificationLog", {
        tarification_id: tarifId,
      });
      const updatedModelInputs = { ...modelInputs };
      if (response.data?.log && updatedModelInputs[modelId]) {
        updatedModelInputs[modelId][inputIndex].tarif = {
          ...updatedModelInputs[modelId][inputIndex].tarif,
          tarification_logs: [
            {
              ...(updatedModelInputs[modelId][inputIndex].tarif
                ?.tarification_logs?.[0] || {}),
              quantity: response.data.log.quantity,
            },
          ],
        };
      }
      const button = document.getElementById(
        `submit-btn-${modelId}-${inputIndex}`
      );
      const coinStart = button?.getBoundingClientRect();
      const coinEnd = balanceRef.current?.getBoundingClientRect();
      if (coinStart && coinEnd) {
        playCoinSound();
        const newCoins = Array.from({ length: 5 }).map(() => {
          const id = Math.random();
          return {
            id,
            startX: coinStart.left + Math.random() * 30 - 15,
            startY: coinStart.top + Math.random() * 10 - 5,
            endX: coinEnd.left + Math.random() * 20 - 10,
            endY: coinEnd.top + Math.random() * 10 - 5,
            delay: Math.random() * 0.2,
          };
        });
        setCoins((prev) => [...prev, ...newCoins]);
      }
      await fetchBalance();
      updatedModelInputs[modelId][inputIndex].code = "";
      updatedModelInputs[modelId][inputIndex].searchResults = [];
      setModelInputs(updatedModelInputs);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleTarifSelectFromCombobox = (modelId, inputIndex, tarification) => {
    const updatedModelInputs = { ...modelInputs };
    if (updatedModelInputs[modelId]) {
      updatedModelInputs[modelId][inputIndex].tarif = tarification;
      updatedModelInputs[modelId][inputIndex].selectedTarif = tarification.id;
      updatedModelInputs[modelId][inputIndex].code = tarification.code;
      setModelInputs(updatedModelInputs);
    }
    setOpenComboboxes((prev) => ({
      ...prev,
      [`${modelId}-${inputIndex}`]: false,
    }));
  };

  const addNewInput = (modelId) => {
    const updatedModelInputs = { ...modelInputs };
    if (!updatedModelInputs[modelId]) {
      updatedModelInputs[modelId] = [];
    }
    updatedModelInputs[modelId].push({
      code: "",
      tarif: null,
      searchResults: [],
      selectedTarif: null,
    });
    setModelInputs(updatedModelInputs);
  };

  const removeInput = (modelId, inputIndex) => {
    const itemKey = `${modelId}-${inputIndex}`;

    // Remove from batch if exists
    setBatchItems((prev) => prev.filter((item) => item.key !== itemKey));

    // Clear long press timer
    if (longPressTimers.current[itemKey]) {
      clearInterval(longPressTimers.current[itemKey]);
      delete longPressTimers.current[itemKey];
    }

    const updatedModelInputs = { ...modelInputs };
    if (updatedModelInputs[modelId]) {
      updatedModelInputs[modelId].splice(inputIndex, 1);
      if (updatedModelInputs[modelId].length === 0) {
        delete updatedModelInputs[modelId];
        setSelectedModels((prev) =>
          prev.filter((model) => model.id !== modelId)
        );
      }
      setModelInputs(updatedModelInputs);
    }
  };

  const addModel = (model) => {
    if (!selectedModels.find((m) => m.id === model.id)) {
      setSelectedModels((prev) => [...prev, model]);
      const updatedModelInputs = { ...modelInputs };
      updatedModelInputs[model.id] = [
        {
          code: "",
          tarif: null,
          searchResults: [],
          selectedTarif: null,
        },
      ];
      setModelInputs(updatedModelInputs);
    }
    setShowModelSelection(false);
  };

  const removeModel = (modelId) => {
    // Remove all items of this model from batch
    setBatchItems((prev) => prev.filter((item) => item.modelId !== modelId));

    setSelectedModels((prev) => prev.filter((model) => model.id !== modelId));
    const updatedModelInputs = { ...modelInputs };
    delete updatedModelInputs[modelId];
    setModelInputs(updatedModelInputs);
  };

  const handleCoinAnimationComplete = (id) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== id));
  };

  // If no models are selected, show initial model selection
  if (selectedModels.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-col">
          <div className="flex items-center gap-2">
            {localStorage.getItem("imgUrl") &&
              localStorage.getItem("imgUrl") !== "null" && (
                <img
                  className="w-20 h-20 rounded-full object-cover"
                  src={localStorage.getItem("imgUrl") || "/placeholder.svg"}
                  alt="User"
                />
              )}
            {localStorage.getItem("name")}
          </div>
          <div
            ref={balanceRef}
            className="text-yellow-500 font-bold text-2xl transition-all"
          >
            {displayBalance.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            so'm
          </div>
        </div>
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Ish boshlash uchun model tanlang
          </h2>
          <p className="text-sm text-gray-500">
            Paketlash uchun tarifni 2 soniya bosib turing
          </p>
        </div>
        <div className="grid gap-3">
          {models
            ?.sort((a, b) => a.model?.name.localeCompare(b.model?.name))
            ?.map((modelItem) => (
              <div
                key={modelItem.id}
                onClick={() => addModel(modelItem)}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-white"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">
                      {modelItem.model?.name} - {modelItem.submodel?.name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {modelItem.tarifications?.length || 0} ta tarif
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center gap-2 flex-col">
        <div className="flex items-center gap-2">
          {localStorage.getItem("imgUrl") &&
            localStorage.getItem("imgUrl") !== "null" && (
              <img
                className="w-20 h-20 rounded-full object-cover"
                src={localStorage.getItem("imgUrl") || "/placeholder.svg"}
                alt="User"
              />
            )}
          {localStorage.getItem("name")}
        </div>
        <div
          ref={balanceRef}
          className="text-yellow-500 font-bold text-2xl transition-all"
        >
          {displayBalance.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          so'm
        </div>
      </div>

      {/* Selected Models Header */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Tanlangan modellar:</span>
          {selectedModels.map((model) => (
            <Badge
              key={model.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {model.model?.name} - {model.submodel?.name}
              <button
                onClick={() => removeModel(model.id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModelSelection(true)}
            className="h-6"
          >
            <Plus className="w-3 h-3 mr-1" />
            Model qo'shish
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          💡 Paketlash uchun tarifni 2 soniya bosib turing
        </div>
      </div>

      {/* Batch Container - Minimal and Integrated */}
      {batchItems.length > 0 && (
        <div id="batch-container" className="border rounded-lg p-3 bg-gray-50">
          <div className="flex md:items-center justify-between mb-2 flex-col md:flex-row ">
            <div className="flex items-center gap-2">
              <Package2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Paket ({batchItems.length})
              </span>
            </div>
            <div className="flex gap-2 w-full justify-center md:justify-end md:w-auto my-5 md:my-0">
              <Button
                onClick={handleBatchSubmit}
                disabled={batchLoading}
                size="sm"
                className="md:h-7 h-20 w-full md:w-auto text-xs"
              >
                {batchLoading ? (
                  <>
                    <Loader2 className="animate-spin w-3 h-3 mr-1" />
                    Bajarilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Bajarish
                  </>
                )}
              </Button>
              <Button
                onClick={() => setBatchItems([])}
                variant="outline"
                size="icon"
                className="md:h-7 h-20 w-20 text-xs"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {batchItems.map((item) => {
              // Get current quantity from live modelInputs
              const currentInput = modelInputs[item.modelId]?.[item.inputIndex];
              const currentQuantity =
                currentInput?.tarif?.tarification_logs?.[0]?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border rounded px-2 py-1 text-xs flex items-center gap-1 w-20"
                >
                  <div className="flex flex-col items-center w-full">
                    <span className="text-gray-600 font-medium">
                      {item.tarif.code}
                    </span>
                    <span className="text-gray-400">({currentQuantity})</span>
                  </div>
                  <button
                    onClick={() => removeBatchItem(item.key)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Selection Modal */}
      {showModelSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Model qo'shish</h3>
              <button
                onClick={() => setShowModelSelection(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-3">
              {models
                .filter(
                  (modelItem) =>
                    !selectedModels.find((m) => m.id === modelItem.id)
                )
                .sort((a, b) => a.model?.name.localeCompare(b.model?.name))
                .map((modelItem) => (
                  <div
                    key={modelItem.id}
                    onClick={() => addModel(modelItem)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">
                          {modelItem.model?.name} - {modelItem.submodel?.name}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {modelItem.tarifications?.length || 0} ta tarif
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Model-specific Input Groups */}
      {selectedModels.map((model) => {
        const visibleInputs = (modelInputs[model.id] || []).filter(
          (input, inputIndex) => {
            const itemKey = `${model.id}-${inputIndex}`;
            return !batchItems.find((item) => item.key === itemKey);
          }
        );

        return (
          <div
            key={model.id}
            className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/30"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {model.model?.name} - {model.submodel?.name}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNewInput(model.id)}
              >
                <CirclePlus className="w-4 h-4 mr-1" />
                Ish qo'shish
              </Button>
            </div>
            <div className="space-y-3">
              {visibleInputs.length === 0 &&
                (modelInputs[model.id] || []).length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Barcha tariflar paketda
                  </div>
                )}
              {(modelInputs[model.id] || []).map((input, inputIndex) => {
                const tarif = input.tarif;
                const comboboxKey = `${model.id}-${inputIndex}`;
                const itemKey = `${model.id}-${inputIndex}`;
                const longPressState = longPressStates[itemKey];
                const isInBatch = batchItems.find(
                  (item) => item.key === itemKey
                );

                // Hide the item if it's in batch
                if (isInBatch) {
                  return null;
                }

                return (
                  <div
                    key={inputIndex}
                    className={cn(
                      "border rounded-lg p-3 bg-white shadow-sm relative transition-all",
                      longPressState?.active && "ring-2 ring-blue-400"
                    )}
                  >
                    {/* Long press progress indicator */}
                    {longPressState?.active && (
                      <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-200/50 transition-all duration-100 ease-out"
                          style={{ width: `${longPressState.progress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-row-reverse mb-3">
                      <Button
                        onClick={() => removeInput(model.id, inputIndex)}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400 transition-all z-10"
                        title="O'chirish"
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      <div className="flex gap-2 items-center relative z-10">
                        <Popover
                          open={openComboboxes[comboboxKey] || false}
                          onOpenChange={(open) =>
                            setOpenComboboxes((prev) => ({
                              ...prev,
                              [comboboxKey]: open,
                            }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={
                                openComboboxes[comboboxKey] || false
                              }
                              className="w-fit max-w-[300px] justify-between bg-transparent truncate"
                            >
                              {input.tarif
                                ? `${input.tarif.code}`
                                : "Tarif tanlang..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit max-w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Tarif qidiring..." />
                              <CommandList>
                                <CommandEmpty>Tarif topilmadi.</CommandEmpty>
                                <CommandGroup>
                                  {model.tarifications?.map((tarification) => (
                                    <CommandItem
                                      key={tarification.id}
                                      value={`${tarification.code} ${tarification.name}`}
                                      onSelect={() =>
                                        handleTarifSelectFromCombobox(
                                          model.id,
                                          inputIndex,
                                          tarification
                                        )
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          input.selectedTarif ===
                                            tarification.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <div className="font-medium">
                                          {tarification.code} -{" "}
                                          {tarification.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {Number.parseFloat(
                                            tarification.summa
                                          )?.toLocaleString("ru-RU", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}{" "}
                                          so'm / {tarification.second} sekund
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {input.tarif && (
                      <div
                        className="border rounded-lg p-3 bg-gray-50 flex justify-between relative z-10 cursor-pointer select-none"
                        onMouseDown={() =>
                          handleLongPressStart(model.id, inputIndex)
                        }
                        onMouseUp={() =>
                          handleLongPressEnd(model.id, inputIndex)
                        }
                        onMouseLeave={() =>
                          handleLongPressEnd(model.id, inputIndex)
                        }
                        onTouchStart={() =>
                          handleLongPressStart(model.id, inputIndex)
                        }
                        onTouchEnd={() =>
                          handleLongPressEnd(model.id, inputIndex)
                        }
                      >
                        <div className="flex flex-col">
                          <div className="font-semibold">
                            {tarif.code} / {tarif.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Number.parseFloat(tarif.summa)?.toLocaleString(
                              "ru-RU",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            so'm / {tarif.second} sekund
                          </div>
                          {longPressState?.active && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Paketlash uchun bosib turing...{" "}
                              {Math.floor(longPressState.progress / 5)}/20
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          {!isInBatch && (
                            <Button
                              id={`submit-btn-${model.id}-${inputIndex}`}
                              className="h-full flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmit(tarif.id, model.id, inputIndex);
                              }}
                              disabled={
                                loadingStates[`${model.id}-${inputIndex}`]
                              }
                            >
                              {loadingStates[`${model.id}-${inputIndex}`] ? (
                                <>
                                  <Loader2 className="animate-spin" />
                                  Qo'shilmoqda...
                                </>
                              ) : (
                                <>
                                  <Check />
                                  Bajarildi (
                                  {tarif.tarification_logs?.[0]?.quantity || 0})
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Coin Animation Portal */}
      {createPortal(
        <AnimatePresence>
          {coins.map((coin) => (
            <motion.img
              key={coin.id}
              src={Coin}
              initial={{
                position: "fixed",
                left: coin.startX,
                top: coin.startY,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                left: coin.endX,
                top: coin.endY,
                opacity: 0,
                scale: 0.5,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                delay: coin.delay,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => handleCoinAnimationComplete(coin.id)}
              className="w-4 h-4 z-50 pointer-events-none"
              alt="coin"
            />
          ))}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Orders;
