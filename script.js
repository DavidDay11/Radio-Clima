const API_KEY = 'd4f21e1a05e4a72937ad728952155b17'; // Placeholder - usar tu propia API key de OpenWeatherMap
const CITY_NAME = 'Córdoba';
const COUNTRY_CODE = 'AR';

let audio = document.getElementById('audioPlayer');
let isPlaying = false;
let animationInterval;


// =====================================================
// RELOJ EN TIEMPO REAL
// =====================================================

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


// =====================================================
// FASE LUNAR
// =====================================================

function getMoonPhase() {

    const date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();

    let c = 0;
    let e = 0;
    let jd = 0;
    let b = 0;

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

    if (b >= 8) {
        b = 0;
    }

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


// =====================================================
// ICONOS DEL CLIMA
// =====================================================

function getWeatherIcon(code, isDay = true) {

    const icons = {
        '01d': '☀️',
        '01n': '🌙',

        '02d': '⛅',
        '02n': '☁️',

        '03d': '☁️',
        '03n': '☁️',

        '04d': '☁️',
        '04n': '☁️',

        '09d': '🌧️',
        '09n': '🌧️',

        '10d': '🌦️',
        '10n': '🌧️',

        '11d': '⛈️',
        '11n': '⛈️',

        '13d': '❄️',
        '13n': '❄️',

        '50d': '🌫️',
        '50n': '🌫️'
    };

    return icons[code] || '🌤️';
}


// =====================================================
// CLIMA ACTUAL
// =====================================================

async function getCurrentWeather() {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME},${COUNTRY_CODE}&units=metric&lang=es&appid=${API_KEY}`
        );

        const data = await response.json();

        // Verificar si es de noche
        const currentTime = Math.floor(Date.now() / 1000);

        const isNight =
            currentTime < data.sys.sunrise ||
            currentTime > data.sys.sunset;

        // Si es de noche, mostrar la luna
        const weatherIcon = isNight
            ? '🌙'
            : getWeatherIcon(data.weather[0].icon);

        const html = `
            <div class="weather-icon-large">${weatherIcon}</div>

            <div class="weather-main">

                <div class="temperature">
                    ${Math.round(data.main.temp)}°C
                </div>

                <div class="weather-description">
                    ${data.weather[0].description}
                </div>

                <div class="temp-range">
                    Máx: ${Math.round(data.main.temp_max)}° /
                    Mín: ${Math.round(data.main.temp_min)}°
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


// =====================================================
// PRONÓSTICO SEMANAL
// =====================================================

async function getWeeklyForecast() {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${CITY_NAME},${COUNTRY_CODE}&units=metric&lang=es&appid=${API_KEY}`
        );

        const data = await response.json();

        const dailyData = {};

        data.list.forEach(item => {

            const date = new Date(item.dt * 1000);

            const dayKey =
                date.toLocaleDateString('es-AR');

            const dayName =
                date.toLocaleDateString(
                    'es-AR',
                    { weekday: 'long' }
                );

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


            // Icono del día
            if (
                hour >= 12 &&
                hour <= 15 &&
                !dailyData[dayKey].dayIcon
            ) {

                dailyData[dayKey].dayIcon =
                    item.weather[0].icon.replace('n', 'd');
            }


            // Icono de la noche
            if (
                (hour >= 21 || hour <= 3) &&
                !dailyData[dayKey].nightIcon
            ) {

                dailyData[dayKey].nightIcon =
                    item.weather[0].icon;
            }

        });


        const days =
            Object.values(dailyData).slice(0, 7);

        let html = '';


        days.forEach(day => {

            const maxTemp =
                Math.round(Math.max(...day.temps));

            const minTemp =
                Math.round(Math.min(...day.temps));

            const dayIcon =
                day.dayIcon
                    ? getWeatherIcon(day.dayIcon)
                    : '☀️';

            const nightIcon =
                day.nightIcon
                    ? '🌙'
                    : '🌙';


            html += `
                <div class="day-forecast">

                    <div class="day-name">
                        ${day.day}
                    </div>

                    <div class="forecast-icons">

                        <span class="forecast-icon">
                            ${dayIcon}
                        </span>

                        <span class="forecast-icon">
                            ${nightIcon}
                        </span>

                    </div>

                    <div class="forecast-temps">

                        <span class="max-temp">
                            ${maxTemp}°
                        </span>

                        /

                        <span class="min-temp">
                            ${minTemp}°
                        </span>

                    </div>

                </div>
            `;
        });


        document.getElementById('weeklyForecast').innerHTML =
            html;

    } catch (error) {

        console.error(
            'Error al obtener pronóstico:',
            error
        );

        loadDemoForecast();
    }
}


// =====================================================
// CLIMA DEMO
// =====================================================

function loadDemoWeather() {

    const html = `
        <div class="weather-icon-large">
            ☀️
        </div>

        <div class="weather-main">

            <div class="temperature">
                24°C
            </div>

            <div class="weather-description">
                Soleado
            </div>

            <div class="temp-range">
                Máx: 28° / Mín: 18°
            </div>

        </div>
    `;

    document.getElementById('currentWeather').innerHTML =
        html;
}


// =====================================================
// PRONÓSTICO DEMO
// =====================================================

function loadDemoForecast() {

    const days = [
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
        'domingo'
    ];

    const dayIcons = [
        '☀️',
        '⛅',
        '☁️',
        '🌦️',
        '☀️',
        '⛅',
        '☀️'
    ];

    const nightIcons = [
        '🌙',
        '🌙',
        '🌙',
        '🌙',
        '🌙',
        '🌙',
        '🌙'
    ];

    const maxTemps = [
        28,
        26,
        24,
        22,
        27,
        29,
        30
    ];

    const minTemps = [
        18,
        17,
        16,
        15,
        19,
        20,
        21
    ];


    let html = '';


    days.forEach((day, i) => {

        html += `
            <div class="day-forecast">

                <div class="day-name">
                    ${day}
                </div>

                <div class="forecast-icons">

                    <span class="forecast-icon">
                        ${dayIcons[i]}
                    </span>

                    <span class="forecast-icon">
                        ${nightIcons[i]}
                    </span>

                </div>

                <div class="forecast-temps">

                    <span class="max-temp">
                        ${maxTemps[i]}°
                    </span>

                    /

                    <span class="min-temp">
                        ${minTemps[i]}°
                    </span>

                </div>

            </div>
        `;
    });


    document.getElementById('weeklyForecast').innerHTML =
        html;
}


// =====================================================
// REPRODUCTOR
// =====================================================

document
    .getElementById('playPauseBtn')
    .addEventListener('click', function () {

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


document
    .getElementById('refreshBtn')
    .addEventListener('click', function () {

        audio.load();

        audio.play();

        document.getElementById('playPauseBtn')
            .textContent = '⏸ Pausa';

        isPlaying = true;
    });


document
    .getElementById('volumeSlider')
    .addEventListener('input', function () {

        audio.volume = this.value / 100;

        document.getElementById('volumeValue')
            .textContent = this.value + '%';
    });


// =====================================================
// ANIMACIÓN ANTI BURN-IN
// =====================================================

function animateElements() {

    const sections =
        document.querySelectorAll('.section');

    sections.forEach(section => {

        const randomX =
            Math.floor(Math.random() * 5) - 2;

        const randomY =
            Math.floor(Math.random() * 5) - 2;

        section.style.transform =
            `translate(${randomX}px, ${randomY}px)`;
    });
}


// =====================================================
// INICIALIZACIÓN
// =====================================================

audio.volume = 0.7;

updateClock();

setInterval(updateClock, 1000);


document.getElementById('moonPhase').textContent =
    getMoonPhase();


getCurrentWeather();

getWeeklyForecast();


setInterval(() => {

    getCurrentWeather();

    getWeeklyForecast();

}, 600000); // Cada 10 minutos


setInterval(
    animateElements,
    30000
);


// =====================================================
// 🦫 CAPIBARAS
// =====================================================
//
// Pools:
//
// COMIENDO:
// desayunando + merendando
//
// ACTIVIDAD:
// media mañana + jugando
//
// ALMUERZO:
// almorzando
//
// DURMIENDO:
// siesta + durmiendo
//
// Cambia automáticamente cada 30 minutos.
// No necesita recargar la página.
// El GIF nuevo nunca será igual al anterior.
// =====================================================


const capibaraPools = {

    comiendo: [
        'https://media.giphy.com/media/pj2UVuSj39Dx2czoZl/giphy.gif',
        'https://media.giphy.com/media/bGvm4bCXlCYitmW3xV/giphy.gif',
        'https://media.giphy.com/media/lhJUkqTdfCI2tnTj79/giphy.gif',
        'https://media.giphy.com/media/9fBuq1fDqDAutxMjay/giphy.gif',
        'https://media.giphy.com/media/FR5HZ3A2CBeah6Nbsy/giphy.gif',
        'https://media.giphy.com/media/itLhw5RogfvKGv7K7J/giphy.gif',
        'https://media.giphy.com/media/pW4kZJuTuoq7NFH6VE/giphy.gif',
        'https://media.giphy.com/media/XEHhfEvGc89ablCLXz/giphy.gif',
        'https://media.giphy.com/media/FET5gt8EzjVy7TaUxb/giphy.gif'
    ],

    actividad: [
        'https://media.giphy.com/media/FS9oyWJ6veb4ztVVXa/giphy.gif',
        'https://media.giphy.com/media/1rPWDV2ZFFXf0nIbKq/giphy.gif',
        'https://media.giphy.com/media/A8BUPZ8EuzdGvOX9OD/giphy.gif',
        'https://media.giphy.com/media/vviWp5CgMe1j3BXoyP/giphy.gif',
        'https://media.giphy.com/media/7u8akvCzFvMHqXOWpF/giphy.gif',
        'https://media.giphy.com/media/BGNqyMH5iu7rIhWTNS/giphy.gif',
        'https://media.giphy.com/media/t09V8kBgeGTg6TxRZc/giphy.gif',
        'https://media.giphy.com/media/oglVMFOJskmTftbevE/giphy.gif',
        'https://media.giphy.com/media/9YgvHmuFSqRkhTRdwH/giphy.gif',
        'https://media.giphy.com/media/57K2Cqz0lM2EpbDUGf/giphy.gif',
        'https://media.giphy.com/media/93xSDIQ1MrlaVSSYJQ/giphy.gif',
        'https://media.giphy.com/media/bv1BRHeP4y9GWxVL5z/giphy.gif',
        'https://media.giphy.com/media/NzoaQ1BoGcPE1He8Ub/giphy.gif',
        'https://media.giphy.com/media/y6QcWtXSMYYIdgVMjb/giphy.gif',
        'https://media.giphy.com/media/cEbE8P0FTuPSAHwByn/giphy.gif',
        'https://media.giphy.com/media/myzt3x9JSb5sHXHjtr/giphy.gif',
        'https://media.giphy.com/media/4ncC3ndzAbp17cpK41/giphy.gif',
        'https://media.giphy.com/media/9b9J61wCsu8OMgVlrY/giphy.gif',
        'https://media.giphy.com/media/CQDZwXrpNQ0uBgcCfr/giphy.gif',
        'https://media.giphy.com/media/7QSeooTwVg0gfYdwNE/giphy.gif',
        'https://media.giphy.com/media/gSAKvgeqDz8qzdXnka/giphy.gif',
        'https://media.giphy.com/media/aPAaN8tW4YYIUHXhj6/giphy.gif',
        'https://media.giphy.com/media/z88dAvuFg4mDS9UWWG/giphy.gif'
    ],

    almuerzo: [
        'https://media.giphy.com/media/l1uSgb7Q4q6dRQunQe/giphy.gif',
        'https://media.giphy.com/media/pVyu6rQsCxcxziU8WK/giphy.gif',
        'https://media.giphy.com/media/8Irqo70IzK2PjTyVmZ/giphy.gif',
        'https://media.giphy.com/media/CGwJKFTrMbZ7vGKqtx/giphy.gif',
        'https://media.giphy.com/media/a1uUCMxKNVLNusMdpd/giphy.gif',
        'https://media.giphy.com/media/bFFxgCn1ZpjIvimNXS/giphy.gif',
        'https://media.giphy.com/media/pUtG3bxqnmIs5hyHuF/giphy.gif',
        'https://media.giphy.com/media/jcmedM165Zp07V02dV/giphy.gif',
        'https://media.giphy.com/media/eOU3H01o4ylHGAOg2h/giphy.gif',
        'https://media.giphy.com/media/F0q6qGNeLvNBxJee0I/giphy.gif'
    ],

    durmiendo: [
        'https://media.giphy.com/media/bvTHXvEacIu8Kgx6RO/giphy.gif',
        'https://media.giphy.com/media/WIb1rMuj6BWJwii1A2/giphy.gif',
        'https://media.giphy.com/media/moH0jCwPwnlDIEZJCG/giphy.gif',
        'https://media.giphy.com/media/E2NHsL3gOdeE7hEEvV/giphy.gif',
        'https://media.giphy.com/media/a5r6WtfTIquDyM2XjM/giphy.gif',
        'https://media.giphy.com/media/2ewM4OSexrpLvV877M/giphy.gif',
        'https://media.giphy.com/media/YcuDDysmYnwaTtZb7g/giphy.gif',
        'https://media.giphy.com/media/hFnmR8Z9pomj3yZ9pd/giphy.gif'
    ]
};


// =====================================================
// ESTADO DEL CAPIBARA
// =====================================================

function getEstadoCapibara() {

    const ahora = new Date();

    const t =
        ahora.getHours() +
        ahora.getMinutes() / 60;


    if (t >= 8 && t < 9.5) {
        return {
            estado: 'desayunando',
            pool: 'comiendo'
        };
    }

    if (t >= 9.5 && t < 11.5) {
        return {
            estado: 'mediamanana',
            pool: 'actividad'
        };
    }

    if (t >= 11.5 && t < 13) {
        return {
            estado: 'almorzando',
            pool: 'almuerzo'
        };
    }

    if (t >= 13 && t < 15) {
        return {
            estado: 'siesta',
            pool: 'durmiendo'
        };
    }

    if (t >= 15 && t < 16.5) {
        return {
            estado: 'merendando',
            pool: 'comiendo'
        };
    }

    if (t >= 16.5 && t < 19) {
        return {
            estado: 'jugando',
            pool: 'actividad'
        };
    }

    return {
        estado: 'durmiendo',
        pool: 'durmiendo'
    };
}


// =====================================================
// OBTENER GIF ALEATORIO
// =====================================================

function obtenerGifCapibara(pool) {

    const gifs = capibaraPools[pool];

    if (!gifs || gifs.length === 0) {
        return '';
    }

    const img =
        document.getElementById('capibara-gif');

    const ultimoGif =
        img?.dataset.ultimoGif || '';

    // Si hay más de un GIF, evitar repetir el anterior
    if (gifs.length > 1) {

        let nuevoGif;

        do {
            nuevoGif =
                gifs[Math.floor(Math.random() * gifs.length)];

        } while (nuevoGif === ultimoGif);

        return nuevoGif;
    }

    return gifs[0];
}


// =====================================================
// CAMBIAR GIF
// =====================================================

function cambiarCapibara(info) {

    const img =
        document.getElementById('capibara-gif');

    if (!img) {
        return;
    }


    const nuevoGif =
        obtenerGifCapibara(info.pool);

    if (!nuevoGif) {
        return;
    }


    // Fade out
    img.style.opacity = '0';


    setTimeout(() => {

        img.onload = () => {
            img.style.opacity = '1';
        };


        img.src = nuevoGif;


        // Guardar información
        img.dataset.estado =
            info.estado;

        img.dataset.pool =
            info.pool;

        img.dataset.ultimoGif =
            nuevoGif;


        // Guardamos el bloque de 30 minutos
        img.dataset.ultimoBloque =
            obtenerBloque30Minutos();


        // Fallback por si está en caché
        setTimeout(() => {
            img.style.opacity = '1';
        }, 700);

    }, 400);
}


// =====================================================
// BLOQUE DE 30 MINUTOS ACTUAL
// =====================================================
//
// Ejemplos:
//
// 08:00 - 08:29 → bloque 16
// 08:30 - 08:59 → bloque 17
// 09:00 - 09:29 → bloque 18
// 09:30 - 09:59 → bloque 19
//
// Cada bloque tiene un número único.
// =====================================================

function obtenerBloque30Minutos() {

    const ahora = new Date();

    const minutosTotales =
        ahora.getHours() * 60 +
        ahora.getMinutes();

    return Math.floor(minutosTotales / 30);
}


// =====================================================
// ACTUALIZAR CAPIBARA
// =====================================================

function actualizarCapibara() {

    const info =
        getEstadoCapibara();

    const img =
        document.getElementById('capibara-gif');

    if (!img) {
        return;
    }


    const bloqueActual =
        obtenerBloque30Minutos();

    const ultimoBloque =
        Number(
            img.dataset.ultimoBloque || -1
        );


    // -------------------------------------------------
    // 1. PRIMERA CARGA
    // -------------------------------------------------

    if (!img.dataset.ultimoGif) {

        cambiarCapibara(info);

        return;
    }


    // -------------------------------------------------
    // 2. CAMBIÓ EL ESTADO
    // -------------------------------------------------
    //
    // Por ejemplo:
    //
    // 09:29 → media mañana
    // 09:30 → sigue media mañana
    //
    // 11:29 → media mañana
    // 11:30 → almorzando
    //
    // En ambos casos se cambia el GIF.
    // -------------------------------------------------

    if (img.dataset.estado !== info.estado) {

        cambiarCapibara(info);

        return;
    }


    // -------------------------------------------------
    // 3. CAMBIÓ EL BLOQUE DE 30 MINUTOS
    // -------------------------------------------------

    if (bloqueActual !== ultimoBloque) {

        cambiarCapibara(info);

        return;
    }
}


// =====================================================
// INICIO
// =====================================================

actualizarCapibara();


// Revisamos cada segundo.
//
// No importa si la página se abrió a las 08:17,
// 08:29 o 08:47.
//
// El sistema detecta el cambio de bloque:
//
// 08:00
// 08:30
// 09:00
// 09:30
// 10:00
// etc.
//
// Sin recargar la página.
// =====================================================

setInterval(
    actualizarCapibara,
    1000
);
