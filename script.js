const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const resultArea = document.getElementById("resultArea");

// ── Trigger on button click or Enter key ──
searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    shake(cityInput);
    return;
  }
  fetchWeather(city);
}

// ── Shake animation for empty input ──
function shake(el) {
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "shakeX 0.4s ease";
  setTimeout(() => el.style.animation = "", 400);
}

// ── Weather condition mapper ──
function getCondition(code) {
  if (code === 0)             return { label: "Clear Sky",      icon: "☀️" };
  if (code <= 3)              return { label: "Partly Cloudy",  icon: "⛅" };
  if (code <= 48)             return { label: "Foggy",          icon: "🌫️" };
  if (code <= 57)             return { label: "Drizzle",        icon: "🌦️" };
  if (code <= 67)             return { label: "Rainy",          icon: "🌧️" };
  if (code <= 77)             return { label: "Snowy",          icon: "❄️" };
  if (code <= 82)             return { label: "Rain Showers",   icon: "🌨️" };
  if (code <= 99)             return { label: "Thunderstorm",   icon: "⛈️" };
  return                             { label: "Unknown",        icon: "🌡️" };
}

// ── Format time from ISO string ──
function formatTime(iso) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

// ── Wind direction label ──
function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// ── Show loading ──
function showLoading() {
  resultArea.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Fetching weather data…</p>
    </div>`;
}

// ── Show error ──
function showError(msg) {
  resultArea.innerHTML = `
    <div class="error-box">
      <div class="err-icon">⚠️</div>
      <p>${msg}</p>
    </div>`;
}

// ── Main fetch function ──
async function fetchWeather(city) {
  showLoading();

  try {
    // Step 1: Geocode city
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError(`City "<b>${city}</b>" not found. Please try another name.`);
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 2: Fetch weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weatherData = await weatherRes.json();
    const cw = weatherData.current_weather;
    const units = weatherData.current_weather_units || {};

    const condition = getCondition(cw.weathercode);
    const dayNight = cw.is_day ? "Daytime" : "Nighttime";
    const dayNightIcon = cw.is_day ? "🌞" : "🌙";

    resultArea.innerHTML = `
      <div class="weather-card">

        <div class="card-top">
          <div>
            <div class="city-name">${name}, ${country}</div>
            <div class="city-time">${formatTime(cw.time)}</div>
          </div>
          <div class="condition-badge">${condition.icon} ${condition.label}</div>
        </div>

        <div class="temp-display">
          <div class="temp-icon">${condition.icon}</div>
          <div class="temp-value">${Math.round(cw.temperature)}</div>
          <div class="temp-unit">${units.temperature || "°C"}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">💨</span>
            <div class="stat-label">Wind Speed</div>
            <div class="stat-value">${cw.windspeed} ${units.windspeed || "km/h"}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🧭</span>
            <div class="stat-label">Wind Direction</div>
            <div class="stat-value">${windDir(cw.winddirection)} (${cw.winddirection}°)</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📍</span>
            <div class="stat-label">Coordinates</div>
            <div class="stat-value">${latitude.toFixed(2)}, ${longitude.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🌐</span>
            <div class="stat-label">Weather Code</div>
            <div class="stat-value">WMO ${cw.weathercode}</div>
          </div>
        </div>

        <div class="daynight">
          <span class="daynight-dot"></span>
          ${dayNightIcon} ${dayNight}
        </div>

      </div>`;

  } catch (err) {
    console.error(err);
    showError("Something went wrong. Check your connection and try again.");
  }
}

// ── Extra: shake keyframe injected via JS ──
const style = document.createElement("style");
style.textContent = `
  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
