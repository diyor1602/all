import { useEffect, useRef, useState } from "react";

const MarqueeBanner = ({ texts = [] }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [duration, setDuration] = useState(20);

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth / 2; // only one set width

      const distance = containerWidth + contentWidth;
      const speed = 100; // px per second
      setDuration(distance / speed);
    }
  }, [texts]);

  const marqueeStyles = {
    overflow: "hidden",
    whiteSpace: "nowrap",
  };

  const marqueeContentStyles = {
    display: "inline-block",
    animation: `marquee ${duration}s linear infinite`,
  };

  const keyframesCSS = `
    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
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
        <div ref={contentRef} style={marqueeContentStyles}>
          {/* First set of texts */}
          {texts.map((t, i) => (
            <span key={`first-${i}`} style={{ marginRight: "3rem" }}>
              {t}
            </span>
          ))}
          {/* Duplicate set for seamless looping */}
          {texts.map((t, i) => (
            <span key={`second-${i}`} style={{ marginRight: "3rem" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
