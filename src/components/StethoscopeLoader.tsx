"use client";

import React from "react";

interface StethoscopeLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const StethoscopeLoader: React.FC<StethoscopeLoaderProps> = ({
  size = "lg",
  text,
  overlay = false,
  className = "",
}) => {
  const dimensions = {
    sm: 24,
    md: 44,
    lg: 64,
  }[size];

  const renderSvg = (colored: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={dimensions}
      height={dimensions}
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M18 10V22C18 30.8366 25.1634 38 34 38C42.8366 38 50 30.8366 50 22V10"
        stroke={colored ? "#4a7c59" : "#c4c8bc"}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="9" r="3.5" fill={colored ? "#4a7c59" : "#c4c8bc"} />
      <circle cx="50" cy="9" r="3.5" fill={colored ? "#4a7c59" : "#c4c8bc"} />
      <path
        d="M34 38V47C34 52.5228 29.5228 57 24 57C18.4772 57 14 52.5228 14 47V37"
        stroke={colored ? "#4a7c59" : "#c4c8bc"}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="14"
        cy="33"
        r="6.5"
        fill={colored ? "#4a7c59" : "#e4e0d8"}
        stroke={colored ? "#4a7c59" : "#c4c8bc"}
        strokeWidth="3.5"
      />
      <circle
        cx="14"
        cy="33"
        r="2.8"
        fill={colored ? "#c27d38" : "#9ca399"}
      />
    </svg>
  );

  const loaderBody = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative inline-flex items-center justify-center select-none"
        style={{ width: dimensions, height: dimensions }}
      >
        <div>{renderSvg(false)}</div>
        <div className="absolute inset-0 animate-stethoscope-fill">
          {renderSvg(true)}
        </div>
      </div>
      {text ? (
        <p className="text-xs sm:text-sm font-semibold text-secondary text-center">
          {text}
        </p>
      ) : (
        <span className="visually-hidden">Caricamento in corso</span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm">
        <div className="bg-surface-container-lowest px-8 py-6 rounded-3xl shadow-2xl border border-surface-variant/50 flex flex-col items-center">
          {loaderBody}
        </div>
      </div>
    );
  }

  return loaderBody;
};
