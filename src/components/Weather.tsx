"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Zap, Info } from 'lucide-react'; // Example icons

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<{ temp: string; description: string; icon: React.ElementType } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchWeather = async () => {
      setLoading(true);
      // In a real app, you'd fetch from a weather API here.
      // Example: const response = await fetch('/api/weather');
      // const data = await response.json();
      // For now, using mock data after a delay.
      setTimeout(() => {
        // This is placeholder data.
        setWeatherData({ temp: '24°C', description: '晴朗', icon: Sun }); // Translated "Sunny"
        setLoading(false);
      }, 1500);
    };

    fetchWeather();
  }, []);

  return (
    <Card className="shadow-md w-full md:w-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <span>本地天气</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-16 bg-muted rounded-md mx-auto mb-2"></div> {/* Placeholder for temp */}
            <div className="h-6 w-24 bg-muted rounded-md mx-auto"></div> {/* Placeholder for description */}
          </div>
        ) : weatherData ? (
          <>
            <weatherData.icon className="h-12 w-12 text-accent mx-auto mb-2" />
            <div className="text-3xl font-semibold text-foreground">{weatherData.temp}</div>
            <div className="text-md text-muted-foreground">{weatherData.description}</div>
          </>
        ) : (
           <div className="text-muted-foreground flex flex-col items-center gap-2 p-4">
            <Info className="h-8 w-8"/>
            <span>天气数据不可用。</span>
            <small className="text-xs">真实天气需要API集成。</small>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Weather;
