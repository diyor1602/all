import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, animate } from "framer-motion";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, CirclePlus, Loader2, X } from "lucide-react";
import Coin from "/coin.png";

const Tailor = () => {
  const { toast } = useToast();

  const [balance, setBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [inputs, setInputs] = useState([{ code: "", tarif: null }]);
  const [loadingStates, setLoadingStates] = useState({});
  const [coins, setCoins] = useState([]);

  const balanceRef = useRef(null);

  const fetchBalance = async () => {
    try {
      const response = await api.get("/tailor/balance");
      animate(balance, response.data, {
        type: "spring",
        bounce: 0.4,
        duration: 1.8,
        onUpdate: (latest) => setDisplayBalance(Math.floor(latest)),
      });
      setBalance(response.data);
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
    try {
      const response = await api.get("/tailor/tarifications/search", {
        params: { code },
      });

      const updatedInputs = [...inputs];
      updatedInputs[index].tarif = response.data;
      setInputs(updatedInputs);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Tarif topilmadi.",
      });
    }
  };

  const playCoinSound = () => {
    const audio = new Audio("/coins.wav");
    audio.volume = 1;
    audio.play();
  };

  const handleSubmit = async (tarifId, index) => {
    setLoadingStates((prev) => ({ ...prev, [index]: true }));
    try {
      await api.post("/tailor/tarificationLog", {
        tarification_id: tarifId,
      });

      toast({
        variant: "default",
        title: "Bajarildi!",
        description: "Ish muvaffaqiyatli qo'shildi.",
      });

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
        setCoins((prev) => [...prev, ...newCoins]);
      }

      await getTarif(inputs[index].code, index);
      await fetchBalance();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Ishni bajarishda xatolik yuz berdi.",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleInputChange = (index, value) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].code = value;
    updatedInputs[index].tarif = null;
    setInputs(updatedInputs);
  };

  const addNewInput = () => {
    setInputs([...inputs, { code: "", tarif: null }]);
  };

  const removeInput = (index) => {
    const updated = [...inputs];
    updated.splice(index, 1);
    setInputs(updated);
  };

  const handleCoinAnimationComplete = (id) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center gap-2 flex-col">
        <span className="font-semibold text-lg">
          {localStorage.getItem("name")}
        </span>
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
              >
                Qidirish
              </Button>
            </div>

            {tarif && (
              <div className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="font-semibold">{tarif.name}</div>
                  <div className="text-xs text-gray-500">
                    {tarif.second} sekund
                  </div>
                  <div className="text-xs text-gray-500">
                    {tarif.summa} so‘m
                  </div>
                </div>
                <Button
                  id={`submit-btn-${index}`}
                  className="mt-3"
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
                      <Check className="mr-2 h-4 w-4" />
                      Bajarildi ({tarif.tarification_logs?.[0]?.quantity || 0})
                    </>
                  )}
                </Button>
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

export default Tailor;
