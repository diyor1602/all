import axios from "axios";

const CACHE_KEY = "dollarRateApi";
const CACHE_TIME_KEY = "dollarRate_time";

// 1 soat cache (xohlasang o'zgartir)
const TTL = 1000 * 60 * 60; // 1 hour

const getDollarRate = async () => {
  try {
    const cachedRate = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    // ✅ Agar cache mavjud va eskirmagan bo‘lsa
    if (cachedRate && cachedTime) {
      const now = Date.now();

      if (now - Number(cachedTime) < TTL) {
        return Number(cachedRate);
      }
    }

    // ❌ Aks holda API ga boradi
    const response = await axios.get(
      "https://cbu.uz/uz/arkhiv-kursov-valyut/json/",
    );

    const usd = response.data.find((item) => item.Ccy === "USD")?.Rate;

    if (!usd) throw new Error("USD rate not found");

    // ✅ Cache ga yozamiz
    localStorage.setItem(CACHE_KEY, usd);
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    return Number(usd);
  } catch (error) {
    console.error("Dollar rate error:", error);

    // fallback — cache bor bo‘lsa shuni qaytaradi
    const cachedRate = localStorage.getItem(CACHE_KEY);
    if (cachedRate) return Number(cachedRate);

    return null;
  }
};

export default getDollarRate;
