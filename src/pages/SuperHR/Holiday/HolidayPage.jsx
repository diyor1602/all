import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const HolidayPage = () => {
  const { toast } = useToast();

  const [sending, setSending] = useState(false);

  const handleStartEdit = (holiday) => {
    setEditingId(holiday.id);
    setEditData({
      id: holiday.id,
      start_date: holiday.start_date.split("T")[0],
      end_date: holiday.end_date.split("T")[0],
      comment: holiday.comment || "",
    });
  };

  const handleSaveEdit = async (id) => {
    setSending(true);
    try {
      const payload = {
        start_date: editData.start_date,
        end_date: editData.end_date,
        comment: editData.comment,
      };

      await api.patch(`/superhr/employeeHolidays/${id}`, payload);

      // Update local state
      setHolidays(
        holidays.map((holiday) =>
          holiday.id === id
            ? {
                ...holiday,
                start_date: editData.start_date,
                end_date: editData.end_date,
                comment: editData.comment,
              }
            : holiday
        )
      );

      setEditingId(null);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ta'til ma'lumotlari yangilandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
        duration: 1200,
      });
    } catch (error) {
      console.error("Error updating holiday:", error);
      toast({
        title: "Xatolik",
        description: "Ta'til ma'lumotlarini yangilashda xatolik yuz berdi",
        variant: "destructive",
        duration: 1200,
      });
    } finally {
      setSending(false);
    }
  };

  const [holidays, setHolidays] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    id: null,
    start_date: "",
    end_date: "",
    comment: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [],
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHolidays = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page,
        search,
        ...(dateRange.from && { start_date: dateRange.from }),
        ...(dateRange.to && { end_date: dateRange.to }),
      });

      const response = await api.get(`/superhr/employeeHolidays?${params}`);
      setHolidays(response.data.data);
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
        description: "Ta'tillar ro'yxati olishda xatolik yuz berish mumkin",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(1);
  }, [search, dateRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHolidays(1);
  };

  const handlePageChange = (page) => {
    if (page && page >= 1 && page <= pagination.last_page) {
      fetchHolidays(page);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-bold">Ta'tillar</h2>
        <Link to="/superhr/holiday/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Qo'shish
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="search" className="text-sm font-medium">
              Qidirish
            </label>
            <Input
              type="search"
              placeholder="Ism yoki izoh"
              id="search"
              className="w-full bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="start-date" className="text-sm font-medium">
              Boshlanish sanasi
            </label>
            <Input
              id="start-date"
              type="date"
              className="w-full bg-white"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="end-date" className="text-sm font-medium">
              Tugash sanasi
            </label>
            <Input
              id="end-date"
              type="date"
              className="w-full bg-white"
              min={dateRange.from}
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
            />
          </div>
        </div>
      </form>

      <div className="mt-6 border">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Xodim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Bo'lim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Boshlanish sanasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Tugash sanasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Izoh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holidays?.length > 0 ? (
                holidays.map((holiday) => (
                  <tr
                    key={holiday.id}
                    className="hover:bg-gray-50 border border-gray-200"
                  >
                    <td className="px-6 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900">
                        {holiday.employee?.name || "Noma'lum"}
                      </div>
                    </td>
                    <td className="px-6 py-1 border border-gray-200">
                      <div className="text-xs font-medium text-gray-900 flex flex-col gap-1">
                        <div>{holiday.employee?.department?.name}</div>
                        <div>{holiday.employee?.group?.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-1 border border-gray-200">
                      {editingId === holiday.id ? (
                        <Input
                          type="date"
                          className="h-8 text-xs w-fit"
                          value={editData.start_date}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              start_date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-xs text-gray-900 text-center">
                          {format(parseISO(holiday.start_date), "dd.MM.yyyy")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-1 border border-gray-200">
                      {editingId === holiday.id ? (
                        <Input
                          type="date"
                          className="h-8 text-xs w-fit"
                          value={editData.end_date}
                          min={editData.start_date}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              end_date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-xs text-gray-900 text-center">
                          {format(parseISO(holiday.end_date), "dd.MM.yyyy")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-1 border border-gray-200">
                      {editingId === holiday.id ? (
                        <Input
                          type="text"
                          className="h-8 text-xs"
                          value={editData.comment}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              comment: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-xs text-gray-900 max-w-xs truncate">
                          {holiday.comment || "-"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-1 flex items-center gap-2">
                      <Link
                        to={`/superhr/employees/view/${holiday.employee?.id}`}
                      >
                        {" "}
                        <Button
                          variant="ghost"
                          className="text-xs"
                          // onClick={() => handleDeleteHoliday(holiday.id)}
                        >
                          <Eye className="text-blue-500" />
                        </Button>
                      </Link>
                      {editingId === holiday.id ? (
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleSaveEdit(holiday.id)}
                          disabled={sending}
                        >
                          {sending ? (
                            <Loader2 className="animate-spin text-primary" />
                          ) : (
                            <Check className="text-green-500" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleStartEdit(holiday)}
                        >
                          <Pencil className="text-orange-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-1 text-center text-xs text-gray-500"
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

            <div className="flex items-center space-x-1">
              {pagination.links.slice(1, -1).map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  onClick={() => handlePageChange(parseInt(link.label))}
                  disabled={!link.url}
                >
                  {link.label}
                </Button>
              ))}
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
    </div>
  );
};

export default HolidayPage;
