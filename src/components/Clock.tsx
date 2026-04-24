
"use client";

import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null); 

  useEffect(() => {
    setTime(new Date()); 
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!time) {
    return (
      <div className="px-3 py-2 text-center min-w-[8.75rem] rounded-xl bg-card/65 ring-1 ring-foreground/[0.04]">
        <div className="text-lg font-semibold font-headline tabular-nums tracking-tight animate-pulse text-foreground">--:--:--</div>
        <div className="text-[11px] mt-0.5 animate-pulse text-muted-foreground">正在加载日期...</div>
      </div>
    );
  }

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="px-3 py-2 text-center min-w-[8.75rem] rounded-xl bg-card/65 ring-1 ring-foreground/[0.04]">
      <div className="text-lg font-semibold font-headline tabular-nums tracking-tight text-foreground">
        {formattedTime}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">
        {formattedDate}
      </div>
    </div>
  );
};

export default Clock;
