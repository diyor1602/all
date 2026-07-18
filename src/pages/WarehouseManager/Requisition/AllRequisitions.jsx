import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Package,
  Paperclip,
  MessageSquare,
  ChevronDown,
  FileText,
  CheckCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STATUS_MAP = {
  pending: {
    label: "Kutilmoqda",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  given: {
    label: "Berilgan",
    className: "bg-green-50 text-green-600 border-green-200",
  },
  partialGiven: {
    label: "Qisman berilgan",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  forwarded: {
    label: "Yopilmagan",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.className}`}
    >
      {s.label}
    </span>
  );
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
};

const isImage = (fileType) => fileType?.startsWith("image/");

const ItemBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
    {children}
  </span>
);

const AllRequisitions = () => {
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getRequisitions = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/warehouseManager/requisition", {
        params: { page: pageNum },
      });
      setData(response.data.data ?? response.data);
      setTotalPages(response.data.totalPages ?? 1);
      setTotal(response.data.total ?? 0);
      setPage(pageNum);
      setExpandedId(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRequisitions();
  }, []);

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Talabnomalar</h1>
          {total > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">Jami: {total} ta</p>
          )}
        </div>
        <Button asChild>
          <Link to="/warehouseManager/requisitions/add">
            <Plus className="w-4 h-4 mr-1.5" />
            Yangi talabnoma
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 className="animate-spin w-5 h-5" />
          <span className="text-sm">Yuklanmoqda...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
          <Package className="w-12 h-12" />
          <p className="text-sm text-gray-400">Talabnomalar mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((req) => {
            const expanded = expandedId === req.id;
            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Card header — clickable */}
                <button
                  onClick={() => toggle(req.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          {req.requisitionNumber}
                        </span>
                        <StatusBadge status={req.status} />
                        {req.status === "pending" && (
                          <Link
                            to={`/warehouseManager/requisitions/approve/${req.id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Tasdiqlash
                          </Link>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDate(req.createdAt)}
                        </span>
                      </div>

                      {req.comment && (
                        <div className="flex items-start gap-1.5 text-sm text-gray-500">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{req.comment}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span>{req.items.length} ta mahsulot</span>
                        </div>
                        {req.attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            <span>{req.attachments.length} ta fayl</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-200 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded content */}
                {expanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {/* Items */}
                    {req.items.length > 0 && (
                      <div className="px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Mahsulotlar
                        </p>
                        {req.items.map((item, idx) => {
                          const info = item.item;
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50"
                            >
                              <span className="text-xs text-gray-400 w-4 flex-shrink-0 mt-1">
                                {idx + 1}
                              </span>
                              {info?.image && (
                                <img
                                  src={info.image}
                                  alt={info.name}
                                  className="w-10 h-10 rounded-md object-cover border border-gray-200 flex-shrink-0"
                                  onClick={() => {
                                    setSelectedImage(info.image);
                                    setDialogOpen(true);
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium text-gray-800 block">
                                      {info?.name ?? `#${item.itemId}`}
                                    </span>
                                    {info?.code && (
                                      <span className="text-xs text-gray-400">
                                        {info.code}
                                      </span>
                                    )}
                                  </div>
                                  <StatusBadge status={item.status} />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <ItemBadge>
                                    {item.requestedQuantity}{" "}
                                    {item.unitLabel || ""}
                                  </ItemBadge>
                                  {item.givenQuantity != null && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-600 border border-green-200">
                                      Berildi: {item.givenQuantity}
                                    </span>
                                  )}
                                  {info?.price > 0 && (
                                    <ItemBadge>
                                      {info.price.toLocaleString()}{" "}
                                      {info.currency?.name}
                                    </ItemBadge>
                                  )}
                                  {info?.lot > 0 && (
                                    <ItemBadge>Lot: {info.lot}</ItemBadge>
                                  )}
                                  {info?.color?.name && (
                                    <ItemBadge>
                                      {info.color.hex && (
                                        <span
                                          className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                                          style={{
                                            backgroundColor: `#${info.color.hex}`,
                                          }}
                                        />
                                      )}
                                      {info.color.name}
                                    </ItemBadge>
                                  )}
                                  {info?.type?.name && (
                                    <ItemBadge>{info.type.name}</ItemBadge>
                                  )}
                                </div>
                                {item.comment && (
                                  <p className="text-xs text-gray-400">
                                    {item.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Attachments */}
                    {req.attachments.length > 0 && (
                      <div className="px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Fayllar
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {req.attachments.map((att) =>
                            isImage(att.fileType) ? (
                              <button
                                key={att.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(att.filePath);
                                  setDialogOpen(true);
                                }}
                                className="group relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                              >
                                <img
                                  src={att.filePath}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                />
                              </button>
                            ) : (
                              <a
                                key={att.id}
                                href={att.filePath}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 max-w-48"
                              >
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{att.fileName}</span>
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => getRequisitions(page - 1)}
          >
            Oldingi
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => getRequisitions(page + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <div className="w-full h-[80vh] overflow-auto flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllRequisitions;
