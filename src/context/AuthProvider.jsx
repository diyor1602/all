import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { AuthContext } from "./auth-context";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (token && username) {
      setUser({ username, role });
    }
  }, []);

  const saveUserData = (res, username) => {
    const token = res.data.token;

    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("role", res.data.user?.role?.name || "");
    localStorage.setItem("user_id", res.data.user?.id || "");
    localStorage.setItem("name", res.data.user?.employee?.name || "");
    localStorage.setItem("imgUrl", res.data.user?.employee?.img || "");
    localStorage.setItem(
      "percentage",
      res.data.user?.employee?.percentage ?? "",
    );
    localStorage.setItem(
      "employee_sum",
      res.data.user?.employee?.employee_sum ?? "",
    );

    setUser({
      username,
      role: res.data.user?.role?.name,
    });

    navigate(res.data.user?.role?.name === "tv" ? "/tv" : "/home", {
      replace: true,
    });
  };

  const login = async (username, password, code = "") => {
    setLoading(true);

    try {
      const payload = {
        username,
        password,
      };

      if (code) {
        payload.code = code;
      }

      const res = await api.post("/login/", payload);

      // 2-bosqichli auth yoqilgan bo‘lsa
      if (res?.data?.requires_code) {
        return {
          success: false,
          requiresCode: true,
          message: res.data.message || "Tasdiqlash kodi Telegramga yuborildi",
          expiresAt: res.data.expires_at || null,
        };
      }

      if (res.status === 200 && res.data?.token) {
        saveUserData(res, username);
        return { success: true };
      }

      return {
        success: false,
        error: "Kutilmagan javob qaytdi",
      };
    } catch (error) {
      let errorMessage = "Kutilmagan xatolik yuz berdi";

      if (error.response) {
        const data = error.response.data;

        if (typeof data?.message === "string" && data.message.trim()) {
          errorMessage = data.message;
        } else {
          switch (error.response.status) {
            case 400:
              errorMessage =
                "Noto'g'ri so'rov. Ma'lumotlarni tekshirib qaytadan urinib ko'ring.";
              break;
            case 401:
              errorMessage = "Login, parol yoki tasdiqlash kodi xato";
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
              errorMessage =
                "Kiritilgan ma'lumotlarda xatolik bor. Iltimos, tekshirib qayta urinib ko'ring.";
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
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
