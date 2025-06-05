
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
      <div className="p-2 text-center bg-neutral-700/50 dark:bg-neutral-800/60 backdrop-blur-sm rounded-lg shadow-lg text-white w-auto min-w-[10rem] md:min-w-[11rem]">
        <div className="text-xl font-bold font-headline tabular-nums animate-pulse">--:--:--</div>
        <div className="text-xs mt-0.5 animate-pulse">正在加载日期...</div>
      </div>
    );
  }

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="p-2 text-center bg-neutral-700/60 dark:bg-neutral-800/70 backdrop-blur-sm rounded-lg shadow-xl text-white w-auto min-w-[10rem] md:min-w-[11rem]">
      <div className="text-2xl font-bold font-headline tabular-nums tracking-tight">
        {formattedTime}
      </div>
      <div className="text-xs text-white/80 mt-0.5">
        {formattedDate}
      </div>
    </div>
  );
};

export default Clock;
