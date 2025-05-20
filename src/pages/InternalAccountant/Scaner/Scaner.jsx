import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const Scaner = () => {
  const { toast } = useToast();

  const [scannedData, setScannedData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const getData = useCallback(async () => {
    if (!scannedData) return; // Don't fetch if scannedData is empty

    setIsLoading(true);
    try {
      const response = await api.get(
        `/internalAccountant/dailyPlan/${scannedData.split("A")[1]}`
      );
      setData(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Nimadir xato ketdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [scannedData, toast]); // Add toast to dependencies

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      getData();
    }, 300); // Debounce the API call

    return () => clearTimeout(debounceTimeout); // Cleanup timeout on unmount or scannedData change
  }, [scannedData, getData]);

  return (
    <>
      <div className="flex items-center gap-2">
        ID:{" "}
        <Input
          autoFocus
          className="bg-white"
          onChange={(e) => {
            // Remove the unnecessary setTimeout and split logic here
            setScannedData(e.target.value);
          }}
          value={scannedData} // Controlled component
          disabled={isLoading}
          placeholder={isLoading ? "Loading..." : "Scan ID"}
        />
      </div>
      {data && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

export default Scaner;
