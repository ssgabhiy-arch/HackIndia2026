import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Zap, Coins, Sparkles, BarChart } from "lucide-react";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    score = 0,
    accuracy = 0,
    streak = 0,
    tokensEarned = 0,
    newBalance = 0,
    sessionId,
    questionsAnswered = 0,
    avgTime = 0,
  } = location.state || {};

  useEffect(() => {
    if (!location.state) {
      navigate("/dashboard");
      return;
    }

    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-insights", {
          body: {
            score,
            accuracy,
            streak,
            avgTime,
            questionsAnswered,
          },
        });

        if (error) throw error;
        setInsights(data.insights || []);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
        setInsights([
          "Great effort on completing the quiz!",
          "Keep practicing to improve your skills.",
          "Every game makes you stronger!",
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [location.state, navigate, score, accuracy, streak, avgTime, questionsAnswered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2 animate-fade-in">
          <Trophy className="h-16 w-16 mx-auto text-primary animate-scale-in" />
          <h1 className="text-4xl font-bold text-primary">Quiz Complete!</h1>
          <p className="text-muted-foreground">Here's how you performed</p>
        </div>

        <Card className="bg-gradient-to-br from-purple-500/20 to-primary/20 border-purple-500/30 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center text-2xl">
              <Coins className="h-6 w-6 text-purple-500" />
              Tokens Earned
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-6xl font-bold text-purple-500 animate-scale-in">
              +{tokensEarned}
            </p>
            <p className="text-muted-foreground mt-2">
              New Balance: {newBalance.toLocaleString()} C# Tokens
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card/50 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-primary">{score}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold text-foreground">{accuracy.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold text-foreground">{streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold text-foreground">{avgTime.toFixed(1)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 animate-fade-in">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/quiz-game")}>
            Play Again
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/leaderboard")}>
            View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
}