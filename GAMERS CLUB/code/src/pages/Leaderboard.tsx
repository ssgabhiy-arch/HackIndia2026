import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  total_tokens: number;
  games_played: number;
  best_score: number;
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: tokensData, error } = await supabase
        .from("user_tokens")
        .select(`
          user_id,
          total_tokens,
          profiles!inner(display_name)
        `)
        .order("total_tokens", { ascending: false })
        .limit(10);

      if (error) throw error;

      const leaderboardData = await Promise.all(
        (tokensData || []).map(async (entry: any) => {
          const { data: sessions } = await supabase
            .from("game_sessions")
            .select("score")
            .eq("user_id", entry.user_id)
            .order("score", { ascending: true });

          return {
            user_id: entry.user_id,
            display_name: entry.profiles.display_name,
            total_tokens: entry.total_tokens,
            games_played: sessions?.length || 0,
            best_score: sessions?.[0]?.score || 0,
          };
        })
      );

      setLeaderboard(leaderboardData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading leaderboard:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            <Trophy className="inline mr-2 h-5 w-5" />
            Leaderboard
          </h1>
          <div className="w-32"></div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Top Players</CardTitle>
            <CardDescription>Compete to climb the ranks and earn your place!</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No players yet. Be the first to earn tokens!
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg border transition-all
                      ${index < 3 ? "bg-gradient-to-r border-primary/40" : "border-border bg-card/50"}
                      ${index === 0 && "from-yellow-500/10 to-transparent"}
                      ${index === 1 && "from-gray-400/10 to-transparent"}
                      ${index === 2 && "from-amber-600/10 to-transparent"}
                    `}
                  >
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{entry.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.games_played} games played
                        {entry.best_score > 0 && ` • Best: ${entry.best_score}ms`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-token">{entry.total_tokens}</p>
                      <p className="text-xs text-muted-foreground">C# Tokens</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
