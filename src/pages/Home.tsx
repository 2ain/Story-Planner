
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Github } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/planner");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="max-w-md w-full px-4 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gradient">
            Story Planner
          </h1>
          <p className="text-xl text-muted-foreground">
            by 2ain
          </p>
        </div>
        
        <Button 
          onClick={handleEnter} 
          className="px-8 py-6 text-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          size="lg"
        >
          Start Planning
        </Button>
      </div>
      
      <footer className="absolute bottom-4 text-sm text-muted-foreground flex items-center gap-3">
        <p>Version 1.1</p>
        <a 
          href="https://github.com/2ain/Story-Planner" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block transition-opacity hover:opacity-80"
          aria-label="GitHub Repository"
        >
          <Github size={20} />
        </a>
      </footer>
    </div>
  );
};

export default Home;
