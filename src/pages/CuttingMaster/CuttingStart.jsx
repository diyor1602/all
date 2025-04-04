"use client";

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
import { CircleCheck, Bluetooth, Printer, LoaderCircle } from "lucide-react";
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

  // Simple text printing approach that just sends formatted text commands to the printer
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

      // Prepare simple print data with ESC/POS commands
      const printData = preparePrintData();

      // Send data to printer in chunks
      const CHUNK_SIZE = 512;
      for (let i = 0; i < printData.length; i += CHUNK_SIZE) {
        const chunk = printData.slice(
          i,
          Math.min(i + CHUNK_SIZE, printData.length)
        );
        await characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumot printerga yuborildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      return true;
    } catch (error) {
      toast({
        title: "Chop etishda xatolik",
        description: error.message || "Chop etishda xatolik",
        variant: "destructive",
      });
      return false;
    }
  };

  // ESC/POS command generation for text and QR code printing
  // ESC/POS command generation for text and QR code printing with proper Cyrillic support
  const preparePrintData = () => {
    try {
      // Get specification name
      const specName =
        order?.orderModel?.submodels
          ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
          ?.specification_categories?.find((spec) => spec?.id === selectedSpec)
          ?.name || "";

      const categoryName =
        order?.orderModel?.submodels?.find(
          (submodel) => submodel?.submodel?.id === selectedSubmodel
        )?.submodel?.name || "";

      // QR code data - fix format to avoid issues
      const qrData = `${id}, ${selectedSpec}`;

      // ESC/POS commands
      const ESC = 0x1b;
      const GS = 0x1d;

      // Initialize printer
      const init = new Uint8Array([ESC, 0x40]); // ESC @

      // Center alignment
      const center = new Uint8Array([ESC, 0x61, 0x01]); // ESC a 1

      // Set code page to support Cyrillic (CP866 - Russian)
      const codePage = new Uint8Array([ESC, 0x74, 0x11]); // ESC t 17 for CP866

      // Text size - slightly larger
      const normalText = new Uint8Array([GS, 0x21, 0x00]); // GS ! 0 - normal size

      // Line feed
      const LF = new Uint8Array([0x0a]); // Line feed
      const lineFeed = new Uint8Array([0x0a, 0x0a]); // Double line feed

      // Paper cut
      const cut = new Uint8Array([GS, 0x56, 0x41, 0x10]); // GS V A 16 - Full cut with feed

      // Text content
      const orderIdText = `${(order?.id, order?.name)}`;
      const categoryIdText = `${categoryName}`;
      const specNameText = `${specName}`;

      // Convert text to bytes with a specialized function for Cyrillic
      const cyrillicToBytes = (text) => {
        // Handle CP866 encoding (Russian Cyrillic) manually
        // This is a simple implementation - a full solution would map all Cyrillic characters
        const result = [];
        for (let i = 0; i < text.length; i++) {
          const char = text.charAt(i);
          const code = text.charCodeAt(i);

          // ASCII characters (0-127) pass through unchanged
          if (code < 128) {
            result.push(code);
          }
          // Basic Cyrillic mapping for CP866
          else if (code >= 0x0410 && code <= 0x044f) {
            // Russian alphabet (А-Я, а-я) with special mapping for CP866
            // This is a simplified mapping - a complete solution would map all characters
            if (code >= 0x0410 && code <= 0x042f) {
              // Uppercase А-Я (0x0410-0x042F) -> CP866 (0x80-0x9F)
              result.push(0x80 + (code - 0x0410));
            } else {
              // Lowercase а-я (0x0430-0x044F) -> CP866 (0xA0-0xBF)
              result.push(0xa0 + (code - 0x0430));
            }
          }
          // For other characters, use a fallback or '?'
          else {
            result.push(0x3f); // '?'
          }
        }
        return new Uint8Array(result);
      };

      const orderIdBytes = cyrillicToBytes(orderIdText);
      const categoryIdBytes = cyrillicToBytes(categoryIdText);
      const specNameBytes = cyrillicToBytes(specNameText);

      // QR Code commands for thermal printer - Standard ESC/POS
      // Select model (model 2 - standard QR Code)
      const qrModelSelect = new Uint8Array([
        GS,
        0x28,
        0x6b,
        0x04,
        0x00,
        0x31,
        0x41,
        0x32,
        0x00,
      ]); // GS ( k 4 0 49 65 50 0 - select QR code, model 2

      // Set QR code size (1-16) - choosing 8 here
      const qrSize = new Uint8Array([
        GS,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x43,
        0x08,
      ]); // GS ( k 3 0 49 67 8 - size 8

      // Set error correction level (48-51 for L,M,Q,H) - using H (51) for best
      const qrErrorCorrection = new Uint8Array([
        GS,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x45,
        0x33,
      ]); // GS ( k 3 0 49 69 51 - level H

      // For QR code, we use standard UTF-8 encoding
      const encoder = new TextEncoder();
      const qrDataBytes = encoder.encode(qrData);
      const qrDataLength = qrDataBytes.length;

      // pL pH store the length of the data + 3
      const pL = (qrDataLength + 3) % 256;
      const pH = Math.floor((qrDataLength + 3) / 256);

      const qrStoreData = new Uint8Array([
        GS,
        0x28,
        0x6b,
        pL,
        pH,
        0x31,
        0x50,
        0x30,
      ]); // GS ( k pL pH 49 80 48

      // Print QR code
      const qrPrint = new Uint8Array([
        GS,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x51,
        0x30,
      ]); // GS ( k 3 0 49 81 48

      // Calculate total length
      const combinedLength =
        init.length +
        codePage.length + // Added code page command
        center.length +
        normalText.length +
        orderIdBytes.length +
        LF.length +
        normalText.length +
        categoryIdBytes.length +
        LF.length +
        specNameBytes.length +
        lineFeed.length +
        qrModelSelect.length +
        qrSize.length +
        qrErrorCorrection.length +
        qrStoreData.length +
        qrDataBytes.length +
        qrPrint.length +
        lineFeed.length +
        cut.length;

      const result = new Uint8Array(combinedLength);

      let offset = 0;
      result.set(init, offset);
      offset += init.length;
      result.set(codePage, offset); // Set code page for Cyrillic
      offset += codePage.length;
      result.set(center, offset);
      offset += center.length;
      result.set(normalText, offset);
      offset += normalText.length;
      result.set(orderIdBytes, offset);
      offset += orderIdBytes.length;
      result.set(LF, offset);
      offset += LF.length;
      result.set(normalText, offset);
      offset += normalText.length;
      result.set(categoryIdBytes, offset);
      offset += categoryIdBytes.length;
      result.set(LF, offset);
      offset += LF.length;
      result.set(specNameBytes, offset);
      offset += specNameBytes.length;
      result.set(lineFeed, offset);
      offset += lineFeed.length;

      // Add QR code
      result.set(qrModelSelect, offset);
      offset += qrModelSelect.length;
      result.set(qrSize, offset);
      offset += qrSize.length;
      result.set(qrErrorCorrection, offset);
      offset += qrErrorCorrection.length;
      result.set(qrStoreData, offset);
      offset += qrStoreData.length;
      result.set(qrDataBytes, offset);
      offset += qrDataBytes.length;
      result.set(qrPrint, offset);
      offset += qrPrint.length;
      result.set(lineFeed, offset);
      offset += lineFeed.length;
      result.set(cut, offset);

      return result;
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumot tayyorlashda xatolik",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Optional: Generate a QR code for preview only (not for printing)
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
            <img
              src={qrCodeDataUrl || "/placeholder.svg"}
              alt="QR Code"
              className="w-32 h-32"
            />
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
