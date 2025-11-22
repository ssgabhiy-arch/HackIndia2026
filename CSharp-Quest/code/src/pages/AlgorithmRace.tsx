import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Zap, Code } from "lucide-react";
import { ScoreTracker } from "@/components/Game/ScoreTracker";
import { Timer } from "@/components/Game/Timer";
import { Textarea } from "@/components/ui/textarea";

interface AlgorithmChallenge {
  problem: string;
  testCases: { input: string; output: string }[];
  difficulty: number;
  hint?: string;
}

const TOTAL_CHALLENGES = 5; // Total number of challenges per game

export default function AlgorithmRace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<AlgorithmChallenge | null>(null);
  const [userSolution, setUserSolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [challengesAttempted, setChallengesAttempted] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        fetchChallenge(1);
      }
    });
  }, [navigate]);

  const fetchChallenge = async (currentDifficulty: number) => {
    setLoading(true);
    setUserSolution("");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-algorithm-challenge", {
        body: { difficulty: currentDifficulty },
      });

      if (error) throw error;

      setChallenge(data);
      setDifficulty(currentDifficulty);
      setStartTime(Date.now());
      setTimerActive(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    toast({
      title: "Time's Up! ⏰",
      description: "Moving to next challenge...",
      variant: "destructive",
    });
    
    setChallengesAttempted(challengesAttempted + 1);
    const responseTime = (Date.now() - startTime) / 1000;
    setResponseTimes([...responseTimes, responseTime]);
    
    if (challengesAttempted + 1 >= TOTAL_CHALLENGES) {
      finishGame();
    } else {
      setTimeout(() => fetchChallenge(difficulty), 2000);
    }
  };

  const submitSolution = async () => {
    if (!challenge || !userSolution.trim()) return;
    
    setIsSubmitting(true);
    setTimerActive(false);
    setChallengesAttempted(challengesAttempted + 1);
    
    const responseTime = (Date.now() - startTime) / 1000;
    setResponseTimes([...responseTimes, responseTime]);
    
    try {
      const { data, error } = await supabase.functions.invoke("check-algorithm-solution", {
        body: {
          userSolution: userSolution.trim(),
          testCases: challenge.testCases,
          difficulty,
        },
      });

      if (error) throw error;

      if (data.allPassed) {
        const timeBonus = Math.max(0, 60 - responseTime) * 2;
        const points = (100 * difficulty) + timeBonus;
        setScore(score + points);
        setSolved(solved + 1);
        
        toast({
          title: "Correct Solution! 🎉",
          description: `+${Math.round(points)} points (Time Bonus: +${Math.round(timeBonus)})`,
        });

        if (challengesAttempted + 1 >= TOTAL_CHALLENGES) {
          setTimeout(() => finishGame(), 1500);
        } else {
          setTimeout(() => {
            const newDiff = solved + 1 > challengesAttempted * 0.7 ? Math.min(10, difficulty + 1) : difficulty;
            fetchChallenge(newDiff);
          }, 2000);
        }
      } else {
        toast({
          title: "Solution Failed Tests",
          description: `${data.passedCount}/${challenge.testCases.length} test cases passed`,
          variant: "destructive",
        });
        
        if (challengesAttempted + 1 >= TOTAL_CHALLENGES) {
          setTimeout(() => finishGame(), 1500);
        } else {
          setTimeout(() => fetchChallenge(difficulty), 2000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check solution",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishGame = async () => {
    const accuracy = challengesAttempted > 0 ? (solved / challengesAttempted) * 100 : 0;
    const avgTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    try {
      const { data: gameData, error: fetchError } = await supabase
        .from("games")
        .select("id")
        .eq("name", "Algorithm Race")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!gameData?.id) {
        throw new Error("Algorithm Race game not found in database");
      }

      const gameId = gameData.id;

      const { data: sessionData, error } = await supabase.functions.invoke(
        "submit-quiz-session",
        {
          body: {
            gameId,
            score,
            accuracy,
            streak: solved,
            avgTime,
            difficulty,
            questionsAnswered: challengesAttempted,
          },
        }
      );

      if (error) throw error;

      navigate("/results", {
        state: {
          score,
          accuracy,
          streak: solved,
          tokensEarned: sessionData.tokensEarned,
          newBalance: sessionData.newBalance,
          questionsAnswered: challengesAttempted,
          avgTime,
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save game",
        variant: "destructive",
      });
    }
  };

  const accuracy = challengesAttempted > 0 ? (solved / challengesAttempted) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Algorithm Race
          </h1>
          <div className="w-20" />
        </div>

        <ScoreTracker
          score={score}
          accuracy={accuracy}
          streak={solved}
          questionsAnswered={challengesAttempted + 1}
          difficulty={difficulty}
        />

        {challenge && (
          <Timer
            timeLimit={60}
            onTimeUp={handleTimeUp}
            isActive={timerActive}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : challenge ? (
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Algorithm Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-foreground whitespace-pre-wrap">{challenge.problem}</p>
              </div>

              {challenge.hint && (
                <Card className="p-3 bg-primary/10 border-primary/20">
                  <p className="text-sm">
                    <span className="font-semibold">Hint:</span> {challenge.hint}
                  </p>
                </Card>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Solution (pseudo-code or description):
                </label>
                <Textarea
                  value={userSolution}
                  onChange={(e) => setUserSolution(e.target.value)}
                  placeholder="Describe your algorithm approach..."
                  className="font-mono text-sm min-h-[200px]"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={submitSolution}
                disabled={isSubmitting || !userSolution.trim()}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Submit Solution"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-center text-sm text-muted-foreground">
          Challenge {Math.min(challengesAttempted + 1, TOTAL_CHALLENGES)} of {TOTAL_CHALLENGES}
        </div>
      </div>
    </div>
  );
}