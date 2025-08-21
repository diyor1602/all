import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCheck,
  CirclePlus,
  ClipboardPaste,
  Loader2,
} from "lucide-react";

const NewSpec = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [spec, setSpec] = useState({
    name: "",
    specifications: [
      {
        code: "",
        name: "",
        quantity: 1,
        comment: "",
      },
    ],
  });
  const [saving, setSaving] = useState(false);
  const newRowRef = useRef(null);

  const handleInputChange = (index, field, value) => {
    const updatedSpecifications = [...spec.specifications];
    updatedSpecifications[index] = {
      ...updatedSpecifications[index],
      [field]: field === "quantity" ? parseInt(value) : value,
    };

    setSpec({
      ...spec,
      specifications: updatedSpecifications,
    });
  };

  const addNewRow = () => {
    const newRow = {
      code: "",
      name: "",
      quantity: 1,
      comment: "",
    };

    setSpec({
      ...spec,
      specifications: [...spec.specifications, newRow],
    });

    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.focus();
      }
    }, 0);
  };

  const saveSpecifications = async () => {
    const hasInvalidQuantity = spec?.specifications?.some(
      (item) => item.quantity < 1
    );

    const hasEmptyFields = spec?.specifications?.some(
      (item) => !item?.name || !item?.code
    );

    if (hasEmptyFields) {
      toast({
        title: "Diqqat",
        description: "Spesifikatsiyada nomi va kodi bo'lishi shart",
        variant: "destructive",
      });
      return;
    }

    if (hasInvalidQuantity) {
      toast({
        title: "Diqqat",
        description: "Miqdor 1 dan kam bo'lishi mumkin emas",
        variant: "destructive",
      });
      return;
    }

    // check spec name
    if (!spec?.name) {
      toast({
        title: "Diqqat",
        description: "Spesifikatsiya nomi bo'lishi shart",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await api.post(`/technologist/specification`, {
        data: {
          name: spec?.name,
          submodel_id: parseInt(id),
          specifications: spec?.specifications,
        },
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Spesifikatsiya muvaffaqiyatli saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error?.response?.data?.message ||
          "Spesifikatsiyani saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsedData = JSON.parse(text);
      setSpec(parsedData);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyani nusxa olishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center mb-4 gap-2 ">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        <div className="text-xl font-semibold w-full">
          <Input
            type="text"
            placeholder="Spesifikatsiya nomi"
            className="w-full"
            value={spec?.name}
            onChange={(e) => setSpec({ ...spec, name: e.target.value })}
          />
        </div>
      </div>
      <div className="w-full overflow-auto max-h-[75vh]">
        <table className="my-4 whitespace-nowrap border w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Kodi</th>
              <th className="px-4 py-2 border">Nomi</th>
              <th className="px-4 py-2 border">Miqdori</th>
              <th className="px-4 py-2 border">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {spec?.specifications?.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border text-center">{index + 1}</td>
                <td className="px-4 py-2 border">
                  <Input
                    type="text"
                    placeholder="Kodi"
                    className="w-fit"
                    value={item?.code}
                    ref={
                      index === spec.specifications.length - 1
                        ? newRowRef
                        : null
                    }
                    onChange={(e) =>
                      handleInputChange(index, "code", e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-2 border">
                  <Input
                    className="w-fit"
                    type="text"
                    placeholder="Nomi"
                    value={item?.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-2 border">
                  <Input
                    type="number"
                    step={1}
                    className="w-fit"
                    placeholder="Miqdor"
                    value={item?.quantity}
                    min={1}
                    onChange={(e) =>
                      handleInputChange(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-2 border">
                  <Input
                    type="text"
                    className="w-fit"
                    placeholder="Izoh"
                    value={item?.comment}
                    onChange={(e) =>
                      handleInputChange(index, "comment", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="w-full flex justify-between mt-6 gap-4 flex-wrap">
        <Button
          className="flex items-center gap-2"
          onClick={handlePaste}
          variant="outline"
        >
          <ClipboardPaste className="size-4" /> Joylash
        </Button>
        <div className="flex items-center gap-2 ">
          <Button
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
            onClick={addNewRow}
          >
            <CirclePlus className="size-4" /> Qo'shish
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={saveSpecifications}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Saqlash
          </Button>
        </div>
      </div>
    </>
  );
};

export default NewSpec;
