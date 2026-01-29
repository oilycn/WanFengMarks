
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
    <div className={`flex items-center gap-2 ${className}`}>
      <IconComponent className="h-7 w-7 text-foreground" />
      <h1 className="text-xl font-bold text-foreground font-headline">{logoText}</h1>
    </div>
  );
};

export default AegisLogo;
