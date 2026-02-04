"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FlipCard Component - Perfect 3D flip with mobile support
 * 
 * Usage:
 * <FlipCard
 *   front={<div>Front Content</div>}
 *   back={<div>Back Content</div>}
 *   height="380px"
 * />
 */
export function FlipCard({ 
  front, 
  back, 
  height = "380px",
  className = "",
  flipOnHover = true,
  flipOnClick = true 
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (flipOnClick) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleMouseEnter = () => {
    if (flipOnHover && !flipOnClick) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (flipOnHover && !flipOnClick) {
      setIsFlipped(false);
    }
  };

  return (
    <div
      className={cn("flip-card-container", className)}
      style={{ 
        perspective: "1200px",
        height: height,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="flip-card-inner"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Side */}
        <div
          className="flip-card-front"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            background: "var(--card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}
        >
          {front}
        </div>

        {/* Back Side */}
        <div
          className="flip-card-back"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

/**
 * FlipCardFront - Styled front content wrapper
 */
export function FlipCardFront({ children, className = "" }) {
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center p-6", className)}>
      {children}
    </div>
  );
}

/**
 * FlipCardBack - Styled back content wrapper with video/image support
 */
export function FlipCardBack({ children, videoSrc, imageSrc, className = "" }) {
  return (
    <div className={cn("relative w-full h-full", className)}>
      {videoSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ pointerEvents: "none" }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      {imageSrc && !videoSrc && (
        <img
          src={imageSrc}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </d