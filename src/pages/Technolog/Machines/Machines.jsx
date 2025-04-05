import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Machines = () => {
  const { toast } = useToast();
  const [typewriters, setTypewriters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [newMachine, setNewMachine] = useState({ name: "", comment: "" });

  const fetchTypeWriters = async () => {
    try {
      setLoading(true);
      const response = await api.get("/technologist/typewriter");
      setTypewriters(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Mashinalar ro'yxati olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypeWriters();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTypewriters = typewriters.filter((typewriter) =>
    typewriter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMachine = async () => {
    try {
      await api.post("/technologist/typewriter", newMachine);
      setNewMachine({ name: "", comment: "" });
      setIsAddDialogOpen(false);
      toast({
        title: "Muvaffaqiyatli",
        description: "Yangi mashina qo'shildi",
      });
      fetchTypeWriters();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Mashina qo'shishda xatolik yuz berdi",
      });
    }
  };

  const handleEditMachine = async () => {
    try {
      await api.patch(
        `/technologist/typewriter/${selectedMachine.id}`,
        selectedMachine
      );
      setIsEditDialogOpen(false);
      toast({
        title: "Muvaffaqiyatli",
        description: "Mashina ma'lumotlari yangilandi",
      });
      fetchTypeWriters();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Mashina ma'lumotlarini yangilashda xatolik yuz berdi",
      });
    }
  };

  const openEditDialog = (machine) => {
    setSelectedMachine({ ...machine });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mashinalar</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              Yangi mashina qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yangi mashina qo'shish</DialogTitle>
              <DialogDescription>
                Yangi mashina ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nomi
                </Label>
                <Input
                  id="name"
                  value={newMachine.name}
                  onChange={(e) =>
                    setNewMachine({ ...newMachine, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  Izoh
                </Label>
                <Textarea
                  id="comment"
                  value={newMachine.comment}
                  onChange={(e) =>
                    setNewMachine({ ...newMachine, comment: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleAddMachine}>Qo'shish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Mashina qidirish..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="shadow">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypewriters.length > 0 ? (
            filteredTypewriters.map((typewriter) => (
              <Card
                key={typewriter.id}
                className="shadow hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle>{typewriter.name}</CardTitle>
                  <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {typewriter.comment || "Izoh mavjud emas"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(typewriter)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Tahrirlash
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">Mashinalar mavjud emas</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mashina ma'lumotlarini tahrirlash</DialogTitle>
            <DialogDescription>
              Mashina ma'lumotlarini o'zgartiring
            </DialogDescription>
          </DialogHeader>
          {selectedMachine && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nomi
                </Label>
                <Input
                  id="edit-name"
                  value={selectedMachine.name}
                  onChange={(e) =>
                    setSelectedMachine({
                      ...selectedMachine,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-comment" className="text-right">
                  Izoh
                </Label>
                <Textarea
                  id="edit-comment"
                  value={selectedMachine.comment}
                  onChange={(e) =>
                    setSelectedMachine({
                      ...selectedMachine,
                      comment: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleEditMachine}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Machines;
