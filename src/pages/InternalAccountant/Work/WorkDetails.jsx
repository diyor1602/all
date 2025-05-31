"use client";

import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  BoxIcon,
  MessageSquareIcon,
  CalendarCheckIcon,
  CalendarIcon,
  TagIcon,
  BarChartIcon,
  RulerIcon,
  Coins,
  Hourglass,
  Bitcoin,
  Timer,
  FileDigit,
  Pencil,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statuses } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const WorkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [tarifications, setTarifications] = useState([]);
  const [planLoader, setPlanLoader] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedTarifLang, setSelectedTarifLang] = useState(
    localStorage.getItem("tarifLang") || "uz"
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const totalSpends = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          Number.parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) => acc + Number.parseFloat(spend?.seconds),
              0
            )
          ),
        0
      ),
    [order?.order_model?.submodels]
  );

  const totalSpendSummaUZ = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          Number.parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc +
                Number.parseFloat(spend?.region == "uz" ? spend?.summa : 0),
              0
            )
          ),
        0
      ),
    [order?.order_model?.submodels]
  );

  const totalSpendSummaRU = useMemo(
    () =>
      order?.order_model?.submodels?.reduce(
        (acc, submodel) =>
          acc +
          Number.parseFloat(
            submodel?.submodel_spend?.reduce(
              (acc, spend) =>
                acc +
                Number.parseFloat(spend?.region == "ru" ? spend?.summa : 0),
              0
            )
          ),
        0
      ),
    [order?.order_model?.submodels]
  );

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/internalAccountant/orders/${id}`);
        setOrder(response.data);
        setSelectedSubmodel(response.data?.order_model?.submodels?.[0]);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday buyurtma topilmadi",
          variant: "destructive",
        });
        navigate("/technolog/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, toast]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get(`/internalAccountant/users`, {
          params: {
            id: selectedSubmodel?.id,
          },
        });
        setEmployees(response.data);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Bunday ishchilar topilmadi",
          variant: "destructive",
        });
      }
    };

    fetchEmployees();
  }, [selectedSubmodel]);

  useEffect(() => {
    if (selectedSubmodel) {
      const foundSubmodel = order?.order_model?.submodels?.find(
        (submodel) => submodel?.id === selectedSubmodel?.id
      );
      setTarifications(
        foundSubmodel?.tarification_categories?.filter(
          (category) => category?.region === selectedTarifLang
        ) || []
      );
    }
  }, [selectedSubmodel, order, selectedTarifLang]);

  const handlePlan = async () => {
    setPlanLoader(true);

    const planType = selectedEmployee === "all" ? "all" : "employee";
    const planUrl =
      planType === "all"
        ? `/internalAccountant/dailyPlan/`
        : `/internalAccountant/dailyPlan/employee`;

    const params =
      planType === "all"
        ? {
            submodel_id: selectedSubmodel?.id,
            group_id: selectedSubmodel?.group?.group?.id,
            region: selectedTarifLang,
          }
        : {
            submodel_id: selectedSubmodel?.id,
            employee_id: selectedEmployee,
            region: selectedTarifLang,
          };

    try {
      const response = await api.get(planUrl, {
        params,
        responseType: "blob", // Important: tells Axios to expect binary data
      });

      // Create a blob URL
      const blob = new Blob([response.data], { type: "application/pdf" }); // Change type if it's not PDF
      const blobURL = URL.createObjectURL(blob);

      // Create an invisible iframe to trigger print
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobURL;
      document.body.appendChild(iframe);

      iframe.onload = function () {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Plan yaratishda xatolik, xodimga ish biriktirilmagan bo'lishi mumkin",
        variant: "destructive",
      });
    } finally {
      setPlanLoader(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-lg text-gray-600">Yuklanyapti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">
          Buyurtma #{order?.id}
        </h2>
      </div>

      {/* Order info card */}
      <Card className="bg-gradient-to-r from-sky-100 to-indigo-100 border-none shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {order?.name || "Buyurtma ma'lumotlari"}
                </h3>
                <p className="text-gray-600 text-sm">
                  {order?.order_model?.model?.name || "Model"}
                </p>
              </div>
              <Badge
                className={`${
                  statuses[order?.status]?.color
                } px-3 py-1 font-medium rounded-full text-sm hover:opacity-90`}
              >
                {statuses[order?.status]?.text}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Details Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Buyurtma haqida</h4>

              <div className="space-y-2">
                {order?.quantity && (
                  <div className="flex gap-2 items-center">
                    <FileDigit className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Miqdor: {order?.quantity} ta
                    </span>
                  </div>
                )}
                {order?.start_date && (
                  <div className="flex gap-2 items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Boshlash: {formatDate(order?.start_date)}
                    </span>
                  </div>
                )}

                {order?.end_date && (
                  <div className="flex gap-2 items-center">
                    <CalendarCheckIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Tugash: {formatDate(order?.end_date)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Jami:{" "}
                    {totalSpends?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    sekund
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Jami:{" "}
                    {Number.parseFloat(totalSpends / 60)?.toLocaleString(
                      "ru-RU",
                      {
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    minut
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold">
                    Tikayotgan guruh: {selectedSubmodel?.group?.group?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Material Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Material haqida</h4>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BoxIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material: {order?.order_model?.material?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Material kodi: {order?.order_model?.material?.code || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BarChartIcon
                    className={cn(
                      "h-4 w-4",
                      order?.order_model?.status
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      order?.order_model?.status
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    Limit:{" "}
                    {Number.parseFloat(
                      order?.order_model?.rasxod || 0
                    ).toLocaleString() || "N/A"}{" "}
                    so'm
                    <span className="text-sm ml-1">
                      {order?.order_model?.status
                        ? "(Tasdiqlangan)"
                        : "(Tasdiqlanmagan)"}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Bitcoin
                    className={cn(
                      "h-4 w-4",
                      totalSpendSummaUZ > order?.order_model?.rasxod
                        ? "text-red-500"
                        : "text-black"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      totalSpendSummaUZ > order?.order_model?.rasxod
                        ? "text-red-500 text-xl"
                        : "text-sm"
                    )}
                  >
                    Jami UZ:{" "}
                    {totalSpendSummaUZ?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    so'm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Bitcoin
                    className={cn(
                      "h-4 w-4",
                      totalSpendSummaRU > order?.order_model?.rasxod
                        ? "text-red-500"
                        : "text-black"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      totalSpendSummaRU > order?.order_model?.rasxod
                        ? "text-red-500 text-xl"
                        : "text-sm"
                    )}
                  >
                    Jami RU:{" "}
                    {totalSpendSummaRU?.toLocaleString("ru-RU", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    so'm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order?.comment && (
            <div className="bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100 mt-4 flex items-center gap-2 flex-wrap">
              <MessageSquareIcon className="h-4 w-4 text-gray-500 mt-1" />
              <span className="text-sm">{order?.comment}</span>
            </div>
          )}

          {order?.order_model?.sizes && order.order_model.sizes.length > 0 && (
            <div className="mt-6 bg-white bg-opacity-40 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <RulerIcon className="h-4 w-4 mr-2 text-indigo-500" />
                <span>O'lchamlar</span>
              </h4>
              <div className="flex items-center flex-wrap gap-3">
                {order?.order_model?.sizes?.map((size) => (
                  <Badge
                    key={size.id}
                    className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 text-base w-fit hover:bg-indigo-50"
                  >
                    <span className="font-bold">{size?.size?.name}</span>{" "}
                    {size?.quantity ? (
                      <span className="font-medium mx-1 text-black">
                        {size?.quantity} ta
                      </span>
                    ) : (
                      ""
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {order?.order_model?.submodels?.length > 0 && (
        <div className="w-full space-y-4">
          {/* Submodel buttons with flex-wrap */}
          <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg">
            {order?.order_model?.submodels?.map((submodel) => (
              <Button
                key={submodel?.submodel?.id}
                variant={
                  selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                    ? "default"
                    : "outline"
                }
                className={
                  selectedSubmodel?.submodel?.id === submodel?.submodel?.id
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-blue-100"
                }
                onClick={() => setSelectedSubmodel(submodel)}
              >
                {submodel?.submodel?.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={selectedTarifLang === "uz" ? "default" : "outline"}
              onClick={() => {
                setSelectedTarifLang("uz");
                localStorage.setItem("tarifLang", "uz");
              }}
            >
              O'zbek tarifikatsiya
            </Button>
            <Button
              variant={selectedTarifLang === "ru" ? "default" : "outline"}
              onClick={() => {
                setSelectedTarifLang("ru");
                localStorage.setItem("tarifLang", "ru");
              }}
            >
              Rus tarifikatsiya
            </Button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-medium my-6 ml-2">Xodimlar</h2>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  className="w-fit"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Xodimni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi uchun</SelectItem>
                    {employees
                      ?.sort((a, b) => a?.name.localeCompare(b?.name))
                      ?.map((employee) => (
                        <SelectItem
                          key={employee?.id}
                          value={employee?.id}
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          {employee?.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={planLoader}
                  onClick={() => handlePlan()}
                >
                  {planLoader ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Plan chiqarish"
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {tarifications?.length > 0 && (
                <Card className="border-none shadow-md bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center gap-2 justify-between flex-wrap">
                        <div className="flex items-center gap-2">
                          <Coins size={20} />
                          <div>
                            {tarifications
                              .reduce(
                                (acc, item) =>
                                  acc +
                                  (Array.isArray(item?.tarifications)
                                    ? item.tarifications.reduce(
                                        (sum, subitem) =>
                                          sum +
                                          Number.parseFloat(
                                            subitem?.summa || 0
                                          ),
                                        0
                                      )
                                    : 0),
                                0
                              )
                              ?.toLocaleString("ru-RU", {
                                minimumFractionDigits: 2,
                              })}{" "}
                            so'm
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hourglass size={20} />
                          <div>
                            {tarifications
                              .reduce(
                                (acc, item) =>
                                  acc +
                                  (Array.isArray(item?.tarifications)
                                    ? item.tarifications.reduce(
                                        (sum, subitem) =>
                                          sum +
                                          Number.parseFloat(
                                            subitem?.second || 0
                                          ),
                                        0
                                      )
                                    : 0),
                                0
                              )
                              ?.toLocaleString("ru-RU", {
                                minimumFractionDigits: 2,
                              })}{" "}
                            sekund
                          </div>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {tarifications.map((tarification) => (
                        <div
                          key={tarification.id}
                          className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-medium text-gray-700">
                              {tarification?.name}{" "}
                            </span>

                            <Badge
                              variant="outline"
                              className="bg-indigo-100 text-indigo-800 border-indigo-200"
                            >
                              {tarification?.tarifications?.length} ta
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2 flex-wrap text-sm ">
                            <div className="flex items-center gap-2">
                              <Coins size={20} />
                              {Array.isArray(tarification?.tarifications)
                                ? tarification.tarifications
                                    .reduce(
                                      (acc, item) =>
                                        acc +
                                        Number.parseFloat(item?.summa || 0),
                                      0
                                    )
                                    .toLocaleString("ru-RU", {
                                      minimumFractionDigits: 2,
                                    })
                                : "0.00"}{" "}
                              so'm
                            </div>
                            <div className="flex items-center gap-2">
                              <Hourglass size={20} />
                              {Array.isArray(tarification?.tarifications)
                                ? tarification.tarifications
                                    .reduce(
                                      (acc, item) =>
                                        acc +
                                        Number.parseFloat(item?.second || 0),
                                      0
                                    )
                                    .toLocaleString("ru-RU", {
                                      minimumFractionDigits: 2,
                                    })
                                : "0.00"}{" "}
                              sekund
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 mt-4">
                            <Button
                              title="Tahrirlash"
                              onClick={() =>
                                navigate(
                                  `/internalAccountant/work/${tarification?.id}/edit`
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                              Tahrirlash
                            </Button>
                          </div>
                          <div className="overflow-auto max-h-[70vh]">
                            <table className="w-full border border-collapse whitespace-nowrap md:whitespace-normal">
                              <thead>
                                <tr className="text-center">
                                  <th className="border border-gray-300 p-1">
                                    #
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Kod
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Nomi
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Xodim
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Razryad
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Sekund
                                  </th>
                                  <th className="border border-gray-300 p-1">
                                    Summa (so'm)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.isArray(tarification?.tarifications) ? (
                                  tarification.tarifications
                                    ?.sort((a, b) =>
                                      a.code.localeCompare(b.code, undefined, {
                                        numeric: true,
                                        sensitivity: "base",
                                      })
                                    )
                                    ?.map((tarif, index) => (
                                      <tr
                                        key={tarif.id}
                                        className="text-center"
                                      >
                                        <td className="border border-gray-300 p-1">
                                          {index + 1}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {tarif?.code}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {tarif?.name}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {tarif?.employee?.name || "-"}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {tarif?.razryad?.name}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {Number.parseFloat(
                                            tarif?.second
                                          )?.toLocaleString()}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                          {Number.parseFloat(
                                            tarif?.summa
                                          )?.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan="8"
                                      className="border border-gray-300 p-2 text-center"
                                    >
                                      Ma'lumotlar mavjud emas
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkDetails;
