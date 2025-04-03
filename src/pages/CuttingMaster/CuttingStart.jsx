import { useParams, useNavigate } from "react-router-dom";
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
import { CircleCheck, Bluetooth, Printer, X, LoaderCircle } from "lucide-react";
import QRCode from "qrcode";
// No need for pdf-lib imports anymore

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
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
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Bluetooth states
  const [bluetoothDevices, setBluetoothDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  // Removed pdfBytes state since we're not using PDFs anymore

  const { id } = useParams();
  const navigate = useNavigate();

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cuttingMaster/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
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
        description: error.response?.data?.message || "Nimadir xato ketdi",
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
        optionalServices: [
          "generic_access",
          "000018f0-0000-1000-8000-00805f9b34fb",
          "00002af1-0000-1000-8000-00805f9b34fb",
        ],
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

  // Generate QR code data URL
  const generateQRCode = async () => {
    try {
      const qrData = `${id}, ${selectedSpec}`;
      const dataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "H",
        margin: 1,
        scale: 8,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
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

  // We're no longer using PDF generation, so this function is removed

  // Print QR code using direct Bluetooth approach
  const printQRCode = async () => {
    if (!connectedDevice) {
      toast({
        title: "Xatolik",
        description: "Printer ulanmagan",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Connect to the printer's service
      const server = await connectedDevice.gatt.connect();

      // Get the printer service - SK58 typically uses a custom service
      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb"
      );

      // Get the characteristic for writing data
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );

      // Create simple ESC/POS commands for a clean print
      const encoder = new TextEncoder();

      // Initialize printer
      let initCommand = new Uint8Array([
        0x1b,
        0x40, // ESC @ - Initialize printer
        0x1b,
        0x61,
        0x01, // ESC a 1 - Center alignment
      ]);
      await characteristic.writeValue(initCommand);

      // Header text - Order number
      // const specName =
      //   order?.orderModel?.submodels
      //     ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
      //     ?.specification_categories?.find((spec) => spec?.id === selectedSpec)
      //     ?.name || "";

      // const orderText = encoder.encode(`Order: ${id}\n${specName}\n\n`);
      // await characteristic.writeValue(orderText);

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now send the QR code data
      if (!qrCodeDataUrl) {
        await generateQRCode();
      }

      // Convert QR code image to printer-readable format
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = qrCodeDataUrl;
      });

      // Create a canvas to process the image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set size to ensure it fits on thermal paper (most are 384px wide)
      canvas.width = 384;
      canvas.height = 384;

      // Fill with white and draw QR centered
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - 350) / 2, 10, 350, 350);

      // Send QR as image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Simplified ESC/POS image data format (bitmap mode)
      // Set line spacing to 0
      await characteristic.writeValue(new Uint8Array([0x1b, 0x33, 0]));

      // For each line of the QR code
      const byteWidth = Math.ceil(canvas.width / 8);
      for (let y = 0; y < canvas.height; y += 24) {
        // Limit height to remaining pixels (for the last row)
        const printHeight = Math.min(24, canvas.height - y);
        if (printHeight <= 0) break;

        // ESC * - Print bitmap graphics
        const header = new Uint8Array([
          0x1b,
          0x2a,
          33, // ESC * mode
          canvas.width & 0xff, // nL
          (canvas.width >> 8) & 0xff, // nH
        ]);
        await characteristic.writeValue(header);

        // Prepare dot data line by line
        const lineData = new Uint8Array(byteWidth * printHeight);
        let dataIndex = 0;

        for (let subY = 0; subY < printHeight; subY++) {
          for (let x = 0; x < canvas.width; x += 8) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              if (x + bit < canvas.width) {
                const i = ((y + subY) * canvas.width + (x + bit)) * 4;
                // Calculate grayscale value
                const grayscale =
                  imageData.data[i] * 0.299 +
                  imageData.data[i + 1] * 0.587 +
                  imageData.data[i + 2] * 0.114;

                // Set bit if pixel is dark
                if (grayscale < 128) {
                  b |= 0x80 >> bit;
                }
              }
            }
            lineData[dataIndex++] = b;
          }
        }

        // Send line data in chunks to prevent buffer overflows
        for (let i = 0; i < lineData.length; i += 64) {
          const chunk = lineData.slice(i, Math.min(i + 64, lineData.length));
          await characteristic.writeValue(chunk);
          // Small delay between chunks
          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        // Send line feed
        await characteristic.writeValue(new Uint8Array([0x0a]));
      }

      // Reset line spacing and feed extra lines
      await characteristic.writeValue(
        new Uint8Array([
          0x1b,
          0x32, // Reset line spacing
          0x0a,
          0x0a, // Feed a couple of lines
          0x1d,
          0x56,
          0x01, // GS V - Cut paper (partial cut)
        ])
      );

      toast({
        title: "Muvaffaqiyatli",
        description: "QR code printerga yuborildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      return true;
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Chop etishda xatolik",
        description: error.message || "QR code chop etishda xatolik",
        variant: "destructive",
      });
      return false;
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

      // Check if a printer is connected
      if (!connectedDevice) {
        throw new Error("Printer ulanmagan");
      }

      // Print the QR Code and wait for confirmation
      const printSuccess = await printQRCode();
      if (!printSuccess) {
        throw new Error("QR code chop etishda xatolik");
      }

      // If everything is successful, save the cut data
      await api.post(`/cuttingMaster/markAsCut`, {
        order_id: id,
        category_id: selectedSpec,
        quantity,
      });

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
        title: "Xatolik",
        description: error.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await api.get(`/cuttingMaster/finishCutting/${id}`);
      toast({
        title: "Muvaffaqiyatli",
        description: "Buyurtma muvaffaqiyatli tugatildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      navigate("/cuttingMaster/cutting");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 sm:p-6">
        <LoaderCircle className="w-10 h-10 text-purple-700 mb-8 animate-spin" />
      </div>
    );
  }

  if (order?.status !== "cutting") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 sm:p-6">
        <div className="text-3xl font-extrabold text-purple-700 mb-8">
          Buyurtma topilmadi
        </div>
      </div>
    );
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
                      Uzish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => connectToDevice(device)}
                    >
                      Ulash
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
      <Button
        onClick={() => setApproveDialogOpen(true)}
        className="mt-6 w-full"
      >
        Buyurtmani tugatish
      </Button>
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buyurtmani tugatish</DialogTitle>
            <DialogDescription>
              Buyurtmani yakunlashga tayyorsizmi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 items-center justify-end">
              <DialogClose asChild>
                <Button variant="outline">Yo'q</Button>
              </DialogClose>
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? "Yakunlanmoqda" : "Tasdiqlash"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CuttingStart;
