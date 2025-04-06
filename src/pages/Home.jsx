import React from "react";

const Home = () => {
  return (
    <div className="w-full text-2xl h-[90vh] flex flex-col gap-3 items-center justify-center text-center">
      <div>Assalomu alaykum {localStorage.getItem("name")}</div>
      <div>
        Platforma bo'yicha takliflarni shu manzilga yuboring:{" "}
        <a
          href="https://t.me/abdurakhmanov"
          target="_blank"
          className="text-blue-500"
        >
          @abdurakhmanov
        </a>{" "}
      </div>
    </div>
  );
};

export default Home;
