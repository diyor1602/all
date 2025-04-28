import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Colors = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editColor, setEditColor] = useState(null);

  const fetchColors = async () => {
    setLoading(true);
    try {
      const response = await api.get("/warehouseManager/colors");
      setColors(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Ma'lumotlarni olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const colorData = Object.fromEntries(formData);
    colorData.hex = colorData?.hex?.slice(1);
    if (!colorData.name || !colorData.hex) {
      toast({
        title: "Xatolik",
        description: "Rang nomi va kodi bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }
    setIsAdding(true);
    try {
      await api.post("/warehouseManager/colors", colorData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Rang muvaffaqiyatli qo'shildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setOpenAddDialog(false);
      fetchColors();
      e.target.reset();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Rang qo'shishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEditDialog = (color) => {
    setEditColor(color);
    setOpenEditDialog(true);
  };

  const handleEditColor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const colorData = Object.fromEntries(formData);
    colorData.hex = colorData?.hex?.slice(1);
    if (!colorData.name || !colorData.hex) {
      toast({
        title: "Xatolik",
        description: "Rang nomi va kodi bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }
    setIsEditing(true);
    try {
      await api.patch(`/warehouseManager/colors/${editColor.id}`, colorData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Rang muvaffaqiyatli tahrirlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setOpenEditDialog(false);
      fetchColors();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Rang tahrirlashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Ranglar</h1>
          </div>
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Yangi rang
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yangi rang</DialogTitle>
                <DialogDescription>
                  Yangi rang ma'lumotlarini kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddColor}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Rang nomi</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Masalan: Qizil"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hex">Rang kodi</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        id="hex"
                        name="hex"
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">
                        Rangni tanlang
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenAddDialog(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Yuklanmoqda..." : "Qo'shish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Ranglar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : colors.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Hozircha ranglar mavjud emas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang nomi</TableHead>
                      <TableHead>Rang kodi</TableHead>
                      <TableHead className="w-24">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colors.map((color) => (
                      <TableRow key={color.id}>
                        <TableCell className="font-medium">
                          {color?.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: `#${color?.hex}` }}
                            ></div>
                            <span className="text-sm text-gray-500">
                              #{color?.hex}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(color)}
                            className="flex items-center gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only md:not-sr-only md:inline-block">
                              Tahrirlash
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rangni tahrirlash</DialogTitle>
            <DialogDescription>Rang ma'lumotlarini yangilang</DialogDescription>
          </DialogHeader>
          {editColor && (
            <form onSubmit={handleEditColor}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Rang nomi</Label>
                  <Input
                    type="text"
                    id="edit-name"
                    name="name"
                    defaultValue={editColor?.name}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-hex">Rang kodi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="edit-hex"
                      name="hex"
                      defaultValue={`#${editColor?.hex}`}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">
                      Rangni tanlash uchun bosing
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenEditDialog(false)}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isEditing}>
                  {isEditing ? "Yuklanmoqda..." : "Saqlash"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Colors;
