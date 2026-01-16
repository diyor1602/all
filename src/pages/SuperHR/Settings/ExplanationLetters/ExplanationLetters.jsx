import { useState, useEffect } from "react";
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
import { Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ExplanationLetters = () => {
  const { toast } = useToast();

  const [explanationLetters, setExplanationLetters] = useState([]);
  const [filteredLetters, setFilteredLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openExplanationLetter, setOpenExplanationLetter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/superhr/explanationLetters");
        setExplanationLetters(response.data);
        setFilteredLetters(response.data);
      } catch {
        toast({
          title: "Xatolik",
          description: "Tushuntirish xatlari olishda xatolik",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = explanationLetters.filter((letter) =>
      letter.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLetters(filtered);
  }, [searchTerm, explanationLetters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Ism bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/30 bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">
              Tushuntirish xatlari
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Hodimlar bo'yicha tushuntirish xatlari ro'yxati.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nomi
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Xatlar soni
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ko'rish
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLetters
                  ?.sort?.(
                    (a, b) =>
                      b.explanation_letters.length -
                      a.explanation_letters.length
                  )
                  ?.map((explanationLetter, index) => (
                    <tr
                      key={index}
                      className="odd:bg-white even:bg-gray-50/60 hover:bg-blue-50/60 transition-colors"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        <Link
                          to={`/superhr/employees/view/${explanationLetter.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {explanationLetter.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {explanationLetter.explanation_letters.length}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmployee(explanationLetter);
                            setOpenExplanationLetter(true);
                          }}
                          className="hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Dialog
        open={openExplanationLetter}
        onOpenChange={setOpenExplanationLetter}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col gap-4">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {selectedEmployee?.explanation_letters?.map((letter, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {letter?.created_at?.split("T")[0]}
                  </h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-700">
                  {letter.description}
                </p>
                {letter.file && (
                  <div className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <img
                      src={letter.file}
                      alt={`Tushuntirish xati ${index + 1}`}
                      className="max-h-[420px] w-full object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExplanationLetters;
