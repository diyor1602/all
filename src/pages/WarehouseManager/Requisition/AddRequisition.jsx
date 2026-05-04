import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const AddRequisition = () => {
  const { toast } = useToast();

  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const getWarehouses = async () => {
    try {
      const response = await api.get("/warehouseManager/warehouse");
      setWarehouses(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getTypes();
    getWarehouses();
  }, []);

  const getTypes = async () => {
    try {
      const response = await api.get("/warehouseManager/itemType");
      setTypes(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const getItem = async () => {
    setSearching(true);
    try {
      const response = await api.get("/warehouseManager/item", {
        params: {
          search: searchText,
          type: selectedType,
        },
      });
      setSearchResults(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <h1>AddRequisition</h1>
      <div className="mt-4">
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="bg-white w-fit">
            <SelectValue placeholder="Omborni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {warehouses
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4">
        <Input
          type="text"
          placeholder="Izoh"
          value={comment}
          className="bg-white"
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Input
          type="file"
          placeholder="Fayl"
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="bg-white"
        />
      </div>
      <Button onClick={() => setOpenDialog(true)} className="mt-4">
        Mahsulot qo'shish
      </Button>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulot tanlash</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-white w-fit">
                <SelectValue placeholder="Turini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Qidirish"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-white"
              onKeyDown={(e) => e.key === "Enter" && getItem()}
            />
          </div>
          <Button onClick={getItem} disabled={searching}>
            {searching ? "Qidirilmoqda..." : "Qidirish"}
          </Button>

          {searching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-primary" /> Qidirilmoqda
            </div>
          ) : searchResults?.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {searchResults.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  {item.image ? (
                    <img src={item.image} className="w-20 h-20 object-cover" />
                  ) : (
                    ""
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.code}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-gray-500">Hech narsa topilmadi</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddRequisition;
