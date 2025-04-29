import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Package, Box } from "lucide-react";
import { statuses } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    order_id: id,
    package_size: "",
    package_quantity: "",
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/packageMaster/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Buyurtma olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async () => {
    if (formData.package_quantity <= 0 || formData.package_size <= 0) {
      toast({
        title: "Diqqat",
        description: "Quti soni va sig'imini kiriting",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    try {
      await api.post("/packageMaster/packageStore", formData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Natija muvaffaqiyatli saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      setFormData({
        order_id: id,
        package_size: "",
        package_quantity: "",
      });
      fetchOrder();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response.data.message || "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </Button>

      <div className="grid gap-6">
        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Buyurtma #{order?.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Buyurtma nomi</p>
                <p className="font-medium">{order?.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  {statuses[order?.status]?.text}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{order?.order_model?.model?.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Material</p>
                <p className="font-medium">
                  {order?.order_model?.material?.name}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="font-semibold">Submodellar</h3>
              <div className="flex flex-wrap gap-2">
                {order?.order_model?.submodels?.map((submodel, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-secondary text-secondary-foreground"
                  >
                    {submodel.submodel?.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">O'lchamlar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {order?.order_model?.sizes?.map((size) => (
                  <div
                    key={size.id}
                    className="p-3 rounded-lg border bg-card text-center"
                  >
                    <div className="font-medium">{size.size?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {size.quantity} ta
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Outcomes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Box className="w-5 h-5" />
              Qadoqlash natijalari
            </CardTitle>
            <CardDescription>
              <div>
                Jami:{" "}
                <span className="font-semibold">
                  {order?.package_outcomes?.reduce(
                    (acc, curr) =>
                      acc + curr.package_size * curr.package_quantity,
                    0
                  )}{" "}
                </span>
                ta
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {order?.package_outcomes?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                  {order.package_outcomes.map((outcome, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground">
                        Quti sig'imi
                      </div>
                      <div className="font-semibold text-lg">
                        {outcome.package_size}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Quti soni
                      </div>
                      <div className="font-semibold text-lg">
                        {outcome.package_quantity}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Hozircha qadoqlash natijalari yo'q
                </p>
              )}

              <Separator className="my-6" />

              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="package_quantity">Quti soni</Label>
                    <Input
                      id="package_quantity"
                      type="number"
                      placeholder="Quti sonini kiriting"
                      value={formData.package_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          package_quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="package_size">Quti sig'imi</Label>
                    <Input
                      id="package_size"
                      type="number"
                      placeholder="Quti sig'imini kiriting"
                      value={formData.package_size}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          package_size: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={handleSave}
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Saqlash"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderView;
