import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative z-10 bg-card/80 backdrop-blur border-border max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="font-bebas text-8xl text-tower-gold tracking-wider mb-4">
            404
          </div>
          
          <h1 className="font-cinzel text-2xl font-bold mb-4">
            Floor Not Found
          </h1>
          
          <p className="text-muted-foreground mb-8">
            This floor of the tower doesn't exist yet. Perhaps you've climbed too high, or taken a wrong turn in the endless corridors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto" data-testid="button-go-home">
                <Home className="h-4 w-4 mr-2" />
                Return to Tower
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
