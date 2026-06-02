import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Video,
  ImageIcon,
  FolderOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const WebSite = () => {
  const { toast } = useToast();

  const [backgrounds, setBackgrounds] = useState([]);
  const [abouts, setAbouts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingBg, setLoadingBg] = useState(false);
  const [loadingAbouts, setLoadingAbouts] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [sending, setSending] = useState(false);

  const [bgDialogOpen, setBgDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [bgFile, setBgFile] = useState(null);
  const [aboutFiles, setAboutFiles] = useState([]);
  const [aboutUploadIndex, setAboutUploadIndex] = useState(0);
  const [aboutUploadProgress, setAboutUploadProgress] = useState(0);
  const [collectionForm, setCollectionForm] = useState({
    model_name: "",
    contragent_name: "",
    category_id: "",
  });
  const [collectionFile, setCollectionFile] = useState(null);

  const bgInputRef = useRef(null);
  const aboutInputRef = useRef(null);
  const collectionFileInputRef = useRef(null);

  const getBackgrounds = async () => {
    try {
      setLoadingBg(true);
      const res = await api.get("/ceo/backgrounds");
      setBackgrounds(
        Array.isArray(res.data)
          ? res.data.filter((i) => i.status)
          : res.data?.id && res.data?.status
          ? [res.data]
          : [],
      );
    } catch {
      toast({
        title: "Xatolik",
        description: "Video yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingBg(false);
    }
  };

  const getAbouts = async () => {
    try {
      setLoadingAbouts(true);
      const res = await api.get("/ceo/abouts");
      setAbouts(Array.isArray(res.data) ? res.data.filter((i) => i.status) : []);
    } catch {
      toast({
        title: "Xatolik",
        description: "Rasmlar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingAbouts(false);
    }
  };

  const getCollections = async () => {
    try {
      setLoadingCollections(true);
      const res = await api.get("/ceo/collections");
      setCollections(Array.isArray(res.data) ? res.data.filter((i) => i.status) : []);
    } catch {
      toast({
        title: "Xatolik",
        description: "Kolleksiyalar yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  const getCategories = async () => {
    try {
      const res = await api.get("/ceo/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({
        title: "Xatolik",
        description: "Kategoriyalar yuklanmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getBackgrounds();
    getAbouts();
    getCollections();
    getCategories();
  }, []);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft")
        setPreviewIndex((i) => (i > 0 ? i - 1 : abouts.length - 1));
      if (e.key === "ArrowRight")
        setPreviewIndex((i) => (i < abouts.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, abouts.length]);

  // Background
  const handleBgUpload = async () => {
    if (!bgFile) {
      toast({
        title: "Diqqat!",
        description: "Video faylni tanlang",
        variant: "destructive",
      });
      return;
    }
    try {
      setSending(true);
      setUploadProgress(0);
      if (backgrounds.length > 0) {
        await api.post(`/ceo/backgrounds/${backgrounds[0].id}`, {
          status: false,
        });
      }
      const formData = new FormData();
      formData.append("file", bgFile);
      await api.post("/ceo/backgrounds", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast({ title: "Muvaffaqiyatli!", description: "Video yuklandi" });
      setBgFile(null);
      if (bgInputRef.current) bgInputRef.current.value = "";
      setBgDialogOpen(false);
      getBackgrounds();
    } catch {
      toast({
        title: "Xatolik",
        description: "Video yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  // About
  const handleAboutUpload = async () => {
    if (aboutFiles.length === 0) {
      toast({
        title: "Diqqat!",
        description: "Rasm fayllarni tanlang",
        variant: "destructive",
      });
      return;
    }
    try {
      setSending(true);
      for (let i = 0; i < aboutFiles.length; i++) {
        setAboutUploadIndex(i);
        setAboutUploadProgress(0);
        const formData = new FormData();
        formData.append("file", aboutFiles[i]);
        await api.post("/ceo/abouts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            setAboutUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
      }
      toast({
        title: "Muvaffaqiyatli!",
        description: `${aboutFiles.length} ta rasm yuklandi`,
      });
      setAboutFiles([]);
      if (aboutInputRef.current) aboutInputRef.current.value = "";
      setAboutDialogOpen(false);
      getAbouts();
    } catch {
      toast({
        title: "Xatolik",
        description: "Rasm yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setAboutUploadProgress(0);
      setAboutUploadIndex(0);
    }
  };

  // Collections
  const openAddCollection = () => {
    setSelectedCollection(null);
    setCollectionForm({ model_name: "", contragent_name: "", category_id: "" });
    setCollectionFile(null);
    if (collectionFileInputRef.current)
      collectionFileInputRef.current.value = "";
    setCollectionDialogOpen(true);
  };

  const openEditCollection = (item) => {
    setSelectedCollection(item);
    setCollectionForm({
      model_name: item.model_name || "",
      contragent_name: item.contragent_name || "",
      category_id: item.category_id ? String(item.category_id) : "",
    });
    setCollectionFile(null);
    if (collectionFileInputRef.current)
      collectionFileInputRef.current.value = "";
    setCollectionDialogOpen(true);
  };

  const handleCollectionSubmit = async () => {
    if (
      !collectionForm.model_name ||
      !collectionForm.contragent_name ||
      !collectionForm.category_id
    ) {
      toast({
        title: "Diqqat!",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCollection && !collectionFile) {
      toast({
        title: "Diqqat!",
        description: "Faylni tanlang",
        variant: "destructive",
      });
      return;
    }
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("model_name", collectionForm.model_name);
      formData.append("contragent_name", collectionForm.contragent_name);
      formData.append("category_id", collectionForm.category_id);
      if (collectionFile) formData.append("file", collectionFile);

      if (selectedCollection) {
        await api.patch(`/ceo/collections/${selectedCollection.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({
          title: "Muvaffaqiyatli!",
          description: "Kolleksiya yangilandi",
        });
      } else {
        await api.post("/ceo/collections", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({
          title: "Muvaffaqiyatli!",
          description: "Kolleksiya qo'shildi",
        });
      }
      setCollectionDialogOpen(false);
      getCollections();
    } catch {
      toast({
        title: "Xatolik",
        description: "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Delete
  const confirmDelete = (type, id) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSending(true);
      await api.post(`/ceo/${deleteTarget.type}s/${deleteTarget.id}`, {
        status: false,
      });
      toast({ title: "Muvaffaqiyatli!", description: "O'chirildi" });
      if (deleteTarget.type === "background") getBackgrounds();
      else if (deleteTarget.type === "about") getAbouts();
      else if (deleteTarget.type === "collection") getCollections();
    } catch {
      toast({
        title: "Xatolik",
        description: "O'chirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Web Sayt</h1>

      <Tabs defaultValue="background">
        <TabsList className="mb-4">
          <TabsTrigger value="background">Fon (Video)</TabsTrigger>
          <TabsTrigger value="abouts">Biz haqimizda</TabsTrigger>
          <TabsTrigger value="collections">Kolleksiyalar</TabsTrigger>
        </TabsList>

        {/* Background Tab */}
        <TabsContent value="background">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Fon Video</h2>
            <Button onClick={() => setBgDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {backgrounds.length > 0 ? "Almashtirish" : "Qo'shish"}
            </Button>
          </div>

          {loadingBg ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
            </div>
          ) : backgrounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed rounded-lg">
              <Video className="w-16 h-16 mb-4" />
              <p>Hech qanday video yo'q</p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border">
              <video
                src={backgrounds[0]?.file || backgrounds[0]?.url}
                controls
                className="w-full max-h-96 object-contain bg-black"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => confirmDelete("background", backgrounds[0]?.id)}
                disabled={sending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Abouts Tab */}
        <TabsContent value="abouts">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Biz haqimizda rasmlari</h2>
            <Button onClick={() => setAboutDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Rasm qo'shish
            </Button>
          </div>

          {loadingAbouts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
            </div>
          ) : abouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed rounded-lg">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p>Hech qanday rasm yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {abouts.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border"
                >
                  {item.file || item.url || item.image ? (
                    <img
                      src={item.file || item.url || item.image}
                      alt="about"
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setPreviewIndex(idx)}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewIndex(idx)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete("about", item.id)}
                      disabled={sending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Kolleksiyalar</h2>
            <Button onClick={openAddCollection}>
              <Plus className="w-4 h-4 mr-2" />
              Qo'shish
            </Button>
          </div>

          {loadingCollections ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border text-left">№</th>
                    <th className="px-4 py-3 border text-left">Model nomi</th>
                    <th className="px-4 py-3 border text-left">Kontragent</th>
                    <th className="px-4 py-3 border text-left">Kategoriya</th>
                    <th className="px-4 py-3 border text-left">Fayl</th>
                    <th className="px-4 py-3 border text-left">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
                        Hech qanday ma'lumot topilmadi
                      </td>
                    </tr>
                  ) : (
                    collections.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index % 2 === 0
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-2 border text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 border">{item.model_name}</td>
                        <td className="px-4 py-2 border">
                          {item.contragent_name}
                        </td>
                        <td className="px-4 py-2 border">
                          {categories.find(
                            (c) => String(c.id) === String(item.category_id),
                          )?.name ||
                            item.category_id ||
                            "—"}
                        </td>
                        <td className="px-4 py-2 border">
                          {item.file ? (
                            <a
                              href={item.file}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline inline-flex items-center gap-1"
                            >
                              <FolderOpen className="w-4 h-4" />
                              Ko'rish
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2 border">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditCollection(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                confirmDelete("collection", item.id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Background Upload Dialog */}
      <Dialog open={bgDialogOpen} onOpenChange={setBgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Video yuklash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Video fayl</Label>
              <Input
                ref={bgInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                className="mt-1"
                disabled={sending}
              />
            </div>
            {sending && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Yuklanmoqda...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBgDialogOpen(false)} disabled={sending}>
              Bekor qilish
            </Button>
            <Button onClick={handleBgUpload} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yuklash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Upload Dialog */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rasm yuklash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rasmlar (bir nechta tanlash mumkin)</Label>
              <Input
                ref={aboutInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAboutFiles(Array.from(e.target.files || []))}
                className="mt-1"
                disabled={sending}
              />
              {aboutFiles.length > 0 && !sending && (
                <p className="text-xs text-gray-500 mt-1">
                  {aboutFiles.length} ta fayl tanlandi
                </p>
              )}
            </div>
            {sending && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {aboutUploadIndex + 1} / {aboutFiles.length} rasm yuklanmoqda...
                  </span>
                  <span>{aboutUploadProgress}%</span>
                </div>
                <Progress value={aboutUploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAboutDialogOpen(false)} disabled={sending}>
              Bekor qilish
            </Button>
            <Button onClick={handleAboutUpload} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yuklash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collection Add/Edit Dialog */}
      <Dialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCollection
                ? "Kolleksiyani tahrirlash"
                : "Kolleksiya qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Model nomi</Label>
              <Input
                value={collectionForm.model_name}
                onChange={(e) =>
                  setCollectionForm({
                    ...collectionForm,
                    model_name: e.target.value,
                  })
                }
                placeholder="Model nomini kiriting"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kontragent nomi</Label>
              <Input
                value={collectionForm.contragent_name}
                onChange={(e) =>
                  setCollectionForm({
                    ...collectionForm,
                    contragent_name: e.target.value,
                  })
                }
                placeholder="Kontragent nomini kiriting"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kategoriya</Label>
              <Select
                value={collectionForm.category_id}
                onValueChange={(val) =>
                  setCollectionForm({ ...collectionForm, category_id: val })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Fayl
                {selectedCollection && " (o'zgartirmasangiz bo'sh qoldiring)"}
              </Label>
              <Input
                ref={collectionFileInputRef}
                type="file"
                onChange={(e) => setCollectionFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollectionDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleCollectionSubmit} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedCollection ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl p-2">
          <div className="relative">
            <img
              src={abouts[previewIndex]?.file || abouts[previewIndex]?.url || abouts[previewIndex]?.image}
              alt="preview"
              className="w-full max-h-[80vh] object-contain rounded"
            />
            {abouts.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setPreviewIndex((i) => (i > 0 ? i - 1 : abouts.length - 1))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setPreviewIndex((i) => (i < abouts.length - 1 ? i + 1 : 0))}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  {previewIndex + 1} / {abouts.length}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bu amalni qaytarib bo'lmaydi. Davom etasizmi?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={sending}
            >
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebSite;
