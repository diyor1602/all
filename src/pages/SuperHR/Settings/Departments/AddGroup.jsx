"use client";

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
import { useNavigate } from "react-router-dom";

const AddGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [newGroup, setNewGroup] = useState({
    name: "",
    department_id: "",
    responsible_user_id: "",
  });

  // Fetch departments on component mount
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
    fetchDepartments();
  }, []);

  // Search users when the search term changes
  const searchUsers = async () => {
    if (usersSearch.length < 3) {
      setUsers([]);
      return;
    }

    try {
      const res = await api.get(`/superhr/employees/?search=${usersSearch}`);
      setUsers(res.data?.data || []);
    } catch (error) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik!",
        description: error.response?.data?.detail || "Xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [usersSearch]); // Changed from users to usersSearch to avoid infinite loop

  // Validate form data
  const validateForm = () => {
    let isValid = true;

    if (!newGroup.name.trim()) {
      toast({
        title: "Xatolik!",
        description: "Guruh nomini kiriting",
        variant: "destructive",
        duration: 2000,
      });
      isValid = false;
    }

    if (!newGroup.department_id) {
      toast({
        title: "Xatolik!",
        description: "Bo'limni tanlang",
        variant: "destructive",
        duration: 2000,
      });
      isValid = false;
    }

    if (!newGroup.responsible_user_id) {
      toast({
        title: "Xatolik!",
        description:
          "Mas'ul xodimni tanlang. Avval qidirib, keyin ro'yxatdan tanlang.",
        variant: "destructive",
        duration: 3000,
      });
      isValid = false;
    }

    return isValid;
  };

  // Handle form submission
  const handleAddGroupSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: newGroup.name,
        department_id: Number.parseInt(newGroup.department_id),
        responsible_user_id: Number.parseInt(newGroup.responsible_user_id),
      };

      await api.post(`/superhr/groups/`, payload);

      toast({
        title: "Muvaffaqiyatli!",
        description: "Guruh muvaffaqiyatli qo'shildi",
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
          error.response?.data?.detail || "Guruh qo'shishda xatolik yuz berdi",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleAddGroupSubmit}
      className="bg-white p-6 shadow-sm rounded-lg"
    >
      <div className="flex items-center justify-between mb-5 gap-4">
        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
        <div className="text-2xl font-bold">Yangi guruh qo'shish</div>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {/* Group Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="new_group_name">Nomi</Label>
          <Input
            id="new_group_name"
            name="name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            className="col-span-3"
            required
          />
        </div>

        {/* Department Selection */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="new_group_department">Bo'lim</Label>
          <Select
            value={newGroup.department_id}
            onValueChange={(value) =>
              setNewGroup({ ...newGroup, department_id: value })
            }
            required
          >
            <SelectTrigger id="new_group_department" className="col-span-3">
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

        {/* Responsible User Search */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="user_search">
            Mas'ul xodimni qidirish
            <span className="text-red-500 ml-1">*</span>
          </Label>
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
            1. Qidiruv uchun kamida 3 ta harf kiriting
            {usersSearch.length >= 3 && users.length === 0 && (
              <span className="text-amber-500 block mt-1">
                Xodim topilmadi. Boshqa so'z bilan qidirib ko'ring.
              </span>
            )}
          </p>
        </div>

        {/* Responsible User Selection */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="responsible_user_select"
            className={users.length > 0 ? "" : "text-gray-400"}
          >
            2. Mas'ul xodimni tanlang
            <span className="text-red-500 ml-1">*</span>
          </Label>
          {users.length > 0 ? (
            <Select
              value={newGroup.responsible_user_id}
              onValueChange={(value) =>
                setNewGroup({ ...newGroup, responsible_user_id: value })
              }
              required
            >
              <SelectTrigger
                id="responsible_user_select"
                className="col-span-3"
              >
                <SelectValue placeholder="Ro'yxatdan mas'ul xodimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem
                    key={user.user_id}
                    value={user.user_id.toString()}
                  >
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="border rounded-md p-2 bg-gray-50 text-gray-400">
              Avval xodimni qidiring, keyin tanlang
            </div>
          )}
          {!newGroup.responsible_user_id && users.length > 0 && (
            <p className="text-xs text-amber-500">
              Ro'yxatdan mas'ul xodimni tanlang
            </p>
          )}
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

export default AddGroup;
