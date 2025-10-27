import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const All = () => {
  const { toast } = useToast();

  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const getVideos = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/technologist/videos?page=${page}`);
      const data = response?.data;

      setVideos(data?.data || []);
      setCurrentPage(data?.current_page || 1);
      setLastPage(data?.last_page || 1);
    } catch (error) {
      toast({
        title: "Xatolik!",
        description:
          error?.response?.data?.message || "Videolarni olishda xatolik!",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVideos(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= lastPage) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const delta = 2; // how many pages to show around current

    for (let i = 1; i <= lastPage; i++) {
      if (
        i === 1 ||
        i === lastPage ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < lastPage)
      ) {
        pages.push("ellipsis");
      }
    }

    return pages.map((page, index) => {
      if (page === "ellipsis") {
        return (
          <PaginationItem key={`ellipsis-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={page}>
          <PaginationLink
            isActive={currentPage === page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Videolar</h1>
        <Link to="upload">
          <Button>Yangi video yuklash</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Yuklanmoqda...</div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="p-4 bg-white rounded-xl shadow hover:shadow-md transition h-fit"
            >
              <video
                src={video.link}
                controls
                className="w-full rounded-lg mb-2"
              ></video>
              <div className="font-medium text-gray-800 text-sm">
                {video.title}
              </div>
              <div className="flex items-center gap-2 justify-between border-t pt-2 mt-2">
                <div className="text-xs">ID: {video.id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(video.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </div>
              </div>
              {video.tarifications?.length > 0 && (
                <Button
                  onClick={() => {
                    setSelectedVideo(video);
                    setOpenDialog(true);
                  }}
                  className="w-full mt-2"
                  variant="outline"
                  size="sm"
                >
                  Tarifikatsiyalar
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Hozircha video mavjud emas.
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>ID: {selectedVideo?.id}</DialogTitle>
            <DialogDescription>{selectedVideo?.title}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-center">
                  <th className="border border-gray-300 p-1">#</th>
                  <th className="border border-gray-300 p-1">Kod</th>
                  <th className="border border-gray-300 p-1">Nomi</th>
                  <th className="border border-gray-300 p-1">Xodim</th>
                  <th className="border border-gray-300 p-1">Video ID</th>
                  <th className="border border-gray-300 p-1">Razryad</th>
                  <th className="border border-gray-300 p-1">Sekund</th>
                  <th className="border border-gray-300 p-1">Summa (so'm)</th>
                </tr>
              </thead>
              <tbody>
                {selectedVideo?.tarifications
                  ?.sort((a, b) =>
                    a.code.localeCompare(b.code, undefined, {
                      numeric: true,
                      sensitivity: "base",
                    })
                  )
                  ?.map((tarif, index) => (
                    <tr key={tarif.id} className="text-center">
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
                        <Link
                          to={`/technologist/videos/show/${tarif?.video_id}`}
                          target="_blank"
                        >
                          {tarif?.video_id}
                        </Link>
                      </td>
                      <td className="border border-gray-300 p-1">
                        {tarif?.razryad?.name}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {parseFloat(tarif?.second)?.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {parseFloat(tarif?.summa)?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {lastPage > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {renderPageNumbers()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={
                  currentPage === lastPage
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default All;
