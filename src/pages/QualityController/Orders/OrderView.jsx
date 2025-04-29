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
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const OrderView = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [plusDialogOpen, setPlusDialogOpen] = useState(false);
  const [minusDialogOpen, setMinusDialogOpen] = useState(false);
  const [qualityCheckResults, setQualityCheckResults] = useState(null);
  const [qualityDescription, setQualityDescription] = useState(null);
  const [qualityDescriptionDialogOpen, setQualityDescriptionDialogOpen] =
    useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQualityName, setEditQualityName] = useState("");
  const [editingQualityId, setEditingQualityId] = useState(null);
  const [qualityName, setQualityName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [minusForm, setMinusForm] = useState({
    order_sub_model_id: null,
    descriptions: [],
    comment: "",
    status: false,
  });

  const fetchOrderAndQuality = async () => {
    try {
      const [orderRes, descRes] = await Promise.all([
        api.get(`/qualityController/orders/${id}`),
        api.get(`/qualityController/qualityDescription`),
      ]);

      setOrder(orderRes.data);
      setQualityDescription(descRes.data);

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
        title: "Error",
        description: "Failed to fetch data",
      });
    }
  };

  const handleEditClick = (item) => {
    setEditingQualityId(item.id);
    setEditQualityName(item.description);
    setEditDialogOpen(true);
  };

  const handleQualityDescriptionEdit = async () => {
    try {
      await api.post(
        `/qualityController/qualityDescription/${editingQualityId}`,
        {
          _method: "PATCH",
          description: editQualityName,
        }
      );

      toast({
        title: "Muvaffaqiyatli!",
        description: "Tahrirlandi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      setEditDialogOpen(false);
      setEditQualityName("");
      setEditingQualityId(null);
      fetchOrderAndQuality();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Tahrirlashda xatolik yuz berdi",
      });
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

  const handleMinus = async () => {
    minusForm.order_sub_model_id = order?.order_model?.submodels[0]?.id;
    if (!minusForm.order_sub_model_id || !minusForm.descriptions.length) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Ma'lumotlar to'liq emas",
      });
      return;
    }

    if (!minusForm.image) {
      toast({
        variant: "destructive",
        title: "Diqqat",
        description: "Rasm yuklanmagan",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append(
        "descriptions",
        JSON.stringify(minusForm.descriptions.map((desc) => desc.id))
      );
      formData.append("comment", minusForm.comment);
      formData.append("status", false);
      formData.append("order_sub_model_id", minusForm.order_sub_model_id);
      if (minusForm.image) {
        formData.append("image", minusForm.image);
      }
      setIsSending(true);

      await api.post("/qualityController/qualityFailureCheck", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the quality check results count
      setQualityCheckResults((prev) => ({
        ...prev,
        qualityChecksFalse: (prev?.qualityChecksFalse || 0) + 1,
      }));

      toast({
        title: "Muvaffaqiyatli!",
        description: "Sifat nazoratidan nosozlik qo'shildi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Reset form state
      setMinusForm({
        order_sub_model_id: null,
        descriptions: [],
        comment: "",
        status: false,
      });

      // Close dialog only after successful submission
      setMinusDialogOpen(false);

      // Refresh data
      fetchOrderAndQuality();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Sifat nazoratidan o'tishda xatolik",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQualityDescriptionPlus = async () => {
    try {
      await api.post(`/qualityController/qualityDescription`, {
        description: qualityName,
      });
      toast({
        title: "Muvaffaqiyatli!",
        description: "Qo'shildi",
        duration: 2000,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setQualityName("");
      fetchOrderAndQuality();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Qo'shishda xatolik",
      });
    }
  };

  useEffect(() => {
    fetchOrderAndQuality();
  }, []);

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Buyurtma Tafsilotlari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm text-gray-700">
          <div>
            <span className="font-medium">Nomi:</span> {order?.name}
          </div>
          <div>
            <span className="font-medium">Submodel:</span>{" "}
            {order?.order_model?.submodels[0]?.submodel?.name}
          </div>
          <div>
            <span className="font-medium">Status:</span>{" "}
            {statuses[order?.status]?.text}
          </div>
          <div>
            <span className="font-medium">Miqdori:</span> {order?.quantity}
          </div>
          <div>
            note: null,
            <span className="font-medium">Model:</span>{" "}
            {order?.order_model?.model?.name}
          </div>
          <div>
            <span className="font-medium">Material:</span>{" "}
            {order?.order_model?.material?.name || "-"}
          </div>
          <div>
            <span className="font-medium">Tikkan gurux:</span>{" "}
            {order?.order_model?.submodels[0]?.group?.group?.name || "-"}
          </div>
          <div>
            <span className="font-medium">O'lchamlar:</span>{" "}
            {order?.order_model?.sizes
              ?.map((size) => size.size.name)
              .join(", ")}
          </div>
        </div>
      </div>

      <div className="mt-10 py-10 bg-white flex items-center justify-center gap-3">
        <div className="flex items-center justify-center w-full">
          <div
            onClick={() => setPlusDialogOpen(true)}
            className="flex items-center justify-center bg-green-100 text-green-500 px-10 min-w-40 h-40 text-7xl font-bold cursor-pointer"
          >
            {qualityCheckResults?.qualityChecksTrue ?? 0}
          </div>
        </div>

        <div className="flex items-center justify-center w-full">
          <div
            className="flex items-center justify-center bg-red-100 text-red-500 px-10 min-w-40 h-40 text-7xl font-bold cursor-pointer"
            onClick={() => setMinusDialogOpen(true)}
          >
            {qualityCheckResults?.qualityChecksFalse ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-10 pt-10 pb-4 px-4 bg-white flex flex-col gap-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Nosozliklar</h2>
          <Button onClick={() => setQualityDescriptionDialogOpen(true)}>
            <PlusCircle /> Qo'shish
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {qualityDescription?.map((item, i) => (
            <div
              key={i}
              className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2"
              onClick={() => handleEditClick(item)}
            >
              {item.description}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tahrirlash</DialogTitle>
            <div>
              <Input
                type="text"
                placeholder="Yangi nomi"
                value={editQualityName}
                onChange={(e) => setEditQualityName(e.target.value)}
              />
            </div>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleQualityDescriptionEdit}>Saqlash</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tasdiqlaysizmi?</DialogTitle>
            <div>Mahsulot sifatli ekanligini tasdiqlashga rozimisiz?</div>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end">
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

      <Dialog open={minusDialogOpen} onOpenChange={setMinusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nosozlik qo'shish</DialogTitle>
            <DialogDescription>
              Brak mahsulotlar shu yerda kiritiladi
            </DialogDescription>
            <div className="flex flex-wrap gap-2 py-4">
              {qualityDescription?.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-2 py-1 bg-gray-100 rounded flex items-center gap-2",
                    minusForm.descriptions.includes(item) &&
                      "bg-primary text-white"
                  )}
                  onClick={() => {
                    if (minusForm.descriptions.includes(item)) {
                      setMinusForm({
                        ...minusForm,
                        descriptions: minusForm.descriptions.filter(
                          (desc) => desc !== item
                        ),
                      });
                      return;
                    }
                    setMinusForm({
                      ...minusForm,
                      descriptions: [...minusForm.descriptions, item],
                    });
                  }}
                >
                  <div>{item.description}</div>
                </div>
              ))}
            </div>
            <Input
              className="mt-4"
              type="text"
              placeholder="Izoh"
              value={minusForm.comment}
              onChange={(e) =>
                setMinusForm({ ...minusForm, comment: e.target.value })
              }
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setMinusForm({ ...minusForm, image: e.target.files[0] })
              }
            />
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={() => handleMinus()}
                disabled={isSending}
              >
                {isSending ? "Yuborilmoqda..." : "Qo'shish"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qualityDescriptionDialogOpen}
        onOpenChange={setQualityDescriptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qo'shish</DialogTitle>
            <DialogDescription>{""}</DialogDescription>
            <div>
              <Input
                type="text"
                placeholder="Nomi"
                value={qualityName}
                onChange={(e) => setQualityName(e.target.value)}
              />
            </div>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => handleQualityDescriptionPlus()}>
                  Qo'shish
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderView;
