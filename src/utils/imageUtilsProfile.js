export const getImageUrl = (path) => {
  // Return early if path is invalid
  if (!path || path === "null" || path === "undefined") {
    return null;
  }

  // Return directly if it's already a blob or data URL
  if (path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  return `${import.meta.env.VITE_API_URL_Q_IMGPROFILE}${path}`;
};
