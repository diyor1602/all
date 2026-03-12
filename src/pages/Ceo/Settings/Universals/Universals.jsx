import { useState, useEffect, useRef } from "react";
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
import { Loader, X, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const keywords = ["tikuv", "тикув"];

const Universals = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedEmployeeForImage, setSelectedEmployeeForImage] =
    useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    localStorage.getItem("universalsMonth") ||
      new Date().toISOString().slice(0, 7),
  );
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/employee-assistant-groups", {
        params: { month: selectedMonth },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data?.flatMap((item) => item.departments));
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Departamentlarini olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getData();
    getDepartments();
  }, [selectedMonth]);

  const handleSearch = async (searchValue) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setSearching(true);
      const response = await api.get("ceo/employees", {
        params: { search: searchValue, status: "working" },
        signal: abortControllerRef.current.signal,
      });
      setResults(response.data?.data || []);
    } catch (error) {
      if (error.name !== "CanceledError") {
        toast({
          title: "Xatolik",
          description:
            error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
          variant: "destructive",
        });
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchText) {
      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(() => {
        handleSearch(searchText);
      }, 500); // 500ms debounce delay
    } else {
      setResults([]);
    }

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchText]);

  const handleSubmit = async () => {
    setSending(true);
    try {
      // Send individual requests for each selected group
      const requests = selectedGroups.map((groupId) =>
        api.post("/employee-assistant-groups", {
          employee_id: selectedResult.id,
          group_id: groupId,
          start_date: startDate,
          end_date: endDate,
        }),
      );

      await Promise.all(requests);

      toast({
        title: "Muvaffaqiyat",
        description: "Xodim qo'shildi",
      });
      setSearchDialogOpen(false);
      setSelectedGroups([]);
      setSearchText("");
      setResults([]);
      setSelectedResult(null);
      setStartDate("");
      setEndDate("");
      getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (ids) => {
    try {
      // Send individual delete requests for each group assignment
      const requests = ids.map((id) =>
        api.delete(`/employee-assistant-groups/${id}`),
      );

      await Promise.all(requests);

      toast({
        title: "Muvaffaqiyat",
        description: "Xodim o'chirildi",
      });
      getData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message || "Ma'lumotlarini olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  const openEmployeeImageDialog = (employee) => {
    if (!employee?.employee_img) return;
    setSelectedEmployeeForImage(employee);
    setImageDialogOpen(true);
  };

  return (
    <div>
      {loading ? (
        <div className="flex flex-col items-center gap-2 w-full h-[90vh] justify-center">
          <Loader className="animate-spin" />
          <span>Ma'lumotlar yuklanmoqda...</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                localStorage.setItem("universalsMonth", e.target.value);
              }}
              className="w-full sm:w-fit bg-white"
            />
            <Button
              onClick={() => {
                setSearchText("");
                setResults([]);
                setSelectedResult(null);
                setStartDate("");
                setEndDate("");
                setSearchDialogOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              Xodim qo'shish
            </Button>
          </div>
          {data.length === 0 ? (
            <div className="mt-4 flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <span>Xodimlar belgilanmagan!</span>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-4">
                {data.length} ta xodim belgilangan
              </div>
              <div className="grid gap-3">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 w-full sm:w-auto">
                      {item?.employee_img ? (
                        <img
                          src={item.employee_img}
                          alt={item.employee_name}
                          className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-gray-100 cursor-pointer"
                          onClick={() => openEmployeeImageDialog(item)}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white font-semibold text-lg ring-2 ring-gray-100">
                          {item.employee_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 sm:hidden">
                        <div className="font-semibold text-gray-900 text-lg break-words">
                          {item.employee_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="hidden sm:block font-semibold text-gray-900 text-lg truncate">
                        {item.employee_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item?.position_name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item?.assistant_groups?.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {item.assistant_groups
                              ?.sort((a, b) =>
                                a.group_name.localeCompare(b.group_name),
                              )
                              .map((group, index) => (
                                <span
                                  key={group.id || index}
                                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                                >
                                  {group.group_name}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            Guruhlar belgilanmagan
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-3 sm:mt-0 sm:hidden">
                        {item.assistant_groups?.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.confirm(
                                "Rostdan ham o'chirishni istaysizmi?",
                              )
                                ? handleDelete(
                                    item.assistant_groups.map((g) => g.id),
                                  )
                                : null
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center justify-end gap-4 shrink-0 w-full sm:w-auto">
                      {item.assistant_groups?.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.confirm(
                              "Rostdan ham o'chirishni istaysizmi?",
                            )
                              ? handleDelete(
                                  item.assistant_groups.map((g) => g.id),
                                )
                              : null
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Dialog
            open={imageDialogOpen}
            onOpenChange={(open) => {
              setImageDialogOpen(open);
              if (!open) setSelectedEmployeeForImage(null);
            }}
          >
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployeeForImage?.employee_name}
                </DialogTitle>
              </DialogHeader>
              {selectedEmployeeForImage?.employee_img && (
                <div className="w-full">
                  <img
                    src={selectedEmployeeForImage.employee_img}
                    alt={selectedEmployeeForImage.employee_name}
                    className="w-full max-h-[70vh] object-contain rounded-md"
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Xodimlarni qidirish</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Xodimni qidiring..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              {selectedResult ? (
                <>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedResult?.img ? (
                          <img
                            src={selectedResult.img}
                            alt={selectedResult.name}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                            {selectedResult.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">
                            {selectedResult.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {selectedResult.position}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedResult(null)}
                        variant="outline"
                        size="icon"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {departments
                      ?.filter((dept) =>
                        keywords.some((keyword) =>
                          dept.name
                            .toLowerCase()
                            .includes(keyword.toLowerCase()),
                        ),
                      )
                      .map((dept) => (
                        <div key={dept.id}>
                          <div className="mb-2">{dept.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {dept?.groups
                              ?.sort((a, b) => a.name.localeCompare(b.name))
                              .map((group) => (
                                <Button
                                  key={group.id}
                                  variant={
                                    selectedGroups.includes(group.id)
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => {
                                    if (selectedGroups.includes(group.id)) {
                                      setSelectedGroups(
                                        selectedGroups.filter(
                                          (id) => id !== group.id,
                                        ),
                                      );
                                    } else {
                                      setSelectedGroups([
                                        ...selectedGroups,
                                        group.id,
                                      ]);
                                    }
                                  }}
                                >
                                  {group.name}
                                </Button>
                              ))}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4">
                            <div className="space-y-1">
                              <Label>Boshlanish sanasi</Label>
                              <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Tugash sanasi</Label>
                              <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedGroups([]);
                                setSearchText("");
                                setResults([]);
                                setSelectedResult(null);
                                setSearchDialogOpen(false);
                                setStartDate("");
                                setEndDate("");
                              }}
                            >
                              Bekor qilish
                            </Button>
                            <Button
                              disabled={sending || !startDate || !endDate}
                              onClick={handleSubmit}
                            >
                              {sending ? "Yuborilmoqda..." : "Saqlash"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : searching ? (
                <div className="mt-4 flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader className="animate-spin" />
                    <span>Qidirilmoqda...</span>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                  <div className="text-sm text-gray-500 mb-2">
                    {results.length} ta xodim topildi
                  </div>
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() => setSelectedResult(result)}
                    >
                      {result?.img ? (
                        <img
                          src={result.img}
                          alt={result.name}
                          className="w-12 h-12 object-cover rounded-full shrink-0 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white font-semibold text-lg ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                          {result.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {result.position}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          {result.department?.name && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {result.department.name}
                            </span>
                          )}
                          {result.group?.name && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {result.group.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 w-full sm:w-auto">
                        <button
                          className="w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResult(result);
                          }}
                        >
                          Qo'shish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Universals;
