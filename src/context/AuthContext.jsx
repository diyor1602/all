import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post(`/login/`, {
        username,
        password,
      });

      if (res.status === 200) {
        const token = res.data.token;
        localStorage.setItem("imgUrl", res.data.user.employee.img);
        localStorage.setItem("token", token);
        localStorage.setItem("role", res.data.user.role.name);
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", res.data.user.id);
        localStorage.setItem("name", res.data.user.employee.name);
        setUser({ username, role: res.data.user.role.name });
        if (res.data.user.role.name == "tv") {
          navigate("/tv", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
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

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          if (decodedToken.exp * 1000 <= Date.now()) {
            logout();
          }
        } catch {
          logout();
        }
      }
    };

    checkToken(); // Check immediately
    const interval = setInterval(checkToken, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
