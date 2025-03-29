export const getImageUrl = async (path) => {
  if (!path) return null;
  if (path.startsWith("blob:") || path.startsWith("data:")) return path;

  let IMGRURL = "";

  if (path.startsWith("/media/images/")) {
    path = path.slice(6);
    IMGRURL = import.meta.env.VITE_API_URL_J_IMG;
    return `${IMGRURL}/storage${path}`;
  } else if (path.startsWith("/media/rasmlar/")) {
    IMGRURL = import.meta.env.VITE_API_URL_Q_IMG;
    return `${IMGRURL}${path}`;
  } else {
    return null;
  }
};
