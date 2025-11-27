import React from "react";

interface PinIconProps {
  className?: string;
  filled?: boolean; // 是否填充（表示已固定）
}

export const PinIcon: React.FC<PinIconProps> = ({
  className,
  filled = false,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* 图钉形状 */}
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path
      d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"
      fill={filled ? "currentColor" : "none"}
    ></path>
  </svg>
);
