import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Calendar,
  ArrowRight,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const GroupHistory = () => {
  const { toast } = useToast();

  const [salaryHistory, setSalaryHistory] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [],
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSalaryHistory = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page,
        search,
      });

      const response = await api.get(`/superhr/groupChanges?${params}`);
      setSalaryHistory(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        links: response.data.links || [],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Ma'lumotlarni olishda xatolik",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryHistory(1);
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSalaryHistory(1);
  };

  const handlePageChange = (page) => {
    if (page && page >= 1 && page <= pagination.last_page) {
      fetchSalaryHistory(page);
    }
  };

  const openEditDialog = (salary) => {
    setSelectedChange(salary);
    const iso = salary.created_at;
    setEditDate(iso ? iso.replace(" ", "T").slice(0, 16) : "");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedChange || !editDate) return;
    try {
      setIsSaving(true);
      await api.patch(`/superhr/groupChanges/${selectedChange.id}/`, {
        created_at: editDate,
      });
      toast({ title: "Muvaffaqiyatli saqlandi" });
      setEditDialogOpen(false);
      fetchSalaryHistory(pagination.current_page);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description:
          error?.response?.data?.message || "Saqlashda xatolik yuz berdi",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-bold">Guruhlar o'zgarishi tarixi</h2>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 mt-4">
        <Input
          type="text"
          placeholder="Ism bo'yicha qidirish"
          id="search"
          className="w-full bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="mt-6 border">
        <div className="relative w-full overflow-auto">
          <table
            className={`w-full text-xs whitespace-nowrap ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  №
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Xodim
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Eski guruh
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Yangi guruh
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  O'zgartirgan odam
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Vaqti
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salaryHistory?.length > 0 ? (
                salaryHistory.map((salary, index) => (
                  <tr
                    key={salary.id}
                    className="hover:bg-gray-50 border border-gray-200"
                  >
                    <td className="px-3 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900 text-center">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 py-1 border border-gray-200">
                      <Link
                        to={`/superhr/employees/view/${salary.employee?.id}`}
                        target="_blank"
                        className="text-xs font-medium text-gray-900"
                      >
                        {salary.employee?.name || "Noma'lum"}
                      </Link>
                    </td>
                    <td className="px-3 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900">
                        {salary?.old_department?.name || "-"} <br />
                        {salary.old_group?.name || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900">
                        {salary?.new_department?.name || "-"} <br />
                        {salary.new_group?.name || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900">
                        {salary.user?.employee?.name || "Noma'lum"}
                      </div>
                    </td>
                    <td className="px-3 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900 flex items-center gap-2">
                        {salary.created_at
                          ?.split(" ")[0]
                          ?.split("-")
                          ?.reverse()
                          ?.join(".")}{" "}
                        {salary.created_at?.split(" ")[1]?.slice(0, 5)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(salary)}
                        >
                          <Edit size={10} className="text-orange-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-3 py-1 text-center text-xs text-gray-500"
                  >
                    Ma'lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Jami: {pagination.total} ta
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              <ChevronLeft />
            </Button>

            <div className="flex flex-wrap gap-1 justify-center max-w-full">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 || // always show first
                    page === pagination.last_page || // always show last
                    Math.abs(page - pagination.current_page) <= 1 // show current, prev, next
                  );
                })
                .reduce((acc, page, i, arr) => {
                  if (i > 0 && page - arr[i - 1] > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={
                        item === pagination.current_page ? "default" : "outline"
                      }
                      onClick={() => handlePageChange(item)}
                      className="h-8 px-3 text-xs"
                    >
                      {item}
                    </Button>
                  ),
                )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <User size={16} className="text-primary" />
              {selectedChange?.employee?.name || "Xodim"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Faqat vaqtni tahrirlash mumkin
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">O'zgartirgan</span>
              <span className="font-medium">
                {selectedChange?.user?.employee?.name || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Guruh</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedChange?.old_department?.name || "—"} /{" "}
                  {selectedChange?.old_group?.name || "—"}
                </Badge>
                <ArrowRight
                  size={12}
                  className="text-muted-foreground shrink-0"
                />
                <Badge className="text-xs font-normal">
                  {selectedChange?.new_department?.name || "—"} /{" "}
                  {selectedChange?.new_group?.name || "—"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-date"
              className="text-xs font-medium flex items-center gap-1.5"
            >
              <Calendar size={13} />
              Vaqti
            </Label>
            <Input
              id="edit-date"
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Bekor qilish
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !editDate}
              className="min-w-[90px]"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupHistory;
