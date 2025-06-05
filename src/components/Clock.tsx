
"use client";

import React, { useState, useEffect } from 'react';
// Removed Card import as styling will be direct now

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
      <div className="p-3 text-center bg-black/30 backdrop-blur-sm rounded-lg shadow-lg text-white w-48">
        <div className="text-3xl font-bold font-headline tabular-nums animate-pulse">--:--:--</div>
        <div className="text-xs mt-0.5 animate-pulse">正在加载日期...</div>
      </div>
    );
  }

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="p-3 text-center bg-black/40 backdrop-blur-sm rounded-lg shadow-xl text-white w-auto min-w-[12rem] md:min-w-[14rem]">
      <div className="text-4xl md:text-5xl font-bold font-headline tabular-nums tracking-tight">
        {formattedTime}
      </div>
      <div className="text-xs md:text-sm text-white/80 mt-1">
        {formattedDate}
      </div>
    </div>
  );
};

export default Clock;
