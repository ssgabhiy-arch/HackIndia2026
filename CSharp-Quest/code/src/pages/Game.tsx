import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Trophy, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GameState = "idle" | "waiting" | "ready" | "finished";

const Game = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasClicked, setHasClicked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const startGame = () => {
    setGameState("waiting");
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          const randomDelay = Math.random() * 3000 + 1000;
          setTimeout(() => {
            setGameState("ready");
            setStartTime(Date.now());
          }, randomDelay);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClick = async () => {
    if (gameState === "ready" && !hasClicked) {
      setHasClicked(true); // Prevent multiple clicks
      const endTime = Date.now();
      const time = endTime - startTime;
      setReactionTime(time);
      
      if (userId) {
        try {
          const { data: games } = await supabase
            .from("games")
            .select("id")
            .eq("name", "Reaction Time Challenge")
            .single();

          if (games) {
            const { data, error } = await supabase.functions.invoke('submit-game-session', {
              body: {
                gameId: games.id,
                startTime: startTime,
                endTime: endTime,
              },
            });

            if (error) throw error;

            setTokensEarned(data.tokensEarned);

            toast({
              title: "Tokens Earned!",
              description: `You earned ${data.tokensEarned} Sharp tokens!`,
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Failed to save game",
            description: "Please try again",
          });
        }
      }
      
      setGameState("finished");
    } else if (gameState === "waiting") {
      toast({
        variant: "destructive",
        title: "Too early!",
        description: "Wait for the green signal!",
      });
      setGameState("idle");
    }
  };

  const resetGame = () => {
    setGameState("idle");
    setReactionTime(0);
    setTokensEarned(0);
    setCountdown(3);
    setHasClicked(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ⚡ Reaction Time Challenge
          </h1>
          <div className="w-32"></div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 mb-6">
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
              <CardDescription>Test your reflexes and earn Sharp tokens!</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Start Game" to begin</li>
                <li>Wait for the countdown</li>
                <li>When the screen turns <span className="text-accent font-bold">green</span>, click as fast as you can!</li>
                <li>Faster reactions = More tokens earned</li>
              </ol>
            </CardContent>
          </Card>

          <div
            onClick={handleClick}
            className={`
              relative rounded-xl border-2 aspect-video flex items-center justify-center cursor-pointer
              transition-all duration-300 overflow-hidden
              ${gameState === "idle" && "border-primary/50 bg-card hover:border-primary"}
              ${gameState === "waiting" && "border-destructive bg-destructive/10"}
              ${gameState === "ready" && "border-accent bg-accent/20 animate-pulse"}
              ${gameState === "finished" && "border-secondary bg-secondary/10"}
            `}
          >
            {gameState === "idle" && (
              <div className="text-center">
                <Zap className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">Ready to Test Your Speed?</h3>
                <p className="text-muted-foreground">Click anywhere to start</p>
              </div>
            )}

            {gameState === "waiting" && (
              <div className="text-center">
                <div className="text-8xl font-bold text-destructive animate-pulse">
                  {countdown > 0 ? countdown : "..."}
                </div>
                <p className="text-xl mt-4 text-destructive-foreground">Get Ready!</p>
              </div>
            )}

            {gameState === "ready" && (
              <div className="text-center">
                <div className="text-8xl animate-bounce">⚡</div>
                <h3 className="text-3xl font-bold text-accent mt-4">CLICK NOW!</h3>
              </div>
            )}

            {gameState === "finished" && (
              <div className="text-center space-y-4">
                <Trophy className="h-16 w-16 mx-auto text-secondary" />
                <div>
                  <h3 className="text-3xl font-bold mb-2">{reactionTime}ms</h3>
                  <p className="text-lg text-muted-foreground">Reaction Time</p>
                </div>
                <div className="bg-token/20 rounded-lg p-4 inline-block">
                  <p className="text-2xl font-bold text-token">+{tokensEarned} C# Tokens</p>
                </div>
                <div className="space-x-3">
                  <Button onClick={resetGame} size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Play Again
                  </Button>
                  <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg">
                    Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {gameState === "idle" && (
            <div className="mt-6 text-center">
              <Button onClick={startGame} size="lg" className="w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Game;
