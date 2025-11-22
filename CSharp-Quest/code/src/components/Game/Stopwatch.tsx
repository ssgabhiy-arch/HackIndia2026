import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface StopwatchProps {
  isActive: boolean;
  onTick?: (elapsedTime: number) => void;
}

export const Stopwatch = ({ isActive, onTick }: StopwatchProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 0.1;
        onTick?.(newTime);
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, onTick]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : `${secs}s`;
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-border">
      <Clock className="h-5 w-5 text-primary" />
      <span className="text-2xl font-bold text-foreground">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};
