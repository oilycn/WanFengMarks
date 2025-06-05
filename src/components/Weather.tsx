
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Zap, Info, CloudRain, CloudSnow, Wind, CloudDrizzle } from 'lucide-react'; 

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<{ temp: string; description: string; icon: React.ElementType } | null>(null);
  const [loading, setLoading] = useState(true);

  const getWeatherIcon = (description: string): React.ElementType => {
    const desc = description.toLowerCase();
    if (desc.includes('雨')) return CloudRain;
    if (desc.includes('雪')) return CloudSnow;
    if (desc.includes('晴')) return Sun;
    if (desc.includes('云') || desc.includes('阴')) return Cloud;
    if (desc.includes('风')) return Wind;
    if (desc.includes('毛毛雨')) return CloudDrizzle;
    if (desc.includes('雷')) return Zap;
    return Zap;
  };


  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setTimeout(() => {
        const mockDescriptions = ["晴朗", "多云", "小雨", "雷阵雨", "阴天"];
        const randomDesc = mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)];
        const randomTemp = Math.floor(Math.random() * 15) + 15; 
        
        setWeatherData({ 
          temp: `${randomTemp}°C`, 
          description: randomDesc, 
          icon: getWeatherIcon(randomDesc) 
        });
        setLoading(false);
      }, 1500);
    };

    if (typeof window !== 'undefined') {
      fetchWeather();
    }
  }, []);

  return (
    <div className="p-3 text-center bg-black/30 backdrop-blur-sm rounded-lg shadow-lg text-white min-w-[10rem]">
       <h3 className="text-sm font-semibold text-white/80 mb-1 text-left flex items-center">
          <Zap className="h-4 w-4 mr-1.5 text-yellow-400" />
          本地天气 (模拟)
        </h3>
        {loading ? (
          <div className="animate-pulse py-2">
            <div className="h-8 w-8 bg-white/20 rounded-full mx-auto mb-1.5"></div>
            <div className="h-6 w-10 bg-white/20 rounded-md mx-auto mb-1"></div>
            <div className="h-4 w-14 bg-white/20 rounded-md mx-auto"></div>
          </div>
        ) : weatherData ? (
          <div className="flex items-center justify-center space-x-3">
            <weatherData.icon className="h-8 w-8 text-yellow-300" />
            <div>
                <div className="text-xl font-semibold">{weatherData.temp}</div>
                <div className="text-xs text-white/70">{weatherData.description}</div>
            </div>
          </div>
        ) : (
           <div className="text-white/70 flex flex-col items-center gap-1 p-2 text-xs">
            <Info className="h-5 w-5"/>
            <span>天气数据不可用</span>
          </div>
        )}
    </div>
  );
};

export default Weather;
