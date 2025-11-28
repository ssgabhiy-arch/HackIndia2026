import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Timer as TimerIcon } from "lucide-react";
import { ScoreTracker } from "@/components/Game/ScoreTracker";

interface MemoryCard {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const programmingConcepts = [
  "const", "let", "var", "function", "class", "async", "await", "return",
  "if", "else", "for", "while", "switch", "break", "continue", "try",
];

export default function MemoryMatch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        initializeGame();
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, gameStartTime]);

  const initializeGame = () => {
    const selectedConcepts = programmingConcepts.slice(0, 8);
    const cardPairs = [...selectedConcepts, ...selectedConcepts];
    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((content, index) => ({
        id: index,
        content,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setIsPlaying(true);
    setGameStartTime(Date.now());
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].content === cards[second].content) {
        // Match found
        setMatches(matches + 1);
        setTimeout(() => {
          setCards(cards.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setFlippedCards([]);
          
          if (matches + 1 === 8) {
            finishGame();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(cards.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const finishGame = async () => {
    setIsPlaying(false);
    const score = Math.max(0, 1000 - (moves * 10) - (timeElapsed * 2));
    const accuracy = moves > 0 ? (matches / moves) * 100 : 0;
    
    try {
      const { data: gameData, error: fetchError } = await supabase
        .from("games")
        .select("id")
        .eq("name", "Memory Match")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!gameData?.id) {
        throw new Error("Memory Match game not found in database");
      }

      const gameId = gameData.id;

      const { data: sessionData, error } = await supabase.functions.invoke(
        "submit-quiz-session",
        {
          body: {
            gameId,
            score,
            accuracy,
            streak: matches,
            avgTime: matches > 0 ? timeElapsed / matches : 0,
            difficulty: 1,
            questionsAnswered: 8,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Game Complete! 🎉",
        description: `You earned ${sessionData.tokensEarned} C# Tokens!`,
      });

      setTimeout(() => {
        navigate("/results", {
          state: {
            score,
            accuracy,
            streak: matches,
            tokensEarned: sessionData.tokensEarned,
            newBalance: sessionData.newBalance,
            questionsAnswered: 8,
            avgTime: matches > 0 ? timeElapsed / matches : 0,
          },
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save game",
        variant: "destructive",
      });
    }
  };

  const accuracy = moves > 0 ? (matches / moves) * 100 : 0;
  const score = Math.max(0, 1000 - (moves * 10) - (timeElapsed * 2));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">Memory Match</h1>
          <div className="w-20" />
        </div>

        <ScoreTracker
          score={score}
          accuracy={accuracy}
          streak={matches}
          questionsAnswered={8}
          difficulty={1}
        />

        <Card className="p-6 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TimerIcon className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">{timeElapsed}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-bold">{matches}/8 Matches</span>
              </div>
            </div>
            <Button onClick={initializeGame} variant="outline">
              New Game
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => (
              <Card
                key={card.id}
                className={`aspect-square flex items-center justify-center cursor-pointer transition-all transform hover:scale-105 ${
                  card.isFlipped || card.isMatched
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                } ${card.isMatched ? "opacity-50" : ""}`}
                onClick={() => handleCardClick(card.id)}
              >
                <span className="text-lg font-mono font-bold">
                  {card.isFlipped || card.isMatched ? card.content : "?"}
                </span>
              </Card>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Moves: {moves} | Time Bonus: {Math.max(0, 100 - timeElapsed)}pts
          </div>
        </Card>
      </div>
    </div>
  );
}