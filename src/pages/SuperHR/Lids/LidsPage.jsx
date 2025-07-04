import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CirclePlus, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatPhoneNumber = (value) => {
  if (!value) return "+998";
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, "");
  // Ensure the number starts with 998
  if (!phoneNumber.startsWith("998")) {
    return "+998";
  }
  // Format the phone number
  let formattedNumber = "+";
  for (let i = 0; i < phoneNumber.length; i++) {
    if (i === 3) formattedNumber += " ";
    if (i === 5) formattedNumber += " ";
    if (i === 8) formattedNumber += " ";
    if (i === 10) formattedNumber += " ";
    formattedNumber += phoneNumber[i];
  }
  return formattedNumber;
};

const LidsPage = () => {
  const { toast } = useToast();

  const [lids, setLidsPage] = useState([]);
  const [imageDialog, setImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchLidsPage = async () => {
      try {
        const response = await api.get("/superhr/lids");
        setLidsPage(response.data?.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description:
            error.response?.data?.message || "LidsPage olishda xatolik",
        });
      }
    };
    fetchLidsPage();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nomzodlar</h1>
        <Link to="/superhr/lids/add">
          <Button>
            <CirclePlus /> Qo'shish
          </Button>
        </Link>
      </div>
      <div className="w-full overflow-auto mt-5 text-xs">
        <table className="w-full whitespace-nowrap border border-collapse border-gray-300 bg-white">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">№</th>
              <th className="border border-gray-300 p-2">Ism</th>
              <th className="border border-gray-300 p-2">Rasm</th>
              <th className="border border-gray-300 p-2">Telefon</th>
              <th className="border border-gray-300 p-2">Manzil</th>
              <th className="border border-gray-300 p-2">Tug'ilgan sana</th>
              <th className="border border-gray-300 p-2">Izoh</th>
              <th className="border border-gray-300 p-2">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {lids.map((lid, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-300 p-2">{lid.name}</td>
                <td className="border border-gray-300 p-2">
                  <div className="w-full flex justify-center">
                    {lid.image && (
                      <img
                        src={lid.image}
                        alt={lid.name}
                        className="w-10 h-10 object-cover rounded-full cursor-pointer"
                        onClick={() => {
                          setSelectedImage(lid.image);
                          setImageDialog(true);
                        }}
                      />
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  <a href={`tel:${lid.phone}`}>
                    {formatPhoneNumber(lid.phone)}
                  </a>
                </td>
                <td className="border border-gray-300 p-2">{lid.address}</td>
                <td className="border border-gray-300 p-2 text-center">
                  {lid.birth_day?.split(" ")[0]?.split("-").reverse().join(".")}
                </td>
                <td className="border border-gray-300 p-2">{lid.comment}</td>
                <td className="border border-gray-300 p-2 text-center">
                  <Link to={`/superhr/lids/edit/${lid.id}`}>
                    <Button variant="ghost">
                      <Edit className="text-orange-500 hover:text-orange-600" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rasm</DialogTitle>
          </DialogHeader>
          <div className="w-full h-full max-w-[80vw] max-h-[80vh]">
            <img
              src={selectedImage}
              alt={selectedImage}
              className="w-full h-full object-cover"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LidsPage;
