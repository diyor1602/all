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

  // Updated printQRCode function specifically for SK58 Mobile Label Printer
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
      setSending(true);

      // Step 1: Connect to the GATT server if not already connected
      const server = await connectedDevice.gatt.connect();

      // Step 2: Get the print service - SK58 typically uses this service UUID
      const printService = await server.getPrimaryService(
        "49535343-FE7D-4AE5-8FA9-9FAFD205E455"
      );

      // Step 3: Get the write characteristic
      const writeCharacteristic = await printService.getCharacteristic(
        "49535343-8841-43F4-A8D4-ECBE34729BB3"
      );

      // Step 4: Get the notify characteristic for receiving printer status
      const notifyCharacteristic = await printService.getCharacteristic(
        "49535343-1E4D-4BD9-BA61-23C647249616"
      );

      // Enable notifications to receive printer status
      await notifyCharacteristic.startNotifications();

      notifyCharacteristic.addEventListener(
        "characteristicvaluechanged",
        (event) => {
          const value = event.target.value;
          const status = new Uint8Array(value.buffer);
          console.log("Printer status:", status);
          // You can check printer status here (paper out, etc.)
        }
      );

      // Step 5: Prepare the print data for SK58 printer
      const printData = await prepareSK58PrintData(qrCodeDataUrl);

      // Send data in chunks (SK58 typically has a small buffer)
      const CHUNK_SIZE = 512; // May need adjustment based on your printer

      for (let i = 0; i < printData.length; i += CHUNK_SIZE) {
        const chunk = printData.slice(i, i + CHUNK_SIZE);
        await writeCharacteristic.writeValue(chunk);

        // Small delay between chunks to prevent buffer overflow
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "QR code printerga yuborildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      console.error("Printing error:", error);
      toast({
        title: "Chop etishda xatolik",
        description: error.message || "QR code chop etishda xatolik",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Helper function specifically for SK58 printer
  const prepareSK58PrintData = async (qrCodeDataUrl) => {
    try {
      // 1. Get the raw image data from the data URL
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();

      // 2. Convert to image for processing
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size to match the printer's print width (typically 384 pixels for SK58)
      const printerWidth = 384;
      const scaleFactor = printerWidth / imageBitmap.width;
      const scaledHeight = Math.floor(imageBitmap.height * scaleFactor);

      canvas.width = printerWidth;
      canvas.height = scaledHeight;

      // Draw the image scaled to fit the printer width
      ctx.drawImage(imageBitmap, 0, 0, printerWidth, scaledHeight);

      // Get the image data
      const imageData = ctx.getImageData(0, 0, printerWidth, scaledHeight);
      const pixelData = imageData.data;

      // 3. Convert to monochrome bitmap in ESC/POS format
      // Each byte represents 8 pixels (1 bit per pixel)
      const bytesPerLine = Math.ceil(printerWidth / 8);
      const monoData = new Uint8Array(bytesPerLine * scaledHeight);

      // Convert RGBA to monochrome
      for (let y = 0; y < scaledHeight; y++) {
        for (let x = 0; x < printerWidth; x++) {
          const pixelIndex = (y * printerWidth + x) * 4;
          const r = pixelData[pixelIndex];
          const g = pixelData[pixelIndex + 1];
          const b = pixelData[pixelIndex + 2];

          // Calculate grayscale value and convert to black or white
          const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
          const isBitSet = grayValue < 128; // Dark pixels become 1, light pixels become 0

          if (isBitSet) {
            const byteIndex = y * bytesPerLine + Math.floor(x / 8);
            const bitPosition = 7 - (x % 8); // Most significant bit first
            monoData[byteIndex] |= 1 << bitPosition;
          }
        }
      }

      // 4. Prepare ESC/POS commands for QR code printing
      // Initialize printer
      const init = new Uint8Array([
        0x1b,
        0x40, // ESC @ - Initialize printer
        0x1b,
        0x61,
        0x01, // ESC a 1 - Center alignment
      ]);

      // Add text above QR code
      const textHeader = new TextEncoder().encode(`Order: ${id}\n`);

      // Set bitmap mode command
      const bitmapCommand = new Uint8Array([
        0x1d,
        0x76,
        0x30,
        0x00, // GS v 0 - Print raster bit image
        printerWidth & 0xff,
        (printerWidth >> 8) & 0xff, // Width in pixels (little endian)
        scaledHeight & 0xff,
        (scaledHeight >> 8) & 0xff, // Height in pixels (little endian)
      ]);

      // Add line feeds and cut command
      const footer = new Uint8Array([
        0x0a,
        0x0a,
        0x0a,
        0x0a, // Line feeds for spacing after print
        0x1d,
        0x56,
        0x42,
        0x00, // GS V B - Paper cut
      ]);

      // Combine all parts
      const fullCommand = concatenateArrays([
        init,
        textHeader,
        bitmapCommand,
        monoData,
        footer,
      ]);

      return fullCommand;
    } catch (error) {
      console.error("Error preparing print data:", error);
      throw new Error("QR code formatini tayyorlashda xatolik");
    }
  };

  // Helper function to concatenate multiple Uint8Arrays
  const concatenateArrays = (arrays) => {
    // Calculate total length
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);

    // Create a new array with the total length
    const result = new Uint8Array(totalLength);

    // Copy each array into the result
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  };

  // Debug function to test Bluetooth connection before printing
  const testBluetoothConnection = async () => {
    if (!connectedDevice) {
      toast({
        title: "Xatolik",
        description: "Printer ulanmagan",
        variant: "destructive",
      });
      return;
    }

    try {
      // Connect to GATT server
      const server = await connectedDevice.gatt.connect();

      // Get all available services for debugging
      const services = await server.getPrimaryServices();
      console.log("Available services:", services);

      for (const service of services) {
        console.log("Service:", service.uuid);
        const characteristics = await service.getCharacteristics();

        console.log("Characteristics:");
        for (const char of characteristics) {
          console.log(" - UUID:", char.uuid);
          console.log(
            " - Properties:",
            Object.keys(char.properties).filter((p) => char.properties[p])
          );
        }
      }

      toast({
        title: "Test muvaffaqiyatli",
        description:
          "Bluetooth ulanish sinovidan o'tdi, xizmatlar ro'yxati konsolda",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
    } catch (error) {
      console.error("Bluetooth test error:", error);
      toast({
        title: "Bluetooth test xatoligi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add this button just below the Bluetooth connection section for debugging
  <Button
    onClick={testBluetoothConnection}
    variant="outline"
    size="sm"
    className="mt-2"
  >
    Test Bluetooth Connection
  </Button>;

  // Update the handleSave function to use the new printQRCode function:
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
        title: "Muvaffaqiyatli",
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
