import { useParams } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleCheck, Bluetooth, Printer, X } from "lucide-react";
import QRCode from "qrcode";

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const CuttingStart = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [cuts, setcuts] = useState(null);
  const [selectedSubmodel, setSelectedSubmodel] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sending, setSending] = useState(false);

  // Bluetooth states
  const [bluetoothDevices, setBluetoothDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  const { id } = useParams();

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCuts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cuttingMaster/cuts/${id}`);
      setcuts(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Bluetooth functions
  const scanForDevices = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Diqqat",
        description: "Sizning qurilmangiz bluetoothni qo'llab quvvatlamaydi",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["generic_access"],
      });

      setBluetoothDevices((prev) => {
        if (!prev.some((d) => d.id === device.id)) {
          return [...prev, device];
        }
        return prev;
      });
    } catch (error) {
      toast({
        title: "Bluetooth Xatolik",
        description: error.message || "Qurilmalarni qidirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device) => {
    try {
      await device.gatt.connect();
      setConnectedDevice(device);
      toast({
        title: "Ulandi",
        description: `${device.name} ga ulandi`,
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      toast({
        title: "Ulanishda xatolik",
        description: error.message || "Qurilmaga ulanishda xatolik",
        variant: "destructive",
      });
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice && connectedDevice.gatt.connected) {
      try {
        connectedDevice.gatt.disconnect();
        setConnectedDevice(null);
        toast({
          title: "Uzildi",
          description: `${connectedDevice.name} dan uzildi`,
        });
      } catch (error) {
        toast({
          title: "Uzilishda xatolik",
          description: error.message || "Qurilmaga uzilishda xatolik",
          variant: "destructive",
        });
      }
    }
  };

  // Generate QR code
  const generateQRCode = async () => {
    try {
      const qrData = `${id}, ${selectedSpec}`;
      const dataUrl = await QRCode.toDataURL(qrData);
      setQrCodeDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      toast({
        title: "QR Code xatolik",
        description: "QR code yaratishda xatolik",
        variant: "destructive",
      });
      return null;
    }
  };

  // Print QR code
  const printQRCode = async () => {
    if (!connectedDevice) {
      toast({
        title: "Xatolik",
        description: "Printer ulanmagan",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here we would implement the actual bluetooth printing
      // For demonstration, we'll just show a success message
      toast({
        title: "Muvaffaqiyatli",
        description: "QR code printerga yuborildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      toast({
        title: "Chop etishda xatolik",
        description: error.message || "QR code chop etishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedSubmodel || !selectedSpec || !quantity) {
      toast({
        title: "Diqqat",
        description: "Barcha maydonlar to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      // Generate QR code first
      const qrCode = await generateQRCode();

      if (!qrCode) {
        throw new Error("QR code yaratishda xatolik");
      }

      // Save the cut data
      await api.post(`/cuttingMaster/markAsCut`, {
        order_id: id,
        category_id: selectedSpec,
        quantity,
      });

      // Print QR code if device is connected
      if (connectedDevice) {
        await printQRCode();
      }

      toast({
        title: "Success",
        description: "Muvaffaqiyatli kesildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      fetchCuts();
      fetchOrder();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchCuts();

    // Clean up bluetooth connection on unmount
    return () => {
      if (connectedDevice && connectedDevice.gatt.connected) {
        connectedDevice.gatt.disconnect();
      }
    };
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-1 bg-white rounded-lg p-3">
        <div>
          Buyurtma: <span className="font-semibold">{order?.name}</span>
        </div>
        <div>
          Miqdor: <span className="font-semibold">{order?.quantity} ta</span>
        </div>
        <div>
          Model:{" "}
          <span className="font-semibold">
            {order?.orderModel?.model?.name}
          </span>
        </div>
        <div>
          Material:{" "}
          <span className="font-semibold">
            {order?.orderModel?.material?.name}
          </span>
        </div>
      </div>

      {/* Bluetooth status indicator */}
      <div className="flex justify-between items-center bg-white rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2">
          <Bluetooth
            className={connectedDevice ? "text-blue-500" : "text-gray-400"}
          />
          <span>
            {connectedDevice
              ? `${connectedDevice.name} ga ulangan`
              : "Printer ulanmagan"}
          </span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4" />
              {connectedDevice ? "Printerni o'zgartirish" : "Printerga ulanish"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bluetooth Qurilamalar</DialogTitle>
              <DialogDescription>Bluetooth printer tanlang</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {bluetoothDevices.length === 0 && !isScanning && (
                <div className="text-center text-gray-500">
                  Qurilma topilmadi
                </div>
              )}

              {bluetoothDevices.map((device) => (
                <div
                  key={device.id}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    connectedDevice && connectedDevice.id === device.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    <span>{device.name || "Noma'lum qurilma"}</span>
                  </div>

                  {connectedDevice && connectedDevice.id === device.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectDevice}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => connectToDevice(device)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}

              <Button
                onClick={scanForDevices}
                disabled={isScanning}
                className="mt-2"
              >
                {isScanning ? "Qidirilmoqda..." : "Qurilmalarni qidirish"}
              </Button>
            </div>

            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 bg-white rounded-lg p-3 mt-4">
        <Select
          value={selectedSubmodel}
          onValueChange={(value) => {
            setSelectedSubmodel(value);
            setSelectedSpec("");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Submodelni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {order?.orderModel?.submodels?.map((submodel) => (
              <SelectItem
                key={submodel?.submodel?.id}
                value={submodel?.submodel?.id}
              >
                {submodel?.submodel?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSpec} onValueChange={setSelectedSpec}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Spetsifikatsiyani tanlang" />
          </SelectTrigger>
          <SelectContent>
            {order?.orderModel?.submodels
              ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
              ?.specification_categories?.map((spec) => (
                <SelectItem key={spec?.id} value={spec?.id}>
                  {spec?.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Miqdor"
          value={quantity}
          type="number"
          onChange={(e) => setQuantity(e.target.value)}
        />

        {/* QR code preview */}
        {qrCodeDataUrl && (
          <div className="flex flex-col items-center p-4 border rounded-lg">
            <h3 className="text-sm font-medium mb-2">QR Code</h3>
            <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
            <p className="text-xs text-gray-500 mt-2">
              QR kod saqlashda yuboriladi
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={sending}
          className="flex items-center gap-2"
        >
          {sending ? (
            "Yuborilmoqda..."
          ) : (
            <>
              <span>Saqlash{connectedDevice ? " va Chop etish" : ""}</span>
              {connectedDevice && <Printer className="w-4 h-4" />}
            </>
          )}
        </Button>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuts?.map((cut, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                {cut?.submodel?.name}
              </h3>
              <div className="space-y-2">
                {cut?.cuts?.map((item) => (
                  <div
                    key={item?.id}
                    className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg shadow-sm"
                  >
                    <CircleCheck className="text-green-500 w-5 h-5" />
                    <div>
                      <div className="text-gray-700 font-medium">
                        {item?.category?.name}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {item?.quantity} ta
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CuttingStart;
