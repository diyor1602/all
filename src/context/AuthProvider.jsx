import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { AuthContext } from "./auth-context"; // adjust path as needed

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post(`/login/`, { username, password });

      if (res.status === 200) {
        const token = res.data.token;
        localStorage.setItem("imgUrl", res.data.user?.employee?.img);
        localStorage.setItem("token", token);
        localStorage.setItem("role", res.data.user?.role?.name);
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", res.data.user?.id);
        localStorage.setItem("name", res.data.user?.employee?.name);
        localStorage.setItem("percentage", res.data.user?.employee?.percentage);
        setUser({ username, role: res.data.user?.role?.name });

        navigate(res.data.user?.role?.name === "tv" ? "/tv" : "/home", {
          replace: true,
        });

        return { success: true };
      }
    } catch (error) {
      let errorMessage = "Kutilmagan xatolik yuz berdi";

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage =
              "Noto'g'ri so'rov. Ma'lumotlarni tekshirib qaytadan urinib ko'ring.";
            break;
          case 401:
            errorMessage = "Login yoki parol xato";
            break;
          case 403:
            errorMessage = "Sizda saytga kirish imkoni mavjud emas";
            break;
          case 404:
            errorMessage = "So'ralgan ma'lumot topilmadi";
            break;
          case 408:
            errorMessage =
              "So'rov vaqt limiti tugadi. Qaytadan urinib ko'ring.";
            break;
          case 422:
            errorMessage = "Parol kamida 6 belgidan iborat bo'lishi kerak";
            break;
          case 429:
            errorMessage =
              "Juda ko'p urinishlar. Bir oz kutib, qaytadan urinib ko'ring.";
            break;
          case 500:
            errorMessage =
              "Ichki server xatosi. Keyinroq qaytadan urinib ko'ring.";
            break;
          case 503:
            errorMessage =
              "Xizmat vaqtincha mavjud emas. Keyinroq urinib ko'ring.";
            break;
          default:
            errorMessage = "Nimadir xato ketdi";
        }
      } else if (error.request) {
        errorMessage = "Server bilan bog'lanishda xatolik";
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
