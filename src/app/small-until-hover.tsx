import React, { useState, ReactNode } from "react";

interface SmallUntilHoverProps {
  children: ReactNode;
}

const SmallUntilHover: React.FC<SmallUntilHoverProps> = ({ children }) => {
  const [hover, setHover] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setHover(true);
  };

  const handleMouseLeave = () => {
    setHover(false);
  };

  return (
    <span
      style={{
        fontSize: hover ? "2rem" : "1.25rem",
        ...(hover ? {} : { lineHeight: "2.5rem" }),
        margin: hover ? ".63rem" : "1rem",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
};

export default SmallUntilHover;
