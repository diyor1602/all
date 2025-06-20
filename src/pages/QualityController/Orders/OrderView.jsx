"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [qualityCheckResults, setQualityCheckResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOrderAndQuality = async () => {
    try {
      setIsLoading(true);
      const [orderRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
      ]);

      setOrder(orderRes.data);

      const submodelId = orderRes.data?.order_model?.submodels[0]?.id;
      if (submodelId) {
        const qualityRes = await api.get(`/qualityController/qualityCheck`, {
          params: { order_sub_model_id: submodelId },
        });
        setQualityCheckResults(qualityRes.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlus = async () => {
    setQualityCheckResults((prev) => ({
      ...prev,
      qualityChecksTrue: (prev?.qualityChecksTrue || 0) + 1,
    }));

    try {
      await api.post(`/qualityController/qualitySuccessCheck`, {
        order_sub_model_id: order?.order_model?.submodels[0]?.id,
        status: true,
      });

      toast({
        title: "Muvaffaqiyatli!",
        description: "Sifat nazoratidan muvaffaqiyatli o'tdi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      setQualityCheckResults((prev) => ({
        ...prev,
        qualityChecksTrue: (prev?.qualityChecksTrue || 1) - 1,
      }));

      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Sifat nazoratidan o'tishda xatolik",
      });
    }
  };

  useEffect(() => {
    fetchOrderAndQuality();
  }, []);

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
        className="bg-white rounded-2xl shadow-lg mt-6"
      >
        <motion.div
          className="p-6 cursor-pointer select-none"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {order?.order_model?.submodels[0]?.submodel?.name || "Buyurtma"}
            </h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {[
                    { label: "Nomi", value: order?.name },
                    {
                      label: "Submodel",
                      value: order?.order_model?.submodels[0]?.submodel?.name,
                    },
                    { label: "Status", value: statuses[order?.status]?.text },
                    { label: "Miqdori", value: order?.quantity },
                    { label: "Model", value: order?.order_model?.model?.name },
                    {
                      label: "Material",
                      value: order?.order_model?.material?.name || "-",
                    },
                    {
                      label: "Tikkan guruh",
                      value:
                        order?.order_model?.submodels[0]?.group?.group?.name ||
                        "-",
                    },
                    {
                      label: "O'lchamlar",
                      value: order?.order_model?.sizes
                        ?.map((size) => size.size.name)
                        .join(", "),
                    },
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
              onClick={() => setPlusDialogOpen(true)}
              className="w-full h-32 sm:h-40 bg-green-50 hover:bg-green-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-green-500">
                {qualityCheckResults?.qualityChecksTrue ?? 0}
              </span>
              <span className="text-sm text-green-600">Sifatli</span>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <button
              onClick={() => navigate(`/qualityController/orders/${id}/minus`)}
              className="w-full h-32 sm:h-40 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <XCircle className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-4xl sm:text-5xl font-bold text-red-500">
                {qualityCheckResults?.qualityChecksFalse ?? 0}
              </span>
              <span className="text-sm text-red-600">Nosoz</span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Tasdiqlaysizmi?</DialogTitle>
            <DialogDescription className="mt-2">
              Mahsulot sifatli ekanligini tasdiqlashga rozimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 justify-end w-full">
              <DialogClose asChild>
                <Button variant="outline">Yo'q</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handlePlus}>Roziman</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
