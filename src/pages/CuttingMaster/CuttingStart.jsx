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
import { ReceiptPrinter } from "@point-of-sale/receipt-printer-encoder";

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

  // Updated printing functions
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

      // Get the printer service
      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb"
      );

      // Get the characteristic for writing data
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );

      // Prepare the print data using the receipt printer library
      const printData = await preparePrintDataWithLibrary();

      // Send data to printer in chunks with proper delays
      const CHUNK_SIZE = 20; // Small chunks to prevent buffer overflow

      for (let i = 0; i < printData.length; i += CHUNK_SIZE) {
        const chunk = printData.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);

        // Add delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

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
      console.error("Printing error:", error);
      toast({
        title: "Chop etishda xatolik",
        description: error.message || "QR code chop etishda xatolik",
        variant: "destructive",
      });
      return false;
    }
  };

  // Using the new receipt-printer-encoder library
  const preparePrintDataWithLibrary = async () => {
    try {
      // Create a new printer instance
      // 58mm is standard for small thermal printers
      const printer = new ReceiptPrinter({
        width: 58, // 58mm standard width for most thermal printers
      });

      // Get info for printing
      const specName =
        order?.orderModel?.submodels
          ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
          ?.specification_categories?.find((spec) => spec?.id === selectedSpec)
          ?.name || "";

      const qrData = `${id}, ${selectedSpec}`;

      // Build the receipt
      printer
        .initialize()
        .align("center")
        .text(order?.name || "Order")
        .newLine()
        // QR code generation
        .qrCode(qrData, {
          errorCorrection: "L", // Low error correction
          size: 8, // Size 8 (out of 16) - good balance for readability
          model: 2, // QR Model 2 is the most commonly supported
        })
        .newLine()
        .text(`Order: ${id}`)
        .newLine()
        .text(specName)
        .newLine(2)
        .cut("full");

      // Get the resulting command buffer
      return printer.getBuffer();
    } catch (error) {
      console.error("Error preparing print data:", error);
      throw error;
    }
  };

  // Alternative approach using direct ESC/POS commands
  // Use this if you cannot install the library for any reason
  const printWithDirectCommands = async () => {
    if (!connectedDevice) {
      toast({
        title: "Xatolik",
        description: "Printer ulanmagan",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Connect to the printer
      const server = await connectedDevice.gatt.connect();
      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb"
      );
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );

      // Prepare data
      const qrData = `${id}, ${selectedSpec}`;
      const specName =
        order?.orderModel?.submodels
          ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
          ?.specification_categories?.find((spec) => spec?.id === selectedSpec)
          ?.name || "";

      // Create command buffer using direct ESC/POS commands
      const encoder = new TextEncoder();
      let commands = [];

      // Initialize printer
      commands.push(0x1b, 0x40); // ESC @

      // Center alignment
      commands.push(0x1b, 0x61, 0x01); // ESC a 1

      // Print header text
      const headerText = encoder.encode(`${order?.name || "Order"}\n`);
      commands = [...commands, ...Array.from(headerText)];

      // QR Code generation
      const qrBytes = encoder.encode(qrData);

      // Set QR code model
      commands.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // GS ( k 4 0 1 A 2 0

      // Set QR code size
      commands.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x08); // GS ( k 3 0 1 C 8

      // Set error correction level
      commands.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30); // GS ( k 3 0 1 E 0 (L level)

      // Store QR code data
      const qrDataLen = qrBytes.length + 3;
      commands.push(
        0x1d,
        0x28,
        0x6b, // GS ( k
        qrDataLen % 256,
        Math.floor(qrDataLen / 256), // pL pH (data length)
        0x31,
        0x50,
        0x30, // 1 P 0 (store data)
        ...Array.from(qrBytes)
      );

      // Print QR code
      commands.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30); // GS ( k 3 0 1 Q 0

      // Print footer text
      const footerText = encoder.encode(`\nOrder: ${id}\n${specName}\n\n\n`);
      commands = [...commands, ...Array.from(footerText)];

      // Cut paper
      commands.push(0x1d, 0x56, 0x41, 0x10); // GS V A 16 (partial cut with feed)

      // Send data in chunks
      const buffer = new Uint8Array(commands);
      const CHUNK_SIZE = 20;

      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

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
      console.error("Printing error:", error);
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
