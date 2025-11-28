import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Trophy, Coins } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-block animate-bounce">
            <Sparkles className="h-16 w-16 text-primary mx-auto" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
            Sharp Gaming
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Play exciting games, earn tokens, and compete on the leaderboard!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" className="text-lg" onClick={handleGetStarted}>
              <Zap className="mr-2 h-5 w-5" />
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
            
            {!isAuthenticated && (
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur hover:border-primary/40 transition-all">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Play Games</h3>
            <p className="text-muted-foreground">
              Test your skills with exciting mini-games designed to challenge your reflexes and strategy.
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl border border-secondary/20 bg-card/50 backdrop-blur hover:border-secondary/40 transition-all">
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Coins className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold">Earn Tokens</h3>
            <p className="text-muted-foreground">
              Collect tokens based on your performance. Better scores mean more rewards!
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl border border-accent/20 bg-card/50 backdrop-blur hover:border-accent/40 transition-all">
            <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Compete</h3>
            <p className="text-muted-foreground">
              Climb the leaderboard and prove you're the best. Top players get bragging rights!
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Join our gaming platform today and start your journey to becoming a top player!
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-lg">
              <Sparkles className="mr-2 h-5 w-5" />
              {isAuthenticated ? "Play Now" : "Sign Up Free"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
