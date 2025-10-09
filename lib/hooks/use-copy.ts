import { useEffect, useState } from "react";

export const useCopy = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copyContent = (value: string) => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
  };
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);
  return {
    isCopied,
    copyContent,
    setIsCopied,
  };
};
