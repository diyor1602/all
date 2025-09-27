import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useNavigate, useParams } from "react-router-dom";

const EditGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [group, setGroup] = useState({
    name: "",
    department_id: "",
    responsible_user_id: "",
  });
  const [currentResponsibleUser, setCurrentResponsibleUser] = useState(null);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/superhr/groups/${id}/`);

      setGroup({
        name: res.data.name,
        department_id: res.data.department_id.toString(),
        responsible_user_id: res.data.responsible_user_id.toString(),
      });

      try {
        const userRes = await api.get(
          `/superhr/users/${res.data.responsible_user_id}/`
        );

        const userData = userRes.data.data || userRes.data;

        setCurrentResponsibleUser(userData);
        setUsers((prevUsers) => {
          const userExists = prevUsers.some(
            (user) => user.user_id === userData.user_id
          );
          if (!userExists) {
            return [...prevUsers, userData];
          }
          return prevUsers;
        });
      } catch (error) {
        toast({
          title: "Xatolik!",
          description:
            "Mas'ul xodim ma'lumotlarini yuklashda xatolik yuz berdi",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik!",
        description: error.response?.data?.detail || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/superhr/departments/`);
      setDepartments(res.data);
    } catch (error) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik!",
        description: error.response?.data?.detail || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchDepartments();
  }, [id]);

  const searchUsers = async () => {
    if (usersSearch.length < 3) {
      return;
    }

    try {
      const res = await api.get(`/superhr/employees/?search=${usersSearch}`);
      const searchResults = res.data?.data || [];

      if (currentResponsibleUser) {
        const currentUserInResults = searchResults.some(
          (user) => user.user_id === currentResponsibleUser.user_id
        );

        if (!currentUserInResults) {
          setUsers([currentResponsibleUser, ...searchResults]);
        } else {
          setUsers(searchResults);
        }
      } else {
        setUsers(searchResults);
      }
    } catch (error) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik!",
        description: error.response?.data?.detail || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [usersSearch]);

  const validateForm = () => {
    let isValid = true;

    if (!group.name.trim()) {
      toast({
        title: "Xatolik!",
        description: "Guruh nomini kiriting",
        variant: "destructive",
        duration: 2000,
      });
      isValid = false;
    }

    if (!group.department_id) {
      toast({
        title: "Xatolik!",
        description: "Bo'limni tanlang",
        variant: "destructive",
        duration: 2000,
      });
      isValid = false;
    }

    if (!group.responsible_user_id) {
      toast({
        title: "Xatolik!",
        description: "Mas'ul xodimni tanlang",
        variant: "destructive",
        duration: 2000,
      });
      isValid = false;
    }

    return isValid;
  };

  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: group.name,
        department_id: Number.parseInt(group.department_id),
        responsible_user_id: Number.parseInt(group.responsible_user_id),
      };

      await api.patch(`/superhr/groups/${id}/`, payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Guruh muvaffaqiyatli tahrirlandi",
        style: {
          background: "green",
          color: "white",
        },
        duration: 2000,
      });

      navigate("/superhr/settings/departments");
    } catch (error) {
      toast({
        title: "Xatolik!",
        description:
          error.response?.data?.detail ||
          "Guruhni tahrirlashda xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleEditGroupSubmit}
      className="bg-white p-6 shadow-sm rounded-lg"
    >
      <div className="flex items-center justify-between mb-5 gap-4">
        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
        <div className="text-2xl font-bold">Guruhni tahrirlash</div>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {/* Group Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="group_name">Nomi</Label>
          <Input
            id="group_name"
            name="name"
            value={group.name}
            onChange={(e) => setGroup({ ...group, name: e.target.value })}
            className="col-span-3"
            required
          />
        </div>

        {/* Department Selection */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="group_department">Bo'lim</Label>
          <Select
            value={group.department_id}
            onValueChange={(value) =>
              setGroup({ ...group, department_id: value })
            }
            required
          >
            <SelectTrigger id="group_department" className="col-span-3">
              <SelectValue placeholder="Bo'limni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {departments.flatMap((mainDept) =>
                mainDept.departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {mainDept.name} - {dept.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Current Responsible User Display */}
        {currentResponsibleUser && (
          <div className="flex flex-col gap-2">
            <Label>Joriy mas'ul xodim</Label>
            <div className="p-3 border rounded-md bg-gray-50">
              {currentResponsibleUser.name}
            </div>
          </div>
        )}

        {/* Responsible User Search */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="user_search">Boshqa mas'ul xodimni qidirish</Label>
          <div className="relative">
            <Input
              id="user_search"
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent form submission
                  searchUsers(); // Trigger search
                }
              }}
              className="col-span-3 pr-10"
              placeholder="Xodim ismini kiriting (kamida 3 ta harf)"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={searchUsers}
            >
              <Search className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Qidiruv uchun kamida 3 ta harf kiriting
            {usersSearch.length >= 3 && users.length === 0 && (
              <span className="text-amber-500 block mt-1">
                Xodim topilmadi. Boshqa so'z bilan qidirib ko'ring.
              </span>
            )}
          </p>
        </div>

        {/* Responsible User Selection */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="responsible_user_select">Mas'ul xodim</Label>
          <Select
            value={group.responsible_user_id}
            onValueChange={(value) =>
              setGroup({ ...group, responsible_user_id: value })
            }
            required
          >
            <SelectTrigger id="responsible_user_select" className="col-span-3">
              <SelectValue placeholder="Mas'ul xodimni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user, i) => (
                <SelectItem key={i} value={user.user_id.toString()}>
                  {user.name}{" "}
                  {currentResponsibleUser &&
                  user.user_id === currentResponsibleUser.user_id
                    ? "(Joriy mas'ul)"
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda
            </>
          ) : (
            "Saqlash"
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditGroup;
