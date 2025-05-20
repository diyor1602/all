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
import jsPDF from "jspdf";

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

  // Transliteration function for converting Cyrillic to Latin
  const transliterate = (str) => {
    if (!str) return "";

    const cyrillicToLatin = {
      А: "A",
      Б: "B",
      В: "V",
      Г: "G",
      Д: "D",
      Е: "E",
      Ё: "YO",
      Ж: "ZH",
      З: "Z",
      И: "I",
      Й: "Y",
      К: "K",
      Л: "L",
      М: "M",
      Н: "N",
      О: "O",
      П: "P",
      Р: "R",
      С: "S",
      Т: "T",
      У: "U",
      Ф: "F",
      Х: "KH",
      Ц: "TS",
      Ч: "CH",
      Ш: "SH",
      Щ: "SCH",
      Ъ: "",
      Ы: "Y",
      Ь: "",
      Э: "E",
      Ю: "YU",
      Я: "YA",
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };

    return str
      .split("")
      .map((char) => {
        return cyrillicToLatin[char] || char;
      })
      .join("");
  };

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
        title: "Diqqat",
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
    // if (!connectedDevice) {
    //   toast({
    //     title: "Xatolik",
    //     description: "Printer ulanmagan",
    //     variant: "destructive",
    //   });
    //   return false;
    // }

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

  // ESC/POS command generation for text and QR code printing with proper Unicode handling
  // Fix for the preparePrintData function

  const preparePrintData = () => {
    try {
      const specName =
        order?.order_model?.submodels
          ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
          ?.specification_categories?.find((spec) => spec?.id === selectedSpec)
          ?.name || "";

      const categoryName =
        order?.order_model?.submodels?.find(
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

      // Set code page to UTF-8
      const setUTF8 = new Uint8Array([ESC, 0x74, 0x03]); // ESC t 3 (CP437 + international)

      // Text size - slightly larger
      const normalText = new Uint8Array([GS, 0x21, 0x00]); // GS ! 0 - normal size

      // Line feed
      const LF = new Uint8Array([0x0a]); // Line feed
      const lineFeed = new Uint8Array([0x0a, 0x0a]); // Double line feed

      // Extra line feed - 5 line feeds for more space after QR code
      const extraLineFeed = new Uint8Array([0x0a, 0x0a, 0x0a, 0x0a, 0x0a]);

      // Paper cut
      const cut = new Uint8Array([GS, 0x56, 0x41, 0x10]); // GS V A 16 - Full cut with feed

      // Text content - first decode any Unicode escape sequences
      const decodeUnicodeEscapes = (str) => {
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
          return String.fromCharCode(Number.parseInt(hex, 16));
        });
      };

      const orderIdText = decodeUnicodeEscapes(`${order?.id}, ${order?.name}`);
      const categoryIdText = decodeUnicodeEscapes(`${categoryName}`);
      const specNameText = decodeUnicodeEscapes(`${specName}`);

      // For text encoding, use an alternative approach - encode to binary
      // Many thermal printers only support certain code pages, so we'll use a simple mapping
      // that will work with most standard code pages (including CP437, CP850, CP866)
      const textToBytes = (text) => {
        // Transliterate the text first
        const transliterated = transliterate(text);

        // Now convert to bytes using ASCII (which most printers support)
        const result = [];
        for (let i = 0; i < transliterated.length; i++) {
          const code = transliterated.charCodeAt(i);
          // Only include ASCII codes 0-127 to ensure compatibility
          if (code < 128) {
            result.push(code);
          } else {
            // Replace non-ASCII with '?'
            result.push(0x3f);
          }
        }
        return new Uint8Array(result);
      };

      // Convert text to bytes
      const orderIdBytes = textToBytes(orderIdText);
      const categoryIdBytes = textToBytes(categoryIdText);
      const specNameBytes = textToBytes(specNameText);

      // For QR code data, use standard UTF-8 encoding which is supported by QR
      const encoder = new TextEncoder();
      const qrDataBytes = encoder.encode(qrData);
      const qrDataLength = qrDataBytes.length;

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

      const qrSize = new Uint8Array([
        GS,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x43,
        0x08, // Changed to 14 (even larger size, max is 16)
      ]);

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
        setUTF8.length +
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
        extraLineFeed.length + // Using extraLineFeed here
        cut.length;

      const result = new Uint8Array(combinedLength);

      let offset = 0;
      result.set(init, offset);
      offset += init.length;
      result.set(setUTF8, offset);
      offset += setUTF8.length;
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

      // Add extra line feed (more space after QR)
      result.set(extraLineFeed, offset);
      offset += extraLineFeed.length;

      // Add cut command
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
        if (
          !window.confirm("Printer ulanmagan. Qo'lda chop etishni xohlaysizmi?")
        ) {
          // Print the QR Code and wait for confirmation
          const printSuccess = await printQRCode();
          if (!printSuccess) {
            throw new Error("QR code chop etishda xatolik");
          }
        } else {
          // download qr code with text as PDF
          const qrData = `${id}, ${selectedSpec}`;

          // Get specification and category names
          const specName =
            order?.order_model?.submodels
              ?.find((submodel) => submodel?.submodel?.id === selectedSubmodel)
              ?.specification_categories?.find(
                (spec) => spec?.id === selectedSpec
              )?.name || "";

          const categoryName =
            order?.order_model?.submodels?.find(
              (submodel) => submodel?.submodel?.id === selectedSubmodel
            )?.submodel?.name || "";

          // Generate QR code
          QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "H",
            margin: 1,
            scale: 8,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          })
            .then((dataUrl) => {
              // Create a new PDF document in A4 format
              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
              });

              // Transliterate all text for PDF
              const orderName = transliterate(order?.name || "");
              const modelName = transliterate(
                order?.order_model?.model?.name || ""
              );
              const materialName = transliterate(
                order?.order_model?.material?.name || "-"
              );
              const transliteratedCategoryName = transliterate(categoryName);
              const transliteratedSpecName = transliterate(specName);

              // Add title
              pdf.setFontSize(20);
              pdf.setFont("helvetica", "bold");
              pdf.text(
                "BUYURTMA MA'LUMOTLARI",
                pdf.internal.pageSize.getWidth() / 2,
                20,
                { align: "center" }
              );

              // Add order details with more information
              pdf.setFontSize(12);
              pdf.setFont("helvetica", "normal");

              // Left margin for text
              const leftMargin = 20;
              let yPosition = 40;

              // Add order information
              pdf.setFont("helvetica", "bold");
              pdf.text("Buyurtma ma'lumotlari:", leftMargin, yPosition);
              pdf.setFont("helvetica", "normal");
              yPosition += 8;

              pdf.text(`Buyurtma ID: ${id}`, leftMargin, yPosition);
              yPosition += 8;

              pdf.text(`Buyurtma nomi: ${orderName}`, leftMargin, yPosition);
              yPosition += 8;

              pdf.text(
                `Miqdor: ${order?.quantity || ""} ta`,
                leftMargin,
                yPosition
              );
              yPosition += 8;

              pdf.text(`Model: ${modelName}`, leftMargin, yPosition);
              yPosition += 8;

              pdf.text(`Material: ${materialName}`, leftMargin, yPosition);
              yPosition += 15;

              // Add specification information
              pdf.setFont("helvetica", "bold");
              pdf.text("Spetsifikatsiya ma'lumotlari:", leftMargin, yPosition);
              pdf.setFont("helvetica", "normal");
              yPosition += 8;

              pdf.text(
                `Kategoriya: ${transliteratedCategoryName}`,
                leftMargin,
                yPosition
              );
              yPosition += 8;

              pdf.text(
                `Spetsifikatsiya: ${transliteratedSpecName}`,
                leftMargin,
                yPosition
              );
              yPosition += 8;

              pdf.text(
                `Kesilgan miqdor: ${quantity} ta`,
                leftMargin,
                yPosition
              );
              yPosition += 8;

              pdf.text(
                `Sana: ${new Date().toLocaleDateString("ru-RU")}`,
                leftMargin,
                yPosition
              );
              yPosition += 20;

              // Create an image element to get dimensions
              const qrImage = new Image();
              qrImage.crossOrigin = "anonymous";
              qrImage.src = dataUrl;

              qrImage.onload = () => {
                // Calculate dimensions to maintain aspect ratio
                const imgWidth = 80; // mm
                const imgHeight = (qrImage.height * imgWidth) / qrImage.width;

                // Add QR code to PDF (centered)
                const xPosition =
                  (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
                pdf.addImage(
                  dataUrl,
                  "PNG",
                  xPosition,
                  yPosition,
                  imgWidth,
                  imgHeight
                );

                // Add QR code description below the image
                const qrBottomY = yPosition + imgHeight + 10;
                pdf.setFontSize(10);
                pdf.text(
                  `QR kod ma'lumotlari: ${qrData}`,
                  pdf.internal.pageSize.getWidth() / 2,
                  qrBottomY,
                  {
                    align: "center",
                  }
                );

                // Add footer
                const footerY = pdf.internal.pageSize.getHeight() - 10;
                pdf.setFontSize(8);
                pdf.text(
                  `Yaratilgan vaqt: ${new Date().toLocaleString("ru-RU")}`,
                  pdf.internal.pageSize.getWidth() / 2,
                  footerY,
                  { align: "center" }
                );

                // Save the PDF
                pdf.save(`Buyurtma-${id}-${selectedSpec}.pdf`);
              };
            })
            .catch((err) => {
              toast({
                title: "QR Code xatolik",
                description: "QR code yaratishda xatolik",
                variant: "destructive",
              });
              console.error("QR code error:", err);
            });
        }
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
          Buyurtma: <span className="font-semibold">{order?.name}</span> #
          {order?.id}
        </div>
        <div>
          Miqdor: <span className="font-semibold">{order?.quantity} ta</span>
        </div>
        <div>
          Model:{" "}
          <span className="font-semibold">
            {order?.order_model?.model?.name}
          </span>
        </div>
        <div>
          Material:{" "}
          <span className="font-semibold">
            {order?.order_model?.material?.name || "-"}
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
                Yopish
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
            {order?.order_model?.submodels?.map((submodel) => (
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
            {order?.order_model?.submodels
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
              Buyurtmani yakunlashga tayyormizmi?
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
