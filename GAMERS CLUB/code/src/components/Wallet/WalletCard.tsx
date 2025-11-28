import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp } from "lucide-react";

interface WalletCardProps {
  balance: number;
  recentEarnings?: number;
  loading?: boolean;
}

export const WalletCard = ({ balance, recentEarnings, loading }: WalletCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-purple-500/20 to-primary/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-purple-500" />
          Sharp Tokens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-4xl font-bold text-purple-500 animate-fade-in">
              {loading ? "..." : balance.toLocaleString()}
            </p>
          </div>
          {recentEarnings !== undefined && recentEarnings > 0 && (
            <div className="flex items-center gap-2 text-green-500 animate-fade-in">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+{recentEarnings} earned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};