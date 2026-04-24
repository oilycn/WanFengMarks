
import React from 'react';
import { ShieldCheck } from 'lucide-react'; 
import { iconMap as globalIconMap } from './AppSidebar'; // Assuming iconMap is exported from AppSidebar

interface AegisLogoProps {
  className?: string;
  logoText?: string;
  logoIconName?: string;
}

const AegisLogo: React.FC<AegisLogoProps> = ({ 
  className, 
  logoText = "晚风Marks", 
  logoIconName = "ShieldCheck" 
}) => {
  const IconComponent = globalIconMap[logoIconName] || ShieldCheck;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-accent/25 text-primary ring-1 ring-primary/25 shadow-sm">
        <IconComponent className="h-5 w-5" />
      </span>
      <h1 className="text-lg md:text-xl font-semibold text-foreground font-headline tracking-tight">{logoText}</h1>
    </div>
  );
};

export default AegisLogo;
