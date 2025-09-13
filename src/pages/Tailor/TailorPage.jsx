import { useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, CirclePlus, Loader2, X } from "lucide-react";
import { animate } from "framer-motion";
import CoinsAudio from "/coins.wav";
import MarqueeBanner from "@/components/MarqueBanner";
const coinsAudio = new Audio(CoinsAudio);

const TailorPage = () => {
  const { toast } = useToast();
  const [displayBalance, setDisplayBalance] = useState(0);
  const [inputs, setInputs] = useState([
    { code: "", tarif: null, searchResults: [], selectedTarif: null },
  ]);
  const [loadingStates, setLoadingStates] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const balanceRef = useRef(null);

  const animateBalance = (fromValue, toValue, isInitial = false) => {
    // Ensure both values are numbers
    const from = Number(fromValue) || 0;
    const to = Number(toValue) || 0;
    const difference = Math.abs(to - from);

    // Calculate duration based on difference and whether it's initial load
    let duration;
    if (isInitial) {
      // For initial load, use up to 5 seconds based on the value
      duration = Math.min(5, Math.max(1.5, to / 10000)); // Adjust divisor as needed
    } else {
      // For updates, shorter duration based on difference
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

      // If response.data is an array, calculate total balance from all items
      if (Array.isArray(response.data)) {
        balanceData = response.data;
        newBalance = balanceData.reduce((total, item) => {
          return total + (Number(item.amount_earned) || 0);
        }, 0);

        // Only auto-populate inputs on initial load and if we have balance data
        if (isInitialLoad && balanceData.length > 0) {
          const sortedData = balanceData.sort(
            (a, b) => a.model.id - b.model.id
          );

          const newInputs = sortedData.map((item) => {
            const tarif = item.tarification
              ? {
                  ...item.tarification,
                  tarification_logs: [
                    {
                      quantity: item.quantity || 0,
                    },
                  ],
                }
              : null;

            return {
              code: tarif?.code || "",
              tarif: tarif,
              searchResults: [],
              selectedTarif: tarif?.id || null,
              tarification_id: tarif?.id || null,
              quantity: item.quantity || 0,
            };
          });

          setInputs(newInputs);
        }
      } else {
        // Fallback to direct number if response is not an array
        newBalance = Number(response.data) || 0;
      }

      if (isInitialLoad) {
        // On initial load, animate from 0 to balance
        animateBalance(0, newBalance, true);
        setIsInitialLoad(false);
      } else {
        // On updates, animate from current display balance to new balance
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
    fetchBalance();
  }, []);

  const getTarif = async (code, index) => {
    if (!code || code.length < 2) return;

    try {
      setLoadingStates((prev) => ({ ...prev, [`search-${index}`]: true }));

      const response = await api.get("/tailor/tarifications/search", {
        params: { code },
      });

      const updatedInputs = [...inputs];
      if (Array.isArray(response.data) && response.data.length > 0) {
        updatedInputs[index].searchResults = response.data;
        // Auto-select the first result if there's only one
        if (response.data.length === 1) {
          updatedInputs[index].tarif = response.data[0];
          updatedInputs[index].selectedTarif = response.data[0].id;
          updatedInputs[index].code = response.data[0].code; // Update code to match the found tarif
        } else {
          updatedInputs[index].tarif = null;
          updatedInputs[index].selectedTarif = null;
        }
      } else {
        updatedInputs[index].searchResults = [];
        updatedInputs[index].tarif = null;
        updatedInputs[index].selectedTarif = null;
        if (code.length >= 2) {
          // Only show error if user actually tried to search
          toast({
            variant: "destructive",
            title: "Xatolik!",
            description: `"${code}" kodi bo'yicha tarif topilmadi.`,
          });
        }
      }
      setInputs(updatedInputs);
    } catch (error) {
      const updatedInputs = [...inputs];
      updatedInputs[index].searchResults = [];
      updatedInputs[index].tarif = null;
      updatedInputs[index].selectedTarif = null;
      setInputs(updatedInputs);

      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message || "Tarif topishda xatolik yuz berdi.",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`search-${index}`]: false }));
    }
  };

  const playCoinSound = () => {
    coinsAudio.currentTime = 0;
    coinsAudio.play();
  };

  const handleSubmit = async (tarifId, index) => {
    setLoadingStates((prev) => ({ ...prev, [index]: true }));
    try {
      const response = await api.post("/tailor/tarificationLog", {
        tarification_id: tarifId,
      });
      // Update the tarif with the new quantity from the response
      const updatedInputs = [...inputs];
      if (response.data?.log) {
        updatedInputs[index].tarif = {
          ...updatedInputs[index].tarif,
          tarification_logs: [
            {
              ...(updatedInputs[index].tarif?.tarification_logs?.[0] || {}),
              quantity: response.data.log.quantity,
            },
          ],
        };
      }
      const button = document.getElementById(`submit-btn-${index}`);
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
      }

      // Instead of calling getTarif again, just update the balance
      await fetchBalance();

      // Clear the input field but keep the selected tarif
      updatedInputs[index].code = "";
      updatedInputs[index].searchResults = [];
      setInputs(updatedInputs);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleInputChange = (index, value) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].code = value;

    // Only clear tarif if the input is being cleared or changed
    if (!value) {
      updatedInputs[index].tarif = null;
      updatedInputs[index].searchResults = [];
      updatedInputs[index].selectedTarif = null;
    }

    setInputs(updatedInputs);

    // Auto-search when code is 2 or more characters
    if (value && value.length >= 2) {
      getTarif(value, index);
    }
  };

  const addNewInput = () => {
    setInputs([
      ...inputs,
      { code: "", tarif: null, searchResults: [], selectedTarif: null },
    ]);
  };

  const handleTarifSelect = (index, tarif) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].tarif = tarif;
    updatedInputs[index].selectedTarif = tarif.id;
    setInputs(updatedInputs);
  };

  const removeInput = (index) => {
    const updated = [...inputs];
    updated.splice(index, 1);
    setInputs(updated);
  };

  return (
    <div className="flex flex-col gap-4 relative overflow-hidden">
      <MarqueeBanner text="Diqqat! Ishga e'tiborli bo'ling!" />
      <div className="flex items-center gap-2 flex-col">
        <div className="flex items-center gap-2">
          {localStorage.getItem("imgUrl") &&
            localStorage.getItem("imgUrl") !== "null" && (
              <img
                className="w-20 h-20 rounded-full object-cover"
                src={localStorage.getItem("imgUrl")}
                alt="User"
              />
            )}

          {localStorage.getItem("name")}
        </div>
        <div
          ref={balanceRef}
          className="text-yellow-500 font-bold text-2xl transition-all"
        >
          {displayBalance.toLocaleString()} so'm
        </div>
      </div>
      {inputs.map((input, index) => {
        const tarif = input.tarif;
        return (
          <div
            key={index}
            className="border p-4 rounded-xl shadow-sm bg-white space-y-3 relative"
          >
            <button
              onClick={() => removeInput(index)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-all"
              title="O'chirish"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Tarif kodi (masalan: A55)"
                value={input.code}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="secondary"
                onClick={() => getTarif(input.code, index)}
                disabled={!input.code}
                className="whitespace-nowrap"
              >
                {loadingStates[`search-${index}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Qidirish"
                )}
              </Button>
            </div>
            {input.searchResults.length > 0 && !input.tarif && (
              <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                <div className="font-medium text-sm text-gray-600">
                  Topilgan tariflar:
                </div>
                <div className="space-y-2">
                  {input.searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleTarifSelect(index, result)}
                      className={`p-2 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                        input.selectedTarif === result.id
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                    >
                      <div className="font-medium">
                        {result.name || "Nomsiz tarif"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {input.tarif && (
              <div className="border rounded-lg p-3 bg-gray-50 flex justify-between">
                <div className="flex flex-col">
                  <div className="font-semibold">
                    {tarif.code} / {tarif.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tarif.summa} so'm / {tarif.second} sekund
                  </div>
                  <div className="text-xs text-gray-500"></div>
                </div>
                <div className="flex items-center">
                  <Button
                    id={`submit-btn-${index}`}
                    className=" h-full flex items-center justify-center"
                    onClick={() => handleSubmit(tarif.id, index)}
                    disabled={loadingStates[index]}
                  >
                    {loadingStates[index] ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Qo'shilmoqda...
                      </>
                    ) : (
                      <>
                        <Check />
                        Bajarildi ({tarif.tarification_logs?.[0]?.quantity || 0}
                        )
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="w-full flex justify-end">
        <Button variant="outline" onClick={addNewInput}>
          <CirclePlus className="mr-2 h-4 w-4" />
          Yangi kod qo'shish
        </Button>
      </div>
    </div>
  );
};

export default TailorPage;
