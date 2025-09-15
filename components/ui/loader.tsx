"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-xl"
};

const Spinner: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <div
    className={cn(
      "animate-spin rounded-full border-2 border-muted border-t-primary",
      size,
      className
    )}
  />
);

const Dots: React.FC<{ size: string; className?: string }> = ({ size, className }) => {
  const dotSize = size.includes("4") ? "h-1 w-1" : 
                 size.includes("6") ? "h-1.5 w-1.5" :
                 size.includes("8") ? "h-2 w-2" : "h-3 w-3";
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "0ms" }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "150ms" }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize)} style={{ animationDelay: "300ms" }} />
    </div>
  );
};

const Pulse: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <div
    className={cn(
      "bg-primary rounded-full animate-pulse",
      size,
      className
    )}
  />
);

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "spinner",
  text,
  fullScreen = false,
  className,
}) => {
  const LoaderComponent = {
    spinner: Spinner,
    dots: Dots,
    pulse: Pulse,
  }[variant];

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      fullScreen ? "min-h-screen" : "p-8",
      className
    )}>
      <LoaderComponent size={sizeClasses[size]} />
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Inline loader for buttons, inputs etc
export const InlineLoader: React.FC<{ size?: "sm" | "md"; className?: string }> = ({ 
  size = "sm", 
  className 
}) => (
  <Spinner size={sizeClasses[size]} className={className} />
);

// Table loader with skeleton
export const TableLoader: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-4 bg-muted rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Loader;