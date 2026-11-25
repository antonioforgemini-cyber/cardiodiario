import React from "react";

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = "main-content",
  label = "Salta al contenuto principale",
}) => {
  return (
    <a href={`#${targetId}`} className="skip-link visually-hidden">
      {label}
    </a>
  );
};
