
"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Zap, Info, CloudRain, CloudSnow, Wind, CloudDrizzle, MapPin } from 'lucide-react'; 

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<{ temp: string; description: string; icon: React.ElementType } | null>(null);
  const [city, setCity] = useState<string>("正在定位...");
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingCity, setLoadingCity] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeatherIcon = (description: string): React.ElementType => {
    const desc = description.toLowerCase();
    if (desc.includes('雨')) return CloudRain;
    if (desc.includes('雪')) return CloudSnow;
    if (desc.includes('晴')) return Sun;
    if (desc.includes('云') || desc.includes('阴')) return Cloud;
    if (desc.includes('风')) return Wind;
    if (desc.includes('毛毛雨')) return CloudDrizzle;
    if (desc.includes('雷')) return Zap;
    return Zap; // Default icon
  };

  const fetchMockWeather = (currentCity: string) => {
    setLoadingWeather(true);
    // Simulate API call delay for weather data
    setTimeout(() => {
      const mockDescriptions = ["晴朗", "多云", "小雨", "雷阵雨", "阴天"];
      const randomDesc = mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)];
      const randomTemp = Math.floor(Math.random() * 15) + 15; // Temp between 15-29°C
      
      setWeatherData({ 
        temp: `${randomTemp}°C`, 
        description: randomDesc, 
        icon: getWeatherIcon(randomDesc) 
      });
      setLoadingWeather(false);
      // To integrate real weather, you would call a weather API here using 'currentCity'
      // For example: fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${currentCity}&aqi=no`)
      // And then parse the response to setWeatherData.
      // You would also need a reverse geocoding API to get city name from lat/lon.
    }, 1000); // Shorter delay for mock data
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For now, we don't have reverse geocoding. So we'll just use a generic name.
          // In a real app, you'd use position.coords.latitude and position.coords.longitude
          // to call a reverse geocoding API to get the city name.
          setCity("当前位置"); 
          setLoadingCity(false);
          setError(null);
          fetchMockWeather("当前位置"); // Pass a placeholder or actual city if available
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          setCity("定位失败");
          setError("无法获取位置信息。请检查您的浏览器权限设置。");
          setLoadingCity(false);
          fetchMockWeather("武汉"); // Fallback city
        },
        { timeout: 10000 } // Optional: timeout for geolocation
      );
    } else {
      setCity("武汉"); // Fallback if geolocation is not supported
      setError("您的浏览器不支持地理位置服务。");
      setLoadingCity(false);
      fetchMockWeather("武汉");
    }
  }, []);

  return (
    <div className="p-3 text-center bg-neutral-700/60 dark:bg-neutral-800/70 backdrop-blur-sm rounded-lg shadow-lg text-white min-w-[10rem]">
       <h3 className="text-sm font-semibold text-white/80 mb-1 text-left flex items-center">
          <MapPin className="h-4 w-4 mr-1.5 text-blue-300" />
          {loadingCity ? "正在定位..." : `${city} (模拟数据)`}
        </h3>
        {(loadingCity || loadingWeather) ? (
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
            <span>{error || "天气数据不可用"}</span>
          </div>
        )}
    </div>
  );
};

export default Weather;

