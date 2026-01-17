import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { statuses } from "@/lib/status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OrderView = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [minusDialogOpen, setMinusDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState("");

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const [orderRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
      ]);

      setOrder(orderRes.data);
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  const handlePlus = async () => {
    setSending(true);
    try {
      await api.post("/qualityController/qualityControl", {
        order_id: id,
        type: "good",
      });
      setPlusDialogOpen(false);
      toast({
        title: "Tekshirildi",
        duration: 1000,
      });
      fetchOrder();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Yuborishda xatolik yuz berdi",
      });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg mt-4"
      >
        <motion.div
          className="p-6 cursor-pointer select-none"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-gray-800">
                {order?.name}
              </div>
              <div className="font-semibold text-gray-800">
                {order?.order_model?.sub_models[0]?.submodel?.name ||
                  "Buyurtma"}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isDetailsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-6 h-6 text-gray-500" />
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {isDetailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Status", value: statuses[order?.status]?.text },
                    { label: "Miqdori", value: order?.quantity },
                    { label: "Model", value: order?.order_model?.model?.name },
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <span className="font-medium text-gray-600 block mb-1">
                        {item.label}:
                      </span>
                      <span className="text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 py-8 bg-white rounded-2xl shadow-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <button
              onClick={() => {
                setPlusDialogOpen(true);
              }}
              className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-green-500">
                {order?.good_count || 0}
              </span>
              <span className="text-sm text-green-600">Sifatli</span>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <button className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group">
              <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-red-500">
                0
              </span>
              <span className="text-sm text-red-600">Yaroqsiz</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
      <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Mahsulot sifatli ekanligini tasdiqlaysizmi?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setPlusDialogOpen(false);
              }}
            >
              Bekor qilish
            </Button>
            <Button className="py-7" disabled={sending} onClick={handlePlus}>
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle /> Tasdiqlash
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
