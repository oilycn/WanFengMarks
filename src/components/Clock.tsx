"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formattedTime = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Card className="shadow-md w-full md:w-auto">
      <CardContent className="p-4 text-center">
        <div className="text-4xl font-bold text-primary font-headline tabular-nums">
          {formattedTime}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {formattedDate}
        </div>
      </CardContent>
    </Card>
  );
};

export default Clock;
