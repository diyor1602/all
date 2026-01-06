import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Box,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  Shirt,
  Tag,
  Trash2,
} from "lucide-react";
import { statuses } from "@/lib/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SalaryOrders = () => {
  const STORAGE_KEY = "salaryOrderSelectedMonth";
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEY) || new Date().toISOString().slice(0, 7)
    );
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({
    department_id:
      localStorage.getItem("salaryOrderSelectedDepartment") || "all",
    group_id: localStorage.getItem("salaryOrderSelectedGroup") || "all",
  });
  const [locking, setLocking] = useState({ id: null, status: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/internalAccountant/monthlySelectedOrders?month=${selectedMonth}`
      );
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleAdd = async (order) => {
    if (
      !window.confirm(`${order.name} buyurtmani qo'shishni tasdiqlaysizmi?`)
    ) {
      return;
    }
    try {
      await api.post("internalAccountant/monthlySelectedOrders", {
        month: selectedMonth,
        order_id: order.id,
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar qo'shildi",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleMinus = async (order) => {
    if (
      !window.confirm(
        `${order.order?.name} buyurtmani olib tashlashni tasdiqlaysizmi?`
      )
    ) {
      return;
    }
    try {
      await api.delete(`internalAccountant/monthlySelectedOrders/${order.id}`);
      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar o'chirildi",
        duration: 1000,
        style: {
          background: "green",
          color: "white",
        },
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("internalAccountant/departments");
      setDepartments(response.data?.flatMap((item) => item?.departments) || []);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Ma'lumotlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const lockOrder = async (id, status) => {
    setLocking({ id, status });
    try {
      await api.post("internalAccountant/blockedOrders", {
        order_id: id,
        status: status ? "blocked" : "unblocked",
      });
      toast({
        variant: "default",
        title: "Muvaffaqiyatli",
        description: `Buyurtma ${status ? "bloklanadi" : "blokdan yechildi"}`,
        duration: 1000,
      });
      await fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.response?.data?.message || "Xatolik yuz berdi",
      });
    } finally {
      setLocking({ id: null, status: null });
    }
  };

  useEffect(() => {
    if (filters.department_id === "all") {
      setGroups([]);
      setFilters({ ...filters, group_id: "all" });
    } else {
      const selectedDept = departments.find(
        (dept) => dept.id === Number.parseInt(filters.department_id)
      );
      if (selectedDept && selectedDept.groups) {
        setGroups(selectedDept.groups);
      } else {
        setGroups([]);
      }
      setFilters({ ...filters, group_id: "all" });
    }
  }, [filters.department_id, departments]);

  const filteredSelected = useMemo(() => {
    return data?.selected?.filter((item) => {
      const submodels = item.order?.order_model?.submodels;
      if (!submodels) return false;

      if (filters.department_id !== "all") {
        const hasMatchingDept = submodels.some(
          (submodel) =>
            submodel?.group?.group?.department_id ===
            Number(filters.department_id)
        );
        if (!hasMatchingDept) return false;
      }

      if (filters.group_id !== "all") {
        const hasMatchingGroup = submodels.some(
          (submodel) => submodel?.group?.group?.id === Number(filters.group_id)
        );
        if (!hasMatchingGroup) return false;
      }

      return true;
    });
  }, [data?.selected, filters]);

  const filteredRecommendations = useMemo(() => {
    return data?.recommendations?.filter((item) => {
      const submodels = item?.order_model?.submodels;
      if (!submodels) return false;

      if (filters.department_id !== "all") {
        const hasMatchingDept = submodels.some(
          (submodel) =>
            submodel?.group?.group?.department_id ===
            Number(filters.department_id)
        );
        if (!hasMatchingDept) return false;
      }

      if (filters.group_id !== "all") {
        const hasMatchingGroup = submodels.some(
          (submodel) => submodel?.group?.group?.id === Number(filters.group_id)
        );
        if (!hasMatchingGroup) return false;
      }

      return true;
    });
  }, [data?.selected, filters]);

  return (
    <div className="flex flex-col gap-2 mx-4 md:mx-0">
      <div className="sticky top-0 z-10 bg-white w-full p-4">
        <div className="flex items-center gap-2 w-full flex-wrap">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-fit bg-white"
          />

          <Select
            value={filters.department_id}
            onValueChange={(value) => {
              setFilters({ ...filters, department_id: value, group_id: null });
              localStorage.setItem("salaryOrderSelectedDepartment", value);
            }}
            className="w-full sm:w-[180px]"
            disabled={loading}
          >
            <SelectTrigger className="bg-white w-fit">
              <SelectValue placeholder="Bo'lim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha bo'limlar</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.group_id}
            onValueChange={(value) => {
              setFilters({ ...filters, group_id: value });
              localStorage.setItem("salaryOrderSelectedGroup", value);
            }}
            className="w-full sm:w-[180px]"
            disabled={filters.department_id === "all" || groups.length === 0}
          >
            <SelectTrigger className="bg-white w-fit">
              <SelectValue placeholder="Guruh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruhlar</SelectItem>
              {groups
                ?.sort((a, b) => a.name.localeCompare(b.name))
                ?.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xl font-bold">
          Tanlangan buyurtmalar{" "}
          {filteredSelected?.length > 0
            ? `(${filteredSelected?.length} ta) ${filteredSelected?.reduce(
                (total, item) => total + item.order?.quantity,
                0
              )}`
            : ""}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSelected?.length === 0 && (
            <div className="text-center">Tanlangan buyurtmalar mavjud emas</div>
          )}
          {filteredSelected
            ?.sort((a, b) => {
              if (
                !a.order?.order_model?.submodels?.some(
                  (submodel) => submodel?.group?.group?.name
                )
              ) {
                return -1;
              }
              if (
                !b.order?.order_model?.submodels?.some(
                  (submodel) => submodel?.group?.group?.name
                )
              ) {
                return 1;
              }
              return b.order?.id - a.order?.id;
            })
            ?.map((item, index) => {
              const isLockingThisOrder = locking?.id === item.order?.id;

              return (
                <div key={index} className="rounded-xl bg-white shadow-xl">
                  <div
                    className={`h-2 ${
                      statuses[item.order?.status]?.color
                    } rounded-t-xl`}
                  />
                  <div className="p-2 pt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2 justify-between flex-wrap">
                      <div
                        className={`${
                          statuses[item.order?.status]?.secondaryBg
                        } py-1 px-2 rounded-full w-fit text-xs font-semibold flex items-center gap-1 ${
                          statuses[item.order?.status]?.textColor
                        }`}
                      >
                        <div>#{item.order?.id}</div>
                      </div>
                      <div>
                        {isLockingThisOrder ? (
                          <Loader2
                            size={20}
                            className="text-gray-500 animate-spin"
                          />
                        ) : item.order?.blocked_order?.status === "blocked" ? (
                          <LockKeyhole
                            size={20}
                            className={`text-green-500 ${
                              isLockingThisOrder
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          />
                        ) : (
                          <KeyRound
                            size={20}
                            className={`text-red-500 ${
                              isLockingThisOrder
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={() => {
                              if (isLockingThisOrder) return;
                              lockOrder(item.order?.id, true);
                            }}
                          />
                        )}
                      </div>
                      <div
                        className={`${
                          statuses[item.order?.status]?.color
                        } py-1 px-2 rounded-full w-fit text-xs text-white`}
                      >
                        {statuses[item.order?.status]?.text}
                      </div>
                    </div>
                    <div
                      className={`${
                        statuses[item.order?.status]?.border
                      } bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
                    >
                      <h3 className="text-sm font-bold text-gray-800 truncate">
                        {item.order?.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 justify-between flex-wrap">
                      <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                        <Box size={12} className="text-gray-800" />
                        <div className="font-semibold text-gray-800 text-xs">
                          {item?.order?.order_model?.model?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                        {item?.order?.order_model?.submodels?.map(
                          (submodel, idx) => (
                            <div
                              key={idx}
                              className="font-semibold text-gray-800 text-xs flex items-center gap-1"
                            >
                              <Shirt size={12} className="text-gray-800" />{" "}
                              {submodel.submodel?.name}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-full text-xs overflow-hidden">
                      {/* Progress fill */}
                      <div
                        className={`${
                          statuses[item.order?.status]?.color
                        } absolute left-0 top-0 h-full rounded-full`}
                        style={{
                          width: `${
                            (item?.order?.order_model?.submodels?.reduce(
                              (total, submodel) =>
                                total +
                                parseInt(
                                  submodel.sewing_outputs_sum_quantity || 0
                                ),
                              0
                            ) /
                              item.order?.quantity) *
                            100
                          }%`,
                        }}
                      ></div>

                      {/* Text content (on top) */}
                      <div
                        className={`relative z-10 flex items-center gap-1 ${
                          item?.order?.order_model?.submodels?.reduce(
                            (total, submodel) =>
                              total +
                              parseInt(
                                submodel.sewing_outputs_sum_quantity || 0
                              ),
                            0
                          ) > 0
                            ? "text-white"
                            : ""
                        }`}
                      >
                        {item?.order?.order_model?.submodels?.reduce(
                          (total, submodel) =>
                            total +
                            parseInt(submodel.sewing_outputs_sum_quantity || 0),
                          0
                        )}
                        /{item.order?.quantity}
                      </div>
                    </div>

                    <div className="text-xs text-gray-800">
                      {item?.order?.order_model?.submodels?.some(
                        (submodel) => submodel?.group?.group?.name
                      ) ? (
                        item?.order?.order_model?.submodels
                          ?.map((submodel) => submodel?.group?.group?.name)
                          .join(", ")
                      ) : (
                        <div className="text-red-500 uppercase font-medium">
                          Guruhga biriktirilmagan
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleMinus(item)}
                      className={`${
                        statuses[item.order?.status]?.color
                      } text-white hover:text-white hover:bg-red-400 transition-all duration-300`}
                    >
                      <Trash2 />
                      <div>Olib tashlash</div>
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-10 bg-red-100 md:p-5">
        <div className="text-xl font-bold">
          Tavsiyadagi buyurtmalar{" "}
          {filteredRecommendations?.length > 0
            ? `(${
                filteredRecommendations?.length
              } ta) ${filteredRecommendations?.reduce(
                (total, item) => total + item?.quantity,
                0
              )}`
            : ""}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRecommendations?.length === 0 && (
            <div className="text-center">
              Tavsiyadagi buyurtmalar mavjud emas
            </div>
          )}
          {filteredRecommendations
            ?.sort((a, b) => b?.id - a?.id)
            ?.map((item, index) => (
              <div key={index} className="rounded-xl bg-white shadow-xl">
                <div
                  className={`h-2 ${
                    statuses[item?.status]?.color
                  } rounded-t-xl`}
                />
                <div className="p-2 pt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2 justify-between flex-wrap">
                    <div
                      className={`${
                        statuses[item?.status]?.secondaryBg
                      } py-1 px-2 rounded-full w-fit text-xs font-semibold flex items-center gap-1 ${
                        statuses[item?.status]?.textColor
                      }`}
                    >
                      <Tag
                        size={12}
                        className={statuses[item?.status]?.textColor}
                      />
                      <div>#{item?.id}</div>
                    </div>
                    <div
                      className={`${
                        statuses[item?.status]?.color
                      } py-1 px-2 rounded-full w-fit text-xs text-white`}
                    >
                      {statuses[item?.status]?.text}
                    </div>
                  </div>
                  <div
                    className={`${
                      statuses[item?.status]?.border
                    } bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-l-4`}
                  >
                    <h3 className="text-sm font-bold text-gray-800 truncate">
                      {item?.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 justify-between flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                      <Box size={12} className="text-gray-800" />
                      <div className="font-semibold text-gray-800 text-xs">
                        {item?.order_model?.model?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                      {item?.order_model?.submodels?.map((submodel, idx) => (
                        <div
                          key={idx}
                          className="font-semibold text-gray-800 text-xs flex items-center gap-1"
                        >
                          <Shirt size={12} className="text-gray-800" />{" "}
                          {submodel.submodel?.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-full text-xs overflow-hidden">
                    {/* Progress fill */}
                    <div
                      className={`${
                        statuses[item?.status]?.color
                      } absolute left-0 top-0 h-full rounded-full`}
                      style={{
                        width: `${
                          (item?.order_model?.submodels?.reduce(
                            (total, submodel) =>
                              total +
                              parseInt(
                                submodel.sewing_outputs_sum_quantity || 0
                              ),
                            0
                          ) /
                            item?.quantity) *
                          100
                        }%`,
                      }}
                    ></div>

                    {/* Text content (on top) */}
                    <div
                      className={`relative z-10 flex items-center gap-1 ${
                        item?.order_model?.submodels?.reduce(
                          (total, submodel) =>
                            total +
                            parseInt(submodel.sewing_outputs_sum_quantity || 0),
                          0
                        ) > 0
                          ? "text-white"
                          : ""
                      }`}
                    >
                      {item?.order_model?.submodels?.reduce(
                        (total, submodel) =>
                          total +
                          parseInt(submodel.sewing_outputs_sum_quantity || 0),
                        0
                      )}
                      /{item?.quantity}
                    </div>
                  </div>

                  <div className="text-xs text-gray-800">
                    {item?.order_model?.submodels
                      ?.map((submodel) => submodel?.group?.group?.name)
                      .join(", ")}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleAdd(item)}
                    className={`${
                      statuses[item?.status]?.color
                    } text-white hover:text-white hover:bg-red-400 transition-all duration-300`}
                  >
                    <Plus />
                    <div>Qo'shish</div>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SalaryOrders;
