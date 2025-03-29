const isTokenValid = (token) => {
  const decodedToken = JSON.parse(atob(token.split(".")[1]));
  const expirationTime = decodedToken.exp * 1000;
  return expirationTime > Date.now();
};

const checkAuth = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const path = window.location.pathname.split("/")[1];

  if (!token || !isTokenValid(token)) {
    localStorage.clear();
    return false;
  }

  if (path !== "home") {
    if (role !== path) {
      localStorage.clear();
      return false;
    }
  }

  return true;
};

export default checkAuth;
