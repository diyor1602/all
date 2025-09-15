import { useEffect, useRef, useState } from "react";

const MarqueeBanner = ({ text, additionalText }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [duration, setDuration] = useState(20);
  const [currentText, setCurrentText] = useState(text);
  const [key, setKey] = useState(0); // force re-trigger animation

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.offsetWidth;

      const distance = containerWidth + contentWidth;
      const speed = 100; // pixels per second
      setDuration(distance / speed);
    }
  }, [currentText]);

  const handleAnimationEnd = () => {
    setCurrentText((prev) => (prev === text ? additionalText : text));
    // reset animation by changing key
    setKey((k) => k + 1);
  };

  const marqueeStyles = {
    overflow: "hidden",
    whiteSpace: "nowrap",
  };

  const marqueeContentStyles = {
    display: "inline-block",
    paddingLeft: "100%",
    animation: `marquee ${duration}s linear`,
  };

  const keyframesCSS = `
    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-100%);
      }
    }
  `;

  return (
    <>
      <style>{keyframesCSS}</style>
      <div
        ref={containerRef}
        className="bg-red-500 fixed top-0 left-0 right-0 text-white text-center uppercase font-medium z-10"
        style={marqueeStyles}
      >
        <div
          key={key} // reset DOM node for fresh animation
          ref={contentRef}
          style={marqueeContentStyles}
          onAnimationEnd={handleAnimationEnd}
        >
          {currentText}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
