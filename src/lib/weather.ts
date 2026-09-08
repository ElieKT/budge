import "server-only";
import { COUNTRIES } from "./countries";

/**
 * Current weather for every city in COUNTRIES, via Open-Meteo
 * (https://open-meteo.com) — free, keyless, no account needed for
 * non-commercial use. One batched request (comma-separated coordinates)
 * rather than one request per city.
 */

// WMO weather codes -> a short label + emoji. Not exhaustive, but covers
// the common cases; unmapped codes fall back to a generic label.
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { label: "Thunderstorm w/ hail", icon: "⛈️" },
};

function describeWeatherCode(code: number) {
  return WEATHER_CODES[code] ?? { label: "—", icon: "🌡️" };
}

export type CityWeather = {
  currency: string;
  country: string;
  city: string;
  temperatureC: number | null;
  label: string;
  icon: string;
};

export async function getCurrentWeatherForCities(): Promise<CityWeather[]> {
  const lats = COUNTRIES.map((c) => c.lat).join(",");
  const lons = COUNTRIES.map((c) => c.lon).join(",");

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code`,
      { next: { revalidate: 1800 } }, // weather doesn't need to be fresher than ~30 min
    );
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = await res.json();
    // Multiple coordinates -> Open-Meteo returns an array of per-location results.
    const results: Array<{ current?: { temperature_2m?: number; weather_code?: number } }> = Array.isArray(data)
      ? data
      : [data];

    return COUNTRIES.map((c, i) => {
      const current = results[i]?.current;
      const { label, icon } = describeWeatherCode(current?.weather_code ?? -1);
      return {
        currency: c.currency,
        country: c.country,
        city: c.city,
        temperatureC: current?.temperature_2m ?? null,
        label,
        icon,
      };
    });
  } catch {
    // Weather is a nice-to-have utility, not core budgeting functionality —
    // degrade to "unavailable" rather than breaking the Tools page.
    return COUNTRIES.map((c) => ({
      currency: c.currency,
      country: c.country,
      city: c.city,
      temperatureC: null,
      label: "Unavailable",
      icon: "❔",
    }));
  }
}
