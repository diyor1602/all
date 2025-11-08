import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function useModelImages(modelCode) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!modelCode) return;

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from your Laravel API endpoint
        const { data: html } = await api.get(
          `/model-images?q=${encodeURIComponent(modelCode)}`
        );

        // Parse HTML response
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Extract image URLs
        const imgs = Array.from(doc.querySelectorAll("img"))
          .map((img) => img.getAttribute("data-src") || img.getAttribute("src"))
          .filter((src) => {
            if (!src) return false;
            if (!src.includes("/upload/")) return false;
            if (src.includes("scale_1200.png") || src.includes("chestniy_znak"))
              return false;
            return /\.(jpg|jpeg|png|webp)$/i.test(src);
          })
          .map((src) =>
            src.startsWith("http") ? src : `https://www.nikastyle.ru${src}`
          );

        setImages([...new Set(imgs)]);
      } catch (err) {
        setError(err.message || "Failed to load images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [modelCode]);

  return { images, loading, error };
}
