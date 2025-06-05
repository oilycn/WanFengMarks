
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AegisLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5">
      <ShieldCheck className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold text-primary font-headline">AegisMarks</h1>
    </div>
  );
};

export default AegisLogo;
