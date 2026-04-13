import { useEffect, useState } from "react";
import api from "@/utils/api";

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 kun

export default function useModelImages(modelCode) {
  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!modelCode) {
      setImages([]);
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = `model-images-${modelCode}`;

    // 🔥 CACHE NI TEKSHIRISH
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);

        const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;

        if (!isExpired) {
          setImages(parsed.images || []);
          setProducts(parsed.products || []);
          return; // 🚀 API chaqirilmaydi
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    const normalizeUrl = (url, fallbackDomain = "") => {
      if (!url) return null;

      const cleanUrl = String(url).trim();
      if (!cleanUrl) return null;

      if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
        return cleanUrl;
      }

      if (cleanUrl.startsWith("//")) {
        return `https:${cleanUrl}`;
      }

      if (cleanUrl.startsWith("/")) {
        return `${fallbackDomain}${cleanUrl}`;
      }

      return fallbackDomain ? `${fallbackDomain}/${cleanUrl}` : cleanUrl;
    };

    const isValidImage = (src) => {
      if (!src) return false;

      const lower = src.toLowerCase();

      if (
        lower.includes("empty.jpg") ||
        lower.includes("empty.webp") ||
        lower.includes("scale_1200.png") ||
        lower.includes("chestniy_znak")
      ) {
        return false;
      }

      return (
        lower.includes(".jpg") ||
        lower.includes(".jpeg") ||
        lower.includes(".png") ||
        lower.includes(".webp") ||
        lower.includes("@jpg") ||
        lower.includes("@jpeg") ||
        lower.includes("@png") ||
        lower.includes("@webp")
      );
    };

    const extractImageFromCard = (card, domain) => {
      const img =
        card.querySelector("img[data-src]") || card.querySelector("img[src]");

      const source =
        card.querySelector("source[data-srcset]") ||
        card.querySelector("source[srcset]");

      let imageUrl = null;

      if (img) {
        imageUrl = img.getAttribute("data-src") || img.getAttribute("src");
      }

      if (!imageUrl && source) {
        imageUrl =
          source.getAttribute("data-srcset") || source.getAttribute("srcset");
      }

      if (!imageUrl) return null;

      imageUrl = imageUrl.split(",")[0]?.trim().split(" ")[0];

      const normalized = normalizeUrl(imageUrl, domain);

      if (!isValidImage(normalized)) return null;

      return normalized;
    };

    const parseSkyLakeProducts = (doc) => {
      const domain = "https://www.skylake.ru";
      const productCards = Array.from(doc.querySelectorAll(".product-card"));

      const parsedProducts = productCards
        .map((card) => {
          const linkEl =
            card.querySelector("a.product-link") ||
            card.querySelector('a[href*="/product/"]');

          const title =
            linkEl?.textContent?.trim() ||
            card.querySelector("img")?.getAttribute("alt")?.trim() ||
            "";

          const href =
            linkEl?.getAttribute("href") ||
            card.querySelector('a[href*="/product/"]')?.getAttribute("href") ||
            "";

          const image = extractImageFromCard(card, domain);

          if (!image) return null;

          return {
            title,
            image,
            url: normalizeUrl(href, domain),
          };
        })
        .filter(Boolean);

      return Array.from(
        new Map(parsedProducts.map((item) => [item.image, item])).values(),
      );
    };

    const parseNikaStyleProducts = (doc) => {
      const domain = "https://www.nikastyle.ru";

      const parsed = Array.from(doc.querySelectorAll("img"))
        .map((img, index) => {
          const rawSrc =
            img.getAttribute("data-src") || img.getAttribute("src");
          if (!rawSrc) return null;

          if (!rawSrc.includes("/upload/")) return null;

          const image = normalizeUrl(rawSrc, domain);
          if (!isValidImage(image)) return null;

          const title = img.getAttribute("alt")?.trim() || `Image ${index + 1}`;
          const linkEl = img.closest("a");
          const href = linkEl?.getAttribute("href") || "";

          return {
            title,
            image,
            url: normalizeUrl(href, domain),
          };
        })
        .filter(Boolean);

      return Array.from(
        new Map(parsed.map((item) => [item.image, item])).values(),
      );
    };

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: html } = await api.get(
          `/model-images?q=${encodeURIComponent(modelCode)}`,
        );

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const skyLakeProducts = parseSkyLakeProducts(doc);
        const nikaStyleProducts = parseNikaStyleProducts(doc);

        const mergedProducts = [...skyLakeProducts, ...nikaStyleProducts];
        const uniqueProducts = Array.from(
          new Map(mergedProducts.map((item) => [item.image, item])).values(),
        );

        if (!isMounted) return;

        const finalImages = uniqueProducts.map((item) => item.image);

        setProducts(uniqueProducts);
        setImages(finalImages);

        // 🔥 CACHE GA YOZISH
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            images: finalImages,
            products: uniqueProducts,
            timestamp: Date.now(),
          }),
        );
      } catch (err) {
        if (!isMounted) return;

        setError(err?.message || "Failed to load model images");
        setImages([]);
        setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [modelCode]);

  return { images, products, loading, error };
}
