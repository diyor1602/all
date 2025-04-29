import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const Results = () => {
  const { toast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get("/qualityControllerMaster/results", {
        params: { date: selectedDate },
      });
      setResults(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Natijalar olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedDate]);

  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Button onClick={() => changeDateBy(-1)} variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-40 bg-white"
        />
        <Button onClick={() => changeDateBy(1)} variant="outline" size="icon">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-[90vh]">
            <Loader2 className="text-primary animate-spin" size={40} />
          </div>
        ) : (
          results.map((result) => (
            <Card key={result.id} className="w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {result.model.name} - {result.submodel.name}
                    </CardTitle>
                    <CardDescription>
                      Buyurtma: {result.order.name} ({result.order.quantity}{" "}
                      dona)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">
                        {result.qualityChecksTrue}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">
                        {result.qualityChecksFalse}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      result.qualityChecksFalse === 0
                        ? "success"
                        : "destructive"
                    }
                    className="ml-2"
                  >
                    {Math.round(
                      (result.qualityChecksTrue /
                        (result.qualityChecksTrue +
                          result.qualityChecksFalse)) *
                        100
                    )}
                    %
                  </Badge>
                </div>

                {result.qualityChecksFalse > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="checks">
                      <AccordionTrigger>
                        Muammoli tekshiruvlar ({result.qualityChecksFalse})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {result.qualityChecks
                            .filter((check) => !check.status)
                            .map((check) => (
                              <div
                                key={check.id}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                {check.comment && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {check.comment}
                                  </p>
                                )}
                                {check.quality_check_descriptions.length >
                                  0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {check.quality_check_descriptions.map(
                                      (desc) => (
                                        <Badge key={desc.id} variant="outline">
                                          {desc.quality_description.description}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                )}
                                {check.image && (
                                  <img
                                    src={check.image}
                                    alt="Quality check"
                                    className="rounded-lg w-full max-w-xs object-cover"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Results;
