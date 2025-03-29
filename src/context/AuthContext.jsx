import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const APIURL = import.meta.env.VITE_API_URL_J;

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${APIURL}/login/`, {
        username,
        password,
      });

      if (res.status === 200) {
        const { token } = res.data.message;
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        localStorage.setItem("imgUrl", res.data.message.user.employee.img);

        localStorage.setItem("token", token);
        localStorage.setItem("role", decodedToken.role.name);
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", res.data.message.user.id);
        localStorage.setItem("name", res.data.message.user.employee.name);
        setUser({ username, role: decodedToken.role.name });
        navigate("/home", { replace: true });
        return { success: true };
      }
    } catch (error) {
      let errorMessage = "Kutilmagan xatolik yuz berdi";

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = "Login yoki parol xato";
            break;
          case 403:
            errorMessage = "Sizda saytga kirish imkoni mavjud emas";
            break;
          default:
            errorMessage = "Server xatosi yuz berdi";
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
