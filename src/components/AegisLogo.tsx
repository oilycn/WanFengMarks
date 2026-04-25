
import React from 'react';
import { iconMap as globalIconMap } from './AppSidebar'; // Assuming iconMap is exported from AppSidebar

interface AegisLogoProps {
  className?: string;
  logoText?: string;
  logoIconName?: string;
}

const AegisLogo: React.FC<AegisLogoProps> = ({ 
  className, 
  logoText = "晚风Marks", 
  logoIconName = "MarkImage" 
}) => {
  const IconComponent = globalIconMap[logoIconName] || globalIconMap['MarkImage'];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[0_8px_14px_-10px_rgba(15,23,42,0.55)] dark:bg-primary/14 dark:shadow-[0_10px_18px_-12px_rgba(0,0,0,0.8)]">
        <IconComponent className="h-5 w-5" />
      </span>
      <h1 className="text-lg md:text-xl font-semibold text-foreground font-headline tracking-tight">{logoText}</h1>
    </div>
  );
};

export default AegisLogo;
