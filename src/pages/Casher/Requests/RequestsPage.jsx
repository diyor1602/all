"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  PlusCircle,
  Search,
  Filter,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const status = [
  {
    value: "pending",
    label: "Kutilmoqda",
    variant: "outline",
    icon: AlertCircle,
    color: "text-yellow-600",
  },
  {
    value: "approved",
    label: "Tasdiqlangan",
    variant: "default",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    value: "rejected",
    label: "Rad etilgan",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-600",
  },
];

const formatDeadline = (datetimeStr) => {
  const date = new Date(datetimeStr);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const formattedDate = `${day}.${month}.${year}, ${hours}:${minutes}`;

  if (diffDays < 0) {
    return { formatted: formattedDate, urgent: true, label: "Muddati o'tgan" };
  } else if (diffDays === 0) {
    return { formatted: formattedDate, urgent: true, label: "Bugun" };
  } else if (diffDays === 1) {
    return { formatted: formattedDate, urgent: true, label: "Ertaga" };
  } else if (diffDays <= 3) {
    return {
      formatted: formattedDate,
      urgent: true,
      label: `${diffDays} kun qoldi`,
    };
  } else {
    return {
      formatted: formattedDate,
      urgent: false,
      label: `${diffDays} kun qoldi`,
    };
  }
};

const RequestsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (page = 1, search = "", status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "10",
      });

      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const response = await api.get(`/casher/requests?${params.toString()}`);
      setData(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
        from: response.data.from,
        to: response.data.to,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description:
          error.response?.data?.message ||
          "Talabnomalar ma'lumotlari olishda xatolik yuz berdi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, searchQuery, statusFilter);
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(currentPage, searchQuery, statusFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, searchQuery, statusFilter);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
    fetchData(1, searchQuery, value === "all" ? "" : value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-0 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Talabnomalar
              </h1>
              <p className="text-gray-600">
                Jami {pagination.total} ta talab, {pagination.from}-
                {pagination.to} ko'rsatilmoqda
              </p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              onClick={() => navigate("/casher/requests/add")}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Yangi talab yaratish
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Xodim, sabab yoki izoh bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={handleStatusFilter}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Holat bo'yicha filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      {status.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Yuklanmoqda...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
                      <TableHead className="font-semibold text-gray-700 py-4">
                        №
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">Xodim</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">Miqdor</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Muddat
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Sabab
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Izoh
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Holat
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Hech qanday talab topilmadi
                            </h3>
                            <p className="text-gray-500">
                              Qidiruv so'zini o'zgartiring yoki filterni olib
                              tashlang
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.map((item, index) => {
                          const deadline = formatDeadline(item.deadline);
                          const statusInfo = status.find(
                            (s) => s.value === item.status
                          );
                          const StatusIcon = statusInfo?.icon || AlertCircle;
                          const rowNumber =
                            (pagination.current_page - 1) *
                              pagination.per_page +
                            index +
                            1;

                          return (
                            <motion.tr
                              key={item.id}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                                deadline.urgent ? "bg-red-50/30" : ""
                              }`}
                            >
                              <TableCell className="font-medium text-gray-600 py-4">
                                {rowNumber}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900">
                                    {item.employee}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {item.amount} {item.currency}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock
                                      className={`w-4 h-4 ${
                                        deadline.urgent
                                          ? "text-red-600"
                                          : "text-blue-600"
                                      }`}
                                    />
                                    <span
                                      className={`font-medium ${
                                        deadline.urgent
                                          ? "text-red-600"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {deadline.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {deadline.formatted}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-900">
                                  {item.purpose}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-600">
                                  {item.comment || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={statusInfo?.variant}
                                  className="flex items-center gap-1 w-fit mx-auto"
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo?.label}
                                </Badge>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    {pagination.from}-{pagination.to} dan {pagination.total} ta
                    natija ko'rsatilmoqda
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.current_page - 1)
                      }
                      disabled={pagination.current_page === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.last_page) },
                        (_, i) => {
                          let pageNumber;
                          if (pagination.last_page <= 5) {
                            pageNumber = i + 1;
                          } else if (pagination.current_page <= 3) {
                            pageNumber = i + 1;
                          } else if (
                            pagination.current_page >=
                            pagination.last_page - 2
                          ) {
                            pageNumber = pagination.last_page - 4 + i;
                          } else {
                            pageNumber = pagination.current_page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === pagination.current_page
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.current_page + 1)
                      }
                      disabled={
                        pagination.current_page === pagination.last_page
                      }
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={
                        pagination.current_page === pagination.last_page
                      }
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
