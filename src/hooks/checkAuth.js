const allowPaths = ["home", "profile", "issue", "profileSalary"];

const isTokenValid = (tok) => {
  const expirationTime = tok.exp * 1000;
  return expirationTime > Date.now();
};

const checkAuth = () => {
  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : "";
  const role = decodedToken?.role?.name;
  const path = window.location.pathname.split("/")[1];

  if (!token || !isTokenValid(decodedToken)) {
    localStorage.clear();
    return false;
  }

  if (!allowPaths.includes(path)) {
    if (role !== path) {
      localStorage.clear();
      return false;
    }
  }

  return true;
};

export default checkAuth;
