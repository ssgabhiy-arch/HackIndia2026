import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Zap, Trophy, LogOut, Brain, Code, Bug, Grid3X3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WalletCard } from "@/components/Wallet/WalletCard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadUserData(session.user.id);
        } else {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      const [tokensResult, sessionsResult] = await Promise.all([
        supabase.from("user_tokens").select("total_tokens").eq("user_id", userId).single(),
        supabase.from("game_sessions").select("id, score").eq("user_id", userId),
      ]);

      if (tokensResult.data) {
        setTokens(tokensResult.data.total_tokens);
      }

      if (sessionsResult.data) {
        setGamesPlayed(sessionsResult.data.length);
        const maxScore = Math.max(...sessionsResult.data.map(s => s.score), 0);
        setBestScore(maxScore);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading user data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sharp Gaming
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/leaderboard")}>
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.user_metadata?.display_name || "Player"}!</h2>
          <p className="text-muted-foreground">Ready to earn some tokens?</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <WalletCard balance={tokens} loading={loading} />

          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gamesPlayed}</div>
              <p className="text-xs text-muted-foreground mt-1">Total sessions</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestScore}</div>
              <p className="text-xs text-muted-foreground mt-1">Highest score</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/40 transition-all cursor-pointer" onClick={() => navigate("/quiz-game")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    <Brain className="h-6 w-6" />
                    AI Quiz Challenge
                  </CardTitle>
                  <CardDescription>AI-powered adaptive quiz</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test your programming knowledge with AI-generated questions!
              </p>
              <Button className="w-full" size="lg">
                <Brain className="mr-2 h-5 w-5" />
                Play Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-purple-500/10 to-transparent hover:border-purple-500/40 transition-all cursor-pointer" onClick={() => navigate("/memory-match")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    <Grid3X3 className="h-6 w-6 text-purple-500" />
                    Memory Match
                  </CardTitle>
                  <CardDescription>Match programming concepts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test your memory by matching programming terms!
              </p>
              <Button className="w-full" size="lg" variant="outline">
                <Grid3X3 className="mr-2 h-5 w-5" />
                Play Memory
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-destructive/10 to-transparent hover:border-destructive/40 transition-all cursor-pointer" onClick={() => navigate("/code-debug")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    <Bug className="h-6 w-6 text-destructive" />
                    Code Debugging
                  </CardTitle>
                  <CardDescription>Find and fix bugs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sharpen your debugging skills with AI challenges!
              </p>
              <Button className="w-full" size="lg" variant="outline">
                <Bug className="mr-2 h-5 w-5" />
                Debug Code
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-green-500/10 to-transparent hover:border-green-500/40 transition-all cursor-pointer" onClick={() => navigate("/algorithm-race")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    <Code className="h-6 w-6 text-green-500" />
                    Algorithm Race
                  </CardTitle>
                  <CardDescription>Solve algorithms fast</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Race against time to solve algorithm challenges!
              </p>
              <Button className="w-full" size="lg" variant="outline">
                <Zap className="mr-2 h-5 w-5" />
                Start Race
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/40 transition-all cursor-pointer" onClick={() => navigate("/game")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    Reaction Challenge
                  </CardTitle>
                  <CardDescription>Test your reflexes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click as fast as you can when the signal appears!
              </p>
              <Button className="w-full" size="lg" variant="outline">
                <Zap className="mr-2 h-5 w-5" />
                Play Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl">How to Earn Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Play Games</p>
                  <p className="text-sm text-muted-foreground">Complete games to earn tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-secondary/20 p-2">
                  <Trophy className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Compete</p>
                  <p className="text-sm text-muted-foreground">Higher scores earn more tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/20 p-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Climb Leaderboard</p>
                  <p className="text-sm text-muted-foreground">Top players get bonus rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
