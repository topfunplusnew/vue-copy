// /src/components/weatherService.js
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // 请替换成你的 API key

export async function getWeatherData(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_cn`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('天气数据获取失败');
  }
  const data = await response.json();
  const description = data.weather[0].description;
  const temp = Math.round(data.main.temp);
  return { description, temp };
}
