import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ItemView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [image, setImage] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/items");
      setItems(response.data.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mijozlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
        <Button
          variant="default"
          onClick={() => navigate("/warehouseManager/items/new")}
        >
          <CirclePlus className="h-4 w-4" /> Yangi
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[80vh]">
            <table className="border-2 border-collapse whitespace-nowrap w-full bg-white shadow-md">
              <thead>
                <tr>
                  <th className="border-2 p-1">N</th>
                  <th className="border-2 p-1">Nomi</th>
                  <th className="border-2 p-1">Rasmi</th>
                  <th className="border-2 p-1">Kodi</th>
                  <th className="border-2 p-1">Birligi</th>
                  <th className="border-2 p-1">Rangi</th>
                  <th className="border-2 p-1">Turi</th>
                  <th className="border-2 p-1">Narxi</th>
                  <th className="border-2 p-1">Valyuta</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="border-2 p-1 text-center">{index + 1}</td>
                    <td className="border-2 p-1">{item?.name}</td>
                    <td className="border-2 p-1">
                      {item?.image ? (
                        <img
                          src={item?.image}
                          alt={item?.name}
                          className="w-10 h-10 object-cover cursor-pointer"
                          onClick={() => {
                            setImageDialogOpen(true);
                            setImage(item?.image);
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border-2 p-1">{item?.code}</td>
                    <td className="border-2 p-1">{item?.unit?.name}</td>
                    <td className="border-2 p-1">{item?.color?.name}</td>
                    <td className="border-2 p-1">{item?.type?.name}</td>
                    <td className="border-2 p-1 text-center">{item?.price}</td>
                    <td className="border-2 p-1">{item?.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <img
            src={image}
            alt=""
            className="w-full h-auto max-h-[90vh] max-w-[90vw]"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemView;
