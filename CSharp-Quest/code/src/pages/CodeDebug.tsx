import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Bug } from "lucide-react";
import { ScoreTracker } from "@/components/Game/ScoreTracker";
import { Textarea } from "@/components/ui/textarea";

interface BugChallenge {
  buggyCode: string;
  fixedCode: string;
  description: string;
  difficulty: number;
}

const TOTAL_CHALLENGES = 5; // Total number of challenges per game

export default function CodeDebug() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<BugChallenge | null>(null);
  const [userCode, setUserCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [correctSolutions, setCorrectSolutions] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState(0);

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
    setFeedback(null);
    setIsCorrect(false);
    setStartTime(Date.now());
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-debug-challenge", {
        body: { difficulty: currentDifficulty },
      });

      if (error) throw error;

      setChallenge(data);
      setUserCode(data.buggyCode);
      setDifficulty(currentDifficulty);
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

  const checkSolution = async () => {
    if (!challenge) return;
    
    setIsChecking(true);
    setAttempts(attempts + 1);
    
    try {
      const { data, error } = await supabase.functions.invoke("check-debug-solution", {
        body: {
          userCode: userCode.trim(),
          correctCode: challenge.fixedCode.trim(),
          difficulty,
        },
      });

      if (error) throw error;

      const timeSpent = (Date.now() - startTime) / 1000;
      setTotalTime(totalTime + timeSpent);

      if (data.isCorrect) {
        setIsCorrect(true);
        setCorrectSolutions(correctSolutions + 1);
        const points = 100 * difficulty;
        setScore(score + points);
        
        toast({
          title: "Correct! 🎉",
          description: `+${points} points`,
        });

        setFeedback(data.feedback);
        
        if (challengesCompleted + 1 >= TOTAL_CHALLENGES) {
          finishGame();
        }
      } else {
        toast({
          title: "Not quite right",
          description: "Try again!",
          variant: "destructive",
        });
        setFeedback(data.feedback);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check solution",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const nextChallenge = () => {
    setChallengesCompleted(challengesCompleted + 1);
    const newDifficulty = correctSolutions > attempts * 0.7 ? Math.min(10, difficulty + 1) : difficulty;
    fetchChallenge(newDifficulty);
  };

  const finishGame = async () => {
    const accuracy = attempts > 0 ? (correctSolutions / attempts) * 100 : 0;
    const avgTime = correctSolutions > 0 ? totalTime / correctSolutions : 0;
    
    try {
      const { data: gameData, error: fetchError } = await supabase
        .from("games")
        .select("id")
        .eq("name", "Code Debugging")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!gameData?.id) {
        throw new Error("Code Debugging game not found in database");
      }

      const gameId = gameData.id;

      const { data: sessionData, error } = await supabase.functions.invoke(
        "submit-quiz-session",
        {
          body: {
            gameId,
            score,
            accuracy,
            streak: correctSolutions,
            avgTime,
            difficulty,
            questionsAnswered: attempts,
          },
        }
      );

      if (error) throw error;

      navigate("/results", {
        state: {
          score,
          accuracy,
          streak: correctSolutions,
          tokensEarned: sessionData.tokensEarned,
          newBalance: sessionData.newBalance,
          questionsAnswered: attempts,
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

  const accuracy = attempts > 0 ? (correctSolutions / attempts) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Code Debugging Challenge
          </h1>
          <div className="w-20" />
        </div>

        <ScoreTracker
          score={score}
          accuracy={accuracy}
          streak={correctSolutions}
          questionsAnswered={challengesCompleted + 1}
          difficulty={difficulty}
        />

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : challenge ? (
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-destructive" />
                {challenge.description}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Fix the buggy code below:
                </label>
                <Textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  disabled={isCorrect}
                />
              </div>

              {feedback && (
                <Card className={`p-4 ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <p className="text-sm">{feedback}</p>
                  </div>
                </Card>
              )}

              <div className="flex gap-3">
                {!isCorrect ? (
                  <Button
                    onClick={checkSolution}
                    disabled={isChecking || !userCode.trim()}
                    className="flex-1"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Solution"
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextChallenge} className="flex-1">
                    Next Challenge ({challengesCompleted + 1}/5)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-center text-sm text-muted-foreground">
          Challenge {Math.min(challengesCompleted + 1, TOTAL_CHALLENGES)} of {TOTAL_CHALLENGES} | Attempts: {attempts}
        </div>
      </div>
    </div>
  );
}