import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusMap = {
  taken: "Olingan",
  returned: "Qaytarilgan",
};

const RentedMachines = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [typewriters, setTypewriters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTypewriter, setSelectedTypewriter] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [givenAt, setGivenAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addDialog, setAddDialog] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superhr/home-typewriter");
      setData(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeWriters = async () => {
    setSearching(true);
    try {
      const response = await api.get("/superhr/typewriter");
      setTypewriters(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const searchEmployees = async () => {
    setSearching(true);
    try {
      const response = await api.get("/superhr/employees", {
        params: {
          search: searchTerm,
        },
      });
      setSearchResult(response.data?.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      await api.post("/superhr/home-typewriter", {
        employee_id: selectedEmployee?.id,
        type_writer_id: selectedTypewriter?.id,
        quantity: quantity,
        comment: comment,
        given_at: givenAt,
      });
      getData();
      setAddDialog(false);
      toast({
        title: "Muvaffaqiyat",
        description: "Ma'lumotlar saqlandi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni saqlab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const clearForm = () => {
    setSearchTerm("");
    setSearchResult([]);
    setSelectedEmployee(null);
    setSelectedTypewriter(null);
    setQuantity(1);
    setComment("");
    setGivenAt(new Date().toISOString().split("T")[0]);
  };

  useEffect(() => {
    getData();
    getTypeWriters();
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length > 2) {
      searchEmployees();
    }
  }, [searchTerm]);

  return (
    <div>
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <div>
          <Button
            onClick={() => {
              setAddDialog(true);
              clearForm();
            }}
          >
            Qo'shish
          </Button>
          {data.map((item, index) => (
            <div key={index}>
              <div>Xodim: {item.employee?.name}</div>
              <div>Mashina: {item.type_writer?.name}</div>
              <div>
                Berilgan sana:{" "}
                {new Date(item.given_at).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </div>
              <div>Status: {statusMap[item.status]}</div>
              {item.status === "returned" && (
                <div>
                  Qaytarilgan sana:{" "}
                  {new Date(item.returned_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qo'shish</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Xodimni qidirish"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searching && <div>Qidirilmoqda...</div>}
          {searchResult.length > 0 && (
            <div>
              {searchResult.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer hover:bg-gray-100 p-2"
                  onClick={() => {
                    setSelectedEmployee(item);
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
          {selectedEmployee && (
            <div>
              <div>Xodim: {selectedEmployee.name}</div>
              <Select
                value={selectedTypewriter}
                onValueChange={setSelectedTypewriter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mashina tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {typewriters.map((item, index) => (
                    <SelectItem key={index} value={item}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Berilgan sana"
                value={givenAt}
                onChange={(e) => setGivenAt(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Miqdor"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Izoh"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAddDialog(false)}>
                  Bekor qilish
                </Button>
                <Button
                  disabled={
                    !selectedEmployee ||
                    !selectedTypewriter ||
                    !givenAt ||
                    !quantity ||
                    adding
                  }
                  onClick={handleAdd}
                >
                  {adding ? "Qo'shilyapti..." : "Qo'shish"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentedMachines;
