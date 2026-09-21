import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  showText = true,
  subtitle,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
        >
          <rect width="48" height="48" rx="12" fill="#4a7c59" />
          <path
            d="M12 25h5l3-7 5 14 4-10 3 5h4"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="18" r="2.5" fill="#c27d38" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-headline font-bold text-xl tracking-tight text-primary leading-tight">
            CardioDiario
          </span>
          {subtitle && (
            <span className="text-[11px] font-label font-semibold text-secondary uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
