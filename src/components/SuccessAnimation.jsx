import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import JSConfetti from "js-confetti";

const SuccessAnimation = ({ isVisible, onComplete }) => {
  const showConfetti = () => {
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti({
      confettiColors: ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#f43f5e"],
      confettiRadius: 6,
      confettiNumber: 500,
    });

    setTimeout(() => {
      jsConfetti.addConfetti({
        emojis: ["🎉", "🎊", "✨", "💫", "⭐"],
        emojiSize: 50,
        confettiNumber: 30,
      });
    }, 400);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          onAnimationStart={showConfetti}
          onAnimationComplete={onComplete}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-2 text-center"
            >
              Muvaffaqiyatli saqlandi!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-center mb-6"
            >
              Barcha ma'lumotlar tizimga qo'shildi
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 text-center"
            >
              Asosiy sahifaga qaytarilmoqda...
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;
