import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCheck, CirclePlus, Loader2 } from "lucide-react";

const EditSpec = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const newRowRef = useRef(null);

  const fetchSpec = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/constructor/specification/category/${id}`
      );
      setSpec(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyani olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpec();
  }, [id, toast]);

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

    // Focus on the new row after the state update
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.focus();
      }
    }, 0);
  };

  const saveSpecifications = async () => {
    // Check if any quantity is less than 1
    const hasInvalidQuantity = spec?.specifications?.some(
      (item) => item.quantity < 1
    );

    if (hasInvalidQuantity) {
      toast({
        title: "Diqqat",
        description: "Miqdor 1 dan kam bo'lishi mumkin emas",
        variant: "destructive",
      });
      return;
    }

    // check if any name, code is empty
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
      await api.patch(`/constructor/specification/${id}`, {
        name: spec?.name,
        submodel_id: spec?.submodel_id,
        specifications: spec?.specifications,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Spesifikatsiya muvaffaqiyatli saqlandi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });
      fetchSpec();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Spesifikatsiyani saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

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
                    placeholder="Kodi"
                    type="text"
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
                    placeholder="Nomi"
                    type="text"
                    value={item?.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-2 border">
                  <Input
                    type="number"
                    className="w-fit"
                    placeholder="Miqdor"
                    step={1}
                    value={item?.quantity}
                    min={1}
                    onChange={(e) =>
                      handleInputChange(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-2 border">
                  <Input
                    className="w-fit"
                    placeholder="Izoh"
                    type="text"
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
      <div className="w-full flex justify-end mt-6 gap-4 flex-wrap">
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
    </>
  );
};

export default EditSpec;
