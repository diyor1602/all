import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Color palette for cards
const cardColors = [
  "bg-gradient-to-br from-blue-300 to-blue-400 border-blue-200",
  "bg-gradient-to-br from-green-300 to-green-400 border-green-200",
  "bg-gradient-to-br from-amber-300 to-amber-400 border-amber-200",
  "bg-gradient-to-br from-purple-300 to-purple-400 border-purple-200",
  "bg-gradient-to-br from-rose-300 to-rose-400 border-rose-200",
  "bg-gradient-to-br from-emerald-300 to-emerald-400 border-emerald-200",
];

const getCardColor = (index) => {
  return cardColors[index % cardColors.length];
};

const Nakladnoy = () => {
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState({});

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get("/internalAccountant/departments");
      const allSubDepartments = response.data.flatMap(
        (main) => main.departments
      );
      setGroups(allSubDepartments.flatMap((dept) => dept.groups));
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDownload = async (groupId, groupName) => {
    setDownloadingIds((prev) => ({ ...prev, [groupId]: true }));
    try {
      const response = await api.get(`/internalAccountant/nakladnoy`, {
        params: {
          group_id: groupId,
        },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nakladnoy_${groupName}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Diqqat",
        description: error.response?.data?.message || "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-32 bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((group, index) => (
              <Card
                key={group.id}
                className={`${getCardColor(
                  index
                )} border-2 transition-all hover:shadow-lg hover:-translate-y-1`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {group.name}
                  </CardTitle>
                  {group.description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {group.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={downloadingIds[group.id]}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleDownload(group.id, group.name)}
                  >
                    {downloadingIds[group.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yuklanmoqda...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Yuklab olish
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default Nakladnoy;
