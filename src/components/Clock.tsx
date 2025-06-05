
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Clock: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null); // Initialize with null

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setTime(new Date()); 
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!time) {
    // Render a placeholder or null during SSR or before client mount
    return (
      <Card className="shadow-sm w-full md:w-auto bg-card/90 backdrop-blur-sm">
        <CardContent className="p-3 text-center">
          <div className="text-3xl font-bold text-primary/80 font-headline tabular-nums animate-pulse">--:--:--</div>
          <div className="text-xs text-muted-foreground mt-0.5 animate-pulse">正在加载日期...</div>
        </CardContent>
      </Card>
    );
  }

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Card className="shadow-sm w-full md:w-auto bg-card/90 backdrop-blur-sm">
      <CardContent className="p-3 text-center">
        <div className="text-3xl font-bold text-primary/90 font-headline tabular-nums">
          {formattedTime}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formattedDate}
        </div>
      </CardContent>
    </Card>
  );
};

export default Clock;
