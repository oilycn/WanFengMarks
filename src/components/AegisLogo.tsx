import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AegisLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold text-primary font-headline">AegisMarks</h1>
    </div>
  );
};

export default AegisLogo;
