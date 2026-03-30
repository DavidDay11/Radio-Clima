const API_KEY = 'd4f21e1a05e4a72937ad728952155b17'; // Placeholder - usar tu propia API key de OpenWeatherMap
const CITY_NAME = 'Córdoba';
const COUNTRY_CODE = 'AR';

let audio = document.getElementById('audioPlayer');
let isPlaying = false;
let animationInterval;

// Reloj en tiempo real
function updateClock() {
    const now = new Date();
    const options = { 
        timeZone: 'America/Argentina/Cordoba',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const timeString = now.toLocaleString('es-AR', options);
    document.getElementById('currentTime').textContent = timeString;
}

// Calcular fase lunar
function getMoonPhase() {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    
    let c = 0, e = 0, jd = 0, b = 0;
    
    if (month < 3) {
        year--;
        month += 12;
    }
    
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    
    if (b >= 8) b = 0;
    
    const phases = [
        { name: '🌑 Luna Nueva', icon: '🌑' },
        { name: '🌒 Creciente', icon: '🌒' },
        { name: '🌓 Cuarto Creciente', icon: '🌓' },
        { name: '🌔 Creciente Gibosa', icon: '🌔' },
        { name: '🌕 Luna Llena', icon: '🌕' },
        { name: '🌖 Menguante Gibosa', icon: '🌖' },
        { name: '🌗 Cuarto Menguante', icon: '🌗' },
        { name: '🌘 Menguante', icon: '🌘' }
    ];
    
    return phases[b].name;
}

// Obtener icono del clima
function getWeatherIcon(code, isDay = true) {
    const icons = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return icons[code] || '🌤️';
}

// Obtener clima actual
async function getCurrentWeather() {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME},${COUNTRY_CODE}&units=metric&lang=es&appid=${API_KEY}`
        );
        const data = await response.json();
        
        // Verificar si es de noche
        const currentTime = Math.floor(Date.now() / 1000);
        const isNight = currentTime < data.sys.sunrise || currentTime > data.sys.sunset;
        
        // Si es de noche, mostrar la luna
        const weatherIcon = isNight ? '🌙' : getWeatherIcon(data.weather[0].icon);
        
        const html = `
            <div class="weather-icon-large">${weatherIcon}</div>
            <div class="weather-main">
                <div class="temperature">${Math.round(data.main.temp)}°C</div>
                <div class="weather-description">${data.weather[0].description}</div>
                <div class="temp-range">
                    Máx: ${Math.round(data.main.temp_max)}° / Mín: ${Math.round(data.main.temp_min)}°
                </div>
            </div>
        `;
        
        document.getElementById('currentWeather').innerHTML = html;
    } catch (error) {
        console.error('Error al obtener clima actual:', error);
        document.getElementById('currentWeather').innerHTML = 
            '<div class="loading">Error al cargar el clima. Usando API demo.</div>';
        loadDemoWeather();
    }
}

// Obtener pronóstico semanal
async function getWeeklyForecast() {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${CITY_NAME},${COUNTRY_CODE}&units=metric&lang=es&appid=${API_KEY}`
        );
        const data = await response.json();
        
        const dailyData = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('es-AR');
            const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' });
            const hour = date.getHours();
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    temps: [],
                    dayIcon: null,
                    nightIcon: null,
                    day: dayName
                };
            }
            
            dailyData[dayKey].temps.push(item.main.temp);
            
            // Guardar icono del día (solo durante horas diurnas: 12:00-15:00 para mejor representación)
            if (hour >= 12 && hour <= 15 && !dailyData[dayKey].dayIcon) {
                dailyData[dayKey].dayIcon = item.weather[0].icon.replace('n', 'd'); // Forzar icono de día
            }
            // Guardar icono de la noche (solo durante horas nocturnas)
            if ((hour >= 21 || hour <= 3) && !dailyData[dayKey].nightIcon) {
                dailyData[dayKey].nightIcon = item.weather[0].icon;
            }
        });
        
        const days = Object.values(dailyData).slice(0, 7);
        let html = '';
        
        days.forEach(day => {
            const maxTemp = Math.round(Math.max(...day.temps));
            const minTemp = Math.round(Math.min(...day.temps));
            const dayIcon = day.dayIcon ? getWeatherIcon(day.dayIcon) : '☀️';
            const nightIcon = day.nightIcon ? '🌙' : '🌙';
            
            html += `
                <div class="day-forecast">
                    <div class="day-name">${day.day}</div>
                    <div class="forecast-icons">
                        <span class="forecast-icon">${dayIcon}</span>
                        <span class="forecast-icon">${nightIcon}</span>
                    </div>
                    <div class="forecast-temps">
                        <span class="max-temp">${maxTemp}°</span> / 
                        <span class="min-temp">${minTemp}°</span>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('weeklyForecast').innerHTML = html;
    } catch (error) {
        console.error('Error al obtener pronóstico:', error);
        loadDemoForecast();
    }
}

// Datos demo si falla la API
function loadDemoWeather() {
    const html = `
        <div class="weather-icon-large">☀️</div>
        <div class="weather-main">
            <div class="temperature">24°C</div>
            <div class="weather-description">Soleado</div>
            <div class="temp-range">Máx: 28° / Mín: 18°</div>
        </div>
    `;
    document.getElementById('currentWeather').innerHTML = html;
}

function loadDemoForecast() {
    const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const dayIcons = ['☀️', '⛅', '☁️', '🌦️', '☀️', '⛅', '☀️'];
    const nightIcons = ['🌙', '🌙', '🌙', '🌙', '🌙', '🌙', '🌙'];
    const maxTemps = [28, 26, 24, 22, 27, 29, 30];
    const minTemps = [18, 17, 16, 15, 19, 20, 21];
    
    let html = '';
    days.forEach((day, i) => {
        html += `
            <div class="day-forecast">
                <div class="day-name">${day}</div>
                <div class="forecast-icons">
                    <span class="forecast-icon">${dayIcons[i]}</span>
                    <span class="forecast-icon">${nightIcons[i]}</span>
                </div>
                <div class="forecast-temps">
                    <span class="max-temp">${maxTemps[i]}°</span> / 
                    <span class="min-temp">${minTemps[i]}°</span>
                </div>
            </div>
        `;
    });
    document.getElementById('weeklyForecast').innerHTML = html;
}

// Control del reproductor
document.getElementById('playPauseBtn').addEventListener('click', function() {
    if (isPlaying) {
        audio.pause();
        this.textContent = '▶ Play';
        isPlaying = false;
    } else {
        audio.play();
        this.textContent = '⏸ Pausa';
        isPlaying = true;
    }
});

document.getElementById('refreshBtn').addEventListener('click', function() {
    audio.load();
    audio.play();
    document.getElementById('playPauseBtn').textContent = '⏸ Pausa';
    isPlaying = true;
});

document.getElementById('volumeSlider').addEventListener('input', function() {
    audio.volume = this.value / 100;
    document.getElementById('volumeValue').textContent = this.value + '%';
});

// Animación anti burn-in
function animateElements() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        const randomX = Math.floor(Math.random() * 5) - 2;
        const randomY = Math.floor(Math.random() * 5) - 2;
        section.style.transform = `translate(${randomX}px, ${randomY}px)`;
    });
}

// Inicialización
audio.volume = 0.7;
updateClock();
setInterval(updateClock, 1000);

document.getElementById('moonPhase').textContent = getMoonPhase();

getCurrentWeather();
getWeeklyForecast();

setInterval(() => {
    getCurrentWeather();
    getWeeklyForecast();
}, 600000); // Actualizar cada 10 minutos

// Animación cada 30 segundos
setInterval(animateElements, 30000);

const capibaraGifs = {
  desayunando: 'https://media.giphy.com/media/bGvm4bCXlCYitmW3xV/giphy.gif',
  almorzando:  'https://media.giphy.com/media/7fVaFeAU6GHVmEfc08/giphy.gif',
  durmiendo:   'https://media.giphy.com/media/DhAGxDXQiiEl5S1OoM/giphy.gif',
  jugando:     'https://media.giphy.com/media/oglVMFOJskmTftbevE/giphy.gif',
  merendando:  'https://media.giphy.com/media/bGvm4bCXlCYitmW3xV/giphy.gif'
};

function getEstadoCapibara() {
  const ahora = new Date();
  const t = ahora.getHours() + ahora.getMinutes() / 60;
  if (t >= 9    && t < 11.5) return 'desayunando';
  if (t >= 11.5 && t < 13)   return 'almorzando';
  if (t >= 13   && t < 15)   return 'durmiendo';
  if (t >= 15  && t< 16.5 )    return 'merendando';
  if (t >= 16.5   && t < 19)   return 'jugando';
  return 'durmiendo';
}

function actualizarCapibara() {
    const estado = getEstadoCapibara();
    const img = document.getElementById('capibara-gif');
    if (!img || img.dataset.estado === estado) return;

    img.style.opacity = '0';

    setTimeout(() => {
        img.dataset.estado = estado;

        // 1. onload ANTES de cambiar src
        img.onload = () => { img.style.opacity = '1'; };

        img.src = capibaraGifs[estado];

        // 2. Fallback: si ya estaba cacheado y onload no dispara
        setTimeout(() => { img.style.opacity = '1'; }, 500);
    }, 400);
}

actualizarCapibara();
setInterval(actualizarCapibara, 60_000);