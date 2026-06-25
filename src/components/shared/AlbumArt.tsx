"use client";

import { useRef } from "react";

interface AlbumArtProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackIcon?: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function AlbumArt({
  src,
  alt = "",
  className = "",
  fallbackIcon = "fa-music",
  size,
  style,
}: AlbumArtProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  const combinedStyle: React.CSSProperties = {
    ...(size ? { width: size, height: size } : {}),
    ...style,
  };

  const handleError = () => {
    if (imgRef.current) imgRef.current.style.display = "none";
    if (fallbackRef.current) {
      fallbackRef.current.style.display = "flex";
    }
  };

  if (!src) {
    return (
      <div
        className={className}
        ref={fallbackRef}
        style={{
          ...combinedStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-elevated)",
          color: "var(--text-tertiary)",
          overflow: "hidden",
        }}
      >
        <i className={`fas ${fallbackIcon}`} style={{ fontSize: Math.max(10, (size || 36) * 0.38) }}></i>
      </div>
    );
  }

  return (
    <>
      <img
        ref={imgRef}
        className={className}
        src={src}
        alt={alt}
        style={{ ...combinedStyle, objectFit: "cover" }}
        onError={handleError}
      />
      <div
        ref={fallbackRef}
        className={className}
        style={{
          ...combinedStyle,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-elevated)",
          color: "var(--text-tertiary)",
          overflow: "hidden",
        }}
      >
        <i className={`fas ${fallbackIcon}`} style={{ fontSize: Math.max(10, (size || 36) * 0.38) }}></i>
      </div>
    </>
  );
}
