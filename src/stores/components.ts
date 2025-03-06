import { defineStore } from 'pinia';
import type { IWeather } from '@/types/components';
import { homeviewweather } from '@/services/api';
import { ref } from 'vue';

export const usecomponentsStore = defineStore('components', ()=>{
    const originWeather = ref<string>('');
    const originWeatherIcon = ref<string>('');
    const destinationWeather = ref<string>('');
    const destinationWeatherIcon = ref<string>('');
    
    function getWeather(city: string, isDestination = false) {
        return homeviewweather(city).then((res)=>{
            const weatherData = res.data as IWeather;
            const weatherText = `${weatherData.condition}, ${weatherData.temperature}°C, Humidity:${weatherData.humidity}%, WindSpeed:${weatherData.wind_speed}km/h`;
            
            if (isDestination) {
                destinationWeather.value = weatherText;
            } else {
                originWeather.value = weatherText;
            }
            
            if (weatherData.condition === 'Clear') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'sunny';
                } else {
                    originWeatherIcon.value = 'sunny';
                }
            } else if (weatherData.condition === 'Cloudy') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'cloudy';
                } else {
                    originWeatherIcon.value = 'cloudy';
                }
            } else if (weatherData.condition === 'Rainy') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'rainy';
                } else {
                    originWeatherIcon.value = 'rainy';
                }
            } else if (weatherData.condition === 'Snowy') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'snowy';
                } else {
                    originWeatherIcon.value = 'snowy';
                }
            } else if (weatherData.condition === 'Thunderstorm') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'thunderstorm';
                } else {
                    originWeatherIcon.value = 'thunderstorm';
                }
            } else if (weatherData.condition === 'Windy') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'windy';
                } else {
                    originWeatherIcon.value = 'windy';
                }
            }  else if (weatherData.condition === 'Slick') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'slick';
                } else {
                    originWeatherIcon.value = 'slick';
                }
            } else if (weatherData.condition === 'Foggy') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'foggy';
                } else {
                    originWeatherIcon.value = 'foggy';
                }
            } else if (weatherData.condition === 'Hot') {
                if (isDestination) {
                    destinationWeatherIcon.value = 'hot';
                } else {
                    originWeatherIcon.value = 'hot';
                }
            }
            
        }).catch((err)=>{
            console.error(err);
            if (isDestination) {
                destinationWeather.value = 'Weather unavailable';
                destinationWeatherIcon.value = '';
            } else {
                originWeather.value = 'Weather unavailable';
                originWeatherIcon.value = '';
            }
        })
    }
    return {
        originWeather,
        originWeatherIcon,
        destinationWeather,
        destinationWeatherIcon,
        getWeather,
    }
});
