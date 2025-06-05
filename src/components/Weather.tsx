
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Zap, Info, CloudRain, CloudSnow, Wind, CloudDrizzle } from 'lucide-react'; // Example icons

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<{ temp: string; description: string; icon: React.ElementType } | null>(null);
  const [loading, setLoading] = useState(true);

  // A simple mapping for demonstration. A real app would use API weather codes.
  const getWeatherIcon = (description: string): React.ElementType => {
    const desc = description.toLowerCase();
    if (desc.includes('雨')) return CloudRain;
    if (desc.includes('雪')) return CloudSnow;
    if (desc.includes('晴')) return Sun;
    if (desc.includes('云') || desc.includes('阴')) return Cloud;
    if (desc.includes('风')) return Wind;
    if (desc.includes('毛毛雨')) return CloudDrizzle;
    if (desc.includes('雷')) return Zap;
    return Zap; // Default
  };


  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      // Placeholder: In a real app, fetch from a weather API using geolocation.
      // For now, using mock data after a delay.
      setTimeout(() => {
        const mockDescriptions = ["晴朗", "多云", "小雨", "雷阵雨"];
        const randomDesc = mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)];
        const randomTemp = Math.floor(Math.random() * 15) + 15; // Temp between 15-30 C
        
        setWeatherData({ 
          temp: `${randomTemp}°C`, 
          description: randomDesc, 
          icon: getWeatherIcon(randomDesc) 
        });
        setLoading(false);
      }, 1500);
    };

    // Only run on client after mount
    if (typeof window !== 'undefined') {
      fetchWeather();
    }
  }, []);

  return (
    <Card className="shadow-sm w-full md:w-auto bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-base flex items-center gap-1.5 font-semibold text-primary/90">
          <Zap className="h-4 w-4 text-accent" />
          <span>本地天气 (模拟)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center p-3 pt-1">
        {loading ? (
          <div className="animate-pulse py-2">
            <div className="h-10 w-10 bg-muted rounded-full mx-auto mb-1.5"></div>
            <div className="h-7 w-12 bg-muted rounded-md mx-auto mb-1"></div>
            <div className="h-5 w-16 bg-muted rounded-md mx-auto"></div>
          </div>
        ) : weatherData ? (
          <>
            <weatherData.icon className="h-10 w-10 text-accent mx-auto mb-1" />
            <div className="text-2xl font-semibold text-foreground">{weatherData.temp}</div>
            <div className="text-sm text-muted-foreground">{weatherData.description}</div>
          </>
        ) : (
           <div className="text-muted-foreground flex flex-col items-center gap-1 p-3 text-sm">
            <Info className="h-6 w-6"/>
            <span>天气数据不可用。</span>
            <small className="text-xs">真实天气需要API集成。</small>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Weather;
