import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import FillableTruck from "@/components/FillableTruck";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck, Package, CheckCircle } from "lucide-react";
import { statuses } from "@/lib/status";

const TruckPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/shipmentPlans");
        setData(response.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description:
            error.response?.data?.message ||
            "Ma'lumotlar olishda xatolik yuz berdi.",
        });
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Jo'natmalar</h1>
      {data.length == 0 && (
        <p className="text-center text-gray-600">Jo'natmalar topilmadi</p>
      )}
      <div className="grid md:grid-cols-2 grid-cols-1 gap-32">
        {data.map((plan) => {
          const totals = plan.items.reduce(
            (acc, item) => {
              acc.quantity += item.quantity || 0;
              acc.completed += item.completed || 0;
              return acc;
            },
            { quantity: 0, completed: 0 }
          );

          const percentage =
            totals.quantity > 0
              ? Math.round((totals.completed / totals.quantity) * 100)
              : 0;

          return (
            <div
              key={plan.id}
              onClick={() => {
                setPercentage(percentage);
                setSelectedPlan(plan);
                setOpen(true);
              }}
            >
              <FillableTruck percentage={percentage} />
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="text-blue-600" size={24} />
              Jo'natish rejasi #{selectedPlan?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package size={20} />
                      Reja haqida umumiy ma'lumot
                    </span>
                    <Badge
                      className={`bg-green-500 text-white flex items-center gap-1`}
                    >
                      <CheckCircle size={12} />
                      Faol
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedPlan.items.reduce(
                          (acc, item) => acc + (item.quantity || 0),
                          0
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Jami miqdor</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedPlan.items.reduce(
                          (acc, item) => acc + (item.completed || 0),
                          0
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Bajarilgan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedPlan.items.length}
                      </p>
                      <p className="text-sm text-gray-600">Modellar soni</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedPlan.items.reduce(
                          (acc, item) => acc + (item.quantity || 0),
                          0
                        ) -
                          selectedPlan.items.reduce(
                            (acc, item) => acc + (item.completed || 0),
                            0
                          )}
                      </p>
                      <p className="text-sm text-gray-600">Qolgan</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <Progress value={percentage} />
                    <p className="text-lg font-semibold text-gray-600 text-center">
                      {percentage}% bajarildi
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package size={20} />
                  Modellar va buyurtmalar
                </h3>

                {[...selectedPlan.items]
                  .sort((a, b) => {
                    const percentA =
                      a.quantity > 0 ? a.completed / a.quantity : 0;
                    const percentB =
                      b.quantity > 0 ? b.completed / b.quantity : 0;
                    return percentA - percentB;
                  })
                  .map((item, index) => {
                    const completionPercentage =
                      item.quantity > 0
                        ? (item.completed / item.quantity) * 100
                        : 0;

                    return (
                      <Card
                        key={item.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                #{index + 1}
                              </span>
                              {item.model?.name}
                            </span>
                            <Badge variant="outline">
                              {item.completed}/{item.quantity}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">
                                  {Math.round(completionPercentage)}%
                                </span>
                              </div>
                              <Progress
                                value={completionPercentage}
                                className="h-2"
                              />
                            </div>

                            {item.details && item.details.length > 0 && (
                              <div>
                                <Separator className="my-3" />
                                <h4 className="font-medium text-gray-700 mb-3">
                                  Buyurtma tafsilotlari:
                                </h4>
                                <div className="space-y-3">
                                  {item.details.map((detail) => (
                                    <div
                                      key={detail.id}
                                      className="bg-gray-50 p-3 rounded-lg"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-medium text-gray-800">
                                            {detail.order?.name}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {detail.submodel?.name}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <div
                                            className={
                                              "px-2 py-1 rounded-full text-sm text-white " +
                                              statuses[detail.order?.status]
                                                ?.color
                                            }
                                          >
                                            {
                                              statuses[detail.order?.status]
                                                ?.text
                                            }
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">
                                            Miqdor: {detail.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.comment && (
                              <div className="mt-3 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-sm">
                                <strong>Element izohi:</strong> {item.comment}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TruckPage;
