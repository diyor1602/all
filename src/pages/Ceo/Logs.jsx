import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const Logs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    links: [],
    total: 0,
    per_page: 100,
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/logs?page=${page}`);
      setLogs(response.data?.data || []);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        links: response.data.links || [],
        total: response.data.total,
        per_page: response.data.per_page,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Loglar olishda xatolik",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="w-full overflow-auto">
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-500">
            <thead>
              <tr>
                <th className="border border-gray-500 p-2">№</th>
                <th className="border border-gray-500 p-2">User</th>
                <th className="border border-gray-500 p-2">Type</th>
                <th className="border border-gray-500 p-2">Program</th>
                <th className="border border-gray-500 p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={index}>
                    <td className="border border-gray-500 p-2">
                      {(pagination.current_page - 1) * pagination.per_page + index + 1}
                    </td>
                    <td className="border border-gray-500 p-2">
                      {log.user?.employee?.name || 'Noma\'lum'}
                    </td>
                    <td className="border border-gray-500 p-2">{log.type}</td>
                    <td className="border border-gray-500 p-2">
                      {log.program || "-"}
                    </td>
                    <td className="border border-gray-500 p-2">{log.action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => fetchLogs(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                  />
                </PaginationItem>

                {pagination.links.map((link, index) => {
                  if (link.label === "...") {
                    return (
                      <PaginationItem key={index}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  if (link.label.includes('Previous') || link.label.includes('Next')) {
                    return null;
                  }

                  return (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={link.active}
                        onClick={() => fetchLogs(parseInt(link.label))}
                      >
                        {link.label}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => fetchLogs(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
