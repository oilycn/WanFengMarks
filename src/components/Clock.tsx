
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
      <div className="p-2 text-center w-auto min-w-[10rem] md:min-w-[11rem]">
        <div className="text-xl font-bold font-headline tabular-nums animate-pulse text-neutral-700 dark:text-neutral-100">--:--:--</div>
        <div className="text-xs mt-0.5 animate-pulse text-neutral-500 dark:text-neutral-300">正在加载日期...</div>
      </div>
    );
  }

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="p-2 text-center w-auto min-w-[10rem] md:min-w-[11rem]">
      <div className="text-2xl font-bold font-headline tabular-nums tracking-tight text-neutral-700 dark:text-neutral-100">
        {formattedTime}
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">
        {formattedDate}
      </div>
    </div>
  );
};

export default Clock;
