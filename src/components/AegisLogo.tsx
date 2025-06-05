
import React from 'react';
import { ShieldCheck } from 'lucide-react'; 

const AegisLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShieldCheck className="h-7 w-7 text-foreground" /> {/* Changed text-primary to text-foreground */}
      <h1 className="text-xl font-bold text-foreground font-headline">晚风Marks</h1> {/* Changed text-primary to text-foreground */}
    </div>
  );
};

export default AegisLogo;
