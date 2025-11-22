import { Card } from "@/components/ui/card";
import { Trophy, Target, Zap, Coins } from "lucide-react";

interface ScoreTrackerProps {
  score: number;
  accuracy: number;
  streak: number;
  questionsAnswered: number;
  difficulty: number;
}

export const ScoreTracker = ({
  score,
  accuracy,
  streak,
  questionsAnswered,
  difficulty,
}: ScoreTrackerProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-xl font-bold text-primary">{score}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-border/20">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-xl font-bold text-foreground">{accuracy.toFixed(0)}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-border/20">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-xl font-bold text-foreground">{streak}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-border/20">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-muted-foreground">Questions</p>
            <p className="text-xl font-bold text-foreground">{questionsAnswered}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {difficulty}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="text-xl font-bold text-foreground">Level {difficulty}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};