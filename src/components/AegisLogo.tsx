
import React from 'react';
import { ShieldCheck } from 'lucide-react'; // Or any other logo icon you prefer

const AegisLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShieldCheck className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-primary font-headline">AegisMarks</h1>
    </div>
  );
};

export default AegisLogo;
