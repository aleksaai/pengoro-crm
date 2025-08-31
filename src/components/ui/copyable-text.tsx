import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CopyableTextProps {
  text: string;
  displayText?: string;
  className?: string;
  iconClassName?: string;
  showToast?: boolean;
}

export function CopyableText({ 
  text, 
  displayText, 
  className = "", 
  iconClassName = "",
  showToast = true 
}: CopyableTextProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      if (showToast) {
        toast({
          title: "Copied to clipboard",
          description: `"${text}" has been copied`,
        });
      }
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      if (showToast) {
        toast({
          title: "Copy failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div 
      className={cn(
        "group relative inline-flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5 transition-colors",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCopy}
    >
      <span className="text-sm">
        {displayText || text}
      </span>
      
      {(isHovered || isCopied) && (
        <div className={cn("flex-shrink-0 transition-opacity", iconClassName)}>
          {isCopied ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </div>
      )}
    </div>
  );
}