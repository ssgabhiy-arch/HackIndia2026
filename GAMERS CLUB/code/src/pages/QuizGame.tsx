import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { QuestionCard } from "@/components/Game/QuestionCard";
import { Stopwatch } from "@/components/Game/Stopwatch";
import { ScoreTracker } from "@/components/Game/ScoreTracker";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const TOTAL_QUESTIONS = 5; // Total number of questions per game

export default function QuizGame() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [stopwatchActive, setStopwatchActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        fetchQuestion(1);
      }
    });
  }, [navigate]);

  const fetchQuestion = async (currentDifficulty: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { difficulty: currentDifficulty },
      });

      if (error) throw error;

      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setIsAnswered(false);
      if (questionsAnswered === 0) {
        setStopwatchActive(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSelectAnswer = (index: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedAnswer(index);
    setIsAnswered(true);
    setQuestionsAnswered((prev) => prev + 1);

    const correct = index === currentQuestion.correctAnswer;
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
      setScore((prev) => prev + (10 * difficulty));
      setStreak((prev) => prev + 1);
      toast({
        title: "Correct! 🎉",
        description: `+${10 * difficulty} points`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Incorrect",
        description: currentQuestion.explanation || "Try the next one!",
        variant: "destructive",
      });
    }

    setTimeout(() => nextQuestion(correct), 2000);
  };

  const nextQuestion = async (wasCorrect: boolean) => {
    // Check if we've reached the total number of questions
    if (questionsAnswered >= TOTAL_QUESTIONS) {
      finishGame();
      return;
    }

    const currentAccuracy = ((correctAnswers + (wasCorrect ? 1 : 0)) / (questionsAnswered + 1)) * 100;

    const { data: difficultyData } = await supabase.functions.invoke("adjust-difficulty", {
      body: {
        accuracy: currentAccuracy,
        streak: wasCorrect ? streak + 1 : 0,
        avgTime: totalElapsedTime,
        currentDifficulty: difficulty,
      },
    });

    const newDifficulty = difficultyData?.newDifficulty || difficulty;
    setDifficulty(newDifficulty);
    fetchQuestion(newDifficulty);
  };

  const finishGame = async () => {
    setStopwatchActive(false);
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    try {
      const { data: gameData, error: fetchError } = await supabase
        .from("games")
        .select("id")
        .eq("name", "AI Quiz Challenge")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!gameData?.id) {
        throw new Error("AI Quiz Challenge game not found in database");
      }

      const gameId = gameData.id;

      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        "submit-quiz-session",
        {
          body: {
            gameId,
            score,
            accuracy,
            streak,
            totalTime: totalElapsedTime,
            difficulty,
            questionsAnswered,
          },
        }
      );

      if (sessionError) throw sessionError;

      navigate("/results", {
        state: {
          score,
          accuracy,
          streak,
          tokensEarned: sessionData.tokensEarned,
          newBalance: sessionData.newBalance,
          sessionId: sessionData.sessionId,
          questionsAnswered,
          totalTime: totalElapsedTime,
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

  const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">AI Quiz Challenge</h1>
          <div className="w-20" />
        </div>

        <ScoreTracker
          score={score}
          accuracy={accuracy}
          streak={streak}
          questionsAnswered={questionsAnswered}
          difficulty={difficulty}
        />

        <Stopwatch 
          isActive={stopwatchActive}
          onTick={setTotalElapsedTime}
        />

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentQuestion ? (
          <QuestionCard
            question={currentQuestion.question}
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            correctAnswer={isAnswered ? currentQuestion.correctAnswer : null}
            onSelectAnswer={handleSelectAnswer}
            isAnswered={isAnswered}
          />
        ) : null}

        <div className="text-center text-sm text-muted-foreground">
          Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
        </div>
      </div>
    </div>
  );
}