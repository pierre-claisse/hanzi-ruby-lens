import { useState, useEffect } from "react";

const MIN_WIDTH = 400;

export function useMinWidth(): boolean {
  const [isBelowMinWidth, setIsBelowMinWidth] = useState(
    () => window.innerWidth < MIN_WIDTH,
  );

  useEffect(() => {
    function handleResize() {
      setIsBelowMinWidth(window.innerWidth < MIN_WIDTH);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isBelowMinWidth;
}
