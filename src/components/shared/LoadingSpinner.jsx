import React from "react";

export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}