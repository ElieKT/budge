/**
 * One representative country/city per supported currency (src/lib/currencies.ts)
 * — drives the World Clock and Weather sections on the Tools page. Coordinates
 * are approximate city centers, used only for a weather lookup (Open-Meteo).
 */
export type CountryInfo = {
  currency: string;
  country: string;
  city: string;
  timeZone: string;
  lat: number;
  lon: number;
};

export const COUNTRIES: CountryInfo[] = [
  { currency: "USD", country: "United States", city: "New York", timeZone: "America/New_York", lat: 40.7128, lon: -74.006 },
  { currency: "GBP", country: "United Kingdom", city: "London", timeZone: "Europe/London", lat: 51.5074, lon: -0.1278 },
  { currency: "CAD", country: "Canada", city: "Toronto", timeZone: "America/Toronto", lat: 43.6532, lon: -79.3832 },
  { currency: "AUD", country: "Australia", city: "Sydney", timeZone: "Australia/Sydney", lat: -33.8688, lon: 151.2093 },
  { currency: "NZD", country: "New Zealand", city: "Auckland", timeZone: "Pacific/Auckland", lat: -36.8485, lon: 174.7633 },
  { currency: "ZAR", country: "South Africa", city: "Johannesburg", timeZone: "Africa/Johannesburg", lat: -26.2041, lon: 28.0473 },
  { currency: "INR", country: "India", city: "Mumbai", timeZone: "Asia/Kolkata", lat: 19.076, lon: 72.8777 },
  { currency: "NGN", country: "Nigeria", city: "Lagos", timeZone: "Africa/Lagos", lat: 6.5244, lon: 3.3792 },
  { currency: "KES", country: "Kenya", city: "Nairobi", timeZone: "Africa/Nairobi", lat: -1.2921, lon: 36.8219 },
  { currency: "PHP", country: "Philippines", city: "Manila", timeZone: "Asia/Manila", lat: 14.5995, lon: 120.9842 },
  { currency: "JMD", country: "Jamaica", city: "Kingston", timeZone: "America/Jamaica", lat: 17.9712, lon: -76.7936 },
  { currency: "EUR", country: "France", city: "Paris", timeZone: "Europe/Paris", lat: 48.8566, lon: 2.3522 },
  { currency: "CHF", country: "Switzerland", city: "Zurich", timeZone: "Europe/Zurich", lat: 47.3769, lon: 8.5417 },
  { currency: "XOF", country: "Senegal", city: "Dakar", timeZone: "Africa/Dakar", lat: 14.7167, lon: -17.4677 },
  { currency: "XAF", country: "Cameroon", city: "Douala", timeZone: "Africa/Douala", lat: 4.0511, lon: 9.7679 },
  { currency: "MAD", country: "Morocco", city: "Casablanca", timeZone: "Africa/Casablanca", lat: 33.5731, lon: -7.5898 },
  { currency: "TND", country: "Tunisia", city: "Tunis", timeZone: "Africa/Tunis", lat: 36.8065, lon: 10.1815 },
  { currency: "DZD", country: "Algeria", city: "Algiers", timeZone: "Africa/Algiers", lat: 36.7538, lon: 3.0588 },
  { currency: "HTG", country: "Haiti", city: "Port-au-Prince", timeZone: "America/Port-au-Prince", lat: 18.5944, lon: -72.3074 },
  { currency: "MXN", country: "Mexico", city: "Mexico City", timeZone: "America/Mexico_City", lat: 19.4326, lon: -99.1332 },
  { currency: "ARS", country: "Argentina", city: "Buenos Aires", timeZone: "America/Argentina/Buenos_Aires", lat: -34.6037, lon: -58.3816 },
  { currency: "CLP", country: "Chile", city: "Santiago", timeZone: "America/Santiago", lat: -33.4489, lon: -70.6693 },
  { currency: "COP", country: "Colombia", city: "Bogotá", timeZone: "America/Bogota", lat: 4.711, lon: -74.0721 },
  { currency: "PEN", country: "Peru", city: "Lima", timeZone: "America/Lima", lat: -12.0464, lon: -77.0428 },
  { currency: "UYU", country: "Uruguay", city: "Montevideo", timeZone: "America/Montevideo", lat: -34.9011, lon: -56.1645 },
  { currency: "PYG", country: "Paraguay", city: "Asunción", timeZone: "America/Asuncion", lat: -25.2637, lon: -57.5759 },
  { currency: "BOB", country: "Bolivia", city: "La Paz", timeZone: "America/La_Paz", lat: -16.4897, lon: -68.1193 },
  { currency: "GTQ", country: "Guatemala", city: "Guatemala City", timeZone: "America/Guatemala", lat: 14.6349, lon: -90.5069 },
  { currency: "HNL", country: "Honduras", city: "Tegucigalpa", timeZone: "America/Tegucigalpa", lat: 14.0723, lon: -87.1921 },
  { currency: "NIO", country: "Nicaragua", city: "Managua", timeZone: "America/Managua", lat: 12.1364, lon: -86.2514 },
  { currency: "CRC", country: "Costa Rica", city: "San José", timeZone: "America/Costa_Rica", lat: 9.9281, lon: -84.0907 },
  { currency: "PAB", country: "Panama", city: "Panama City", timeZone: "America/Panama", lat: 8.9824, lon: -79.5199 },
  { currency: "DOP", country: "Dominican Republic", city: "Santo Domingo", timeZone: "America/Santo_Domingo", lat: 18.4861, lon: -69.9312 },
  { currency: "JPY", country: "Japan", city: "Tokyo", timeZone: "Asia/Tokyo", lat: 35.6762, lon: 139.6503 },
  { currency: "CNY", country: "China", city: "Beijing", timeZone: "Asia/Shanghai", lat: 39.9042, lon: 116.4074 },
  { currency: "BRL", country: "Brazil", city: "São Paulo", timeZone: "America/Sao_Paulo", lat: -23.5505, lon: -46.6333 },
];
