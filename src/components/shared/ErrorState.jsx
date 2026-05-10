import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}