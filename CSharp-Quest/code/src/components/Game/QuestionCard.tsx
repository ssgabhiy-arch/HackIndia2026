import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuestionCardProps {
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  isAnswered: boolean;
}

export const QuestionCard = ({
  question,
  options,
  selectedAnswer,
  correctAnswer,
  onSelectAnswer,
  isAnswered,
}: QuestionCardProps) => {
  const getButtonVariant = (index: number) => {
    if (!isAnswered) return selectedAnswer === index ? "default" : "outline";
    if (index === correctAnswer) return "default";
    if (index === selectedAnswer && selectedAnswer !== correctAnswer) return "destructive";
    return "outline";
  };

  const getButtonIcon = (index: number) => {
    if (!isAnswered) return null;
    if (index === correctAnswer) return <CheckCircle2 className="h-5 w-5" />;
    if (index === selectedAnswer && selectedAnswer !== correctAnswer)
      return <XCircle className="h-5 w-5" />;
    return null;
  };

  return (
    <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">{question}</h2>
        <div className="grid gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              onClick={() => !isAnswered && onSelectAnswer(index)}
              variant={getButtonVariant(index)}
              disabled={isAnswered}
              className="justify-start text-left h-auto py-4 px-6 transition-all hover:scale-102"
            >
              <span className="flex items-center gap-3 w-full">
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                <span className="flex-1">{option}</span>
                {getButtonIcon(index)}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};