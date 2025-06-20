"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, QrCode, RefreshCw, Zap } from "lucide-react";

const NakladnoySkanner = () => {
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const inputRef = useRef(null);
  const [data, setData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const resetForm = () => {
    setCode("");
    setData(null);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;

    // If the value contains multiple A prefixes, only keep the first complete entry
    if (value.indexOf("A", 1) !== -1) {
      const firstCompleteEntry = value.substring(0, value.indexOf("A", 1));
      setCode(firstCompleteEntry);
    } else {
      setCode(value);
    }

    // Always keep the input focused
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (data) {
      setCode("");
      inputRef.current?.focus();
    }
  }, [data]);

  const handleScan = () => {
    if (!code) return;

    try {
      setIsScanning(true);

      const employeeID = code.split("-")[1] || code;
      const date = code.split("-")[0];

      toast({
        title: "Muvaffaqiyatli",
        description: "Ma'lumotlar muvaffaqiyatli yuklandi",
        variant: "default",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kodni o'qishda xatolik",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vazifa Skaneri</h1>
        <p className="text-muted-foreground">
          Xodimlar va vazifalarni skanerlash va ma'lumotlarni ko'rish uchun
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <span>Vazifa kodi</span>
          </CardTitle>
          <CardDescription>
            Vazifa kodini kiriting yoki skaner orqali o'qiting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Kodni kiriting"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleScan();
                }
              }}
              autoFocus
            />
            {isScanning && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={!code && !data}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tozalash
          </Button>
          <Button onClick={handleScan} disabled={!code || isScanning}>
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skanerlanmoqda...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Skanerlash
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NakladnoySkanner;
