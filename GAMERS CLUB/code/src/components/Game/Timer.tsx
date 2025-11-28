import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isActive: boolean;
  onTick?: (timeLeft: number) => void;
}

export const Timer = ({ timeLimit, onTimeUp, isActive, onTick }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        onTick?.(newTime);
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, onTick]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isWarning = percentage < 30;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${isWarning ? 'text-destructive' : 'text-primary'}`} />
          <span className={`text-lg font-bold ${isWarning ? 'text-destructive' : 'text-foreground'}`}>
            {timeLeft.toFixed(1)}s
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {timeLimit}s
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 transition-all ${isWarning ? 'bg-destructive/20' : ''}`}
      />
    </div>
  );
};