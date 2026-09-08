/**
 * Supported display currencies — covering the currencies actually used in
 * English-, French-, and Spanish-speaking countries (matching the locales
 * in src/lib/i18n.ts), plus a few other major currencies.
 *
 * Important: choosing a currency here only changes how amounts are
 * *formatted* (symbol, decimal/grouping style) via src/lib/money.ts — it
 * does not convert existing stored amounts between currencies. This app
 * stores every amount as an integer count of one currency's minor units;
 * switching currency changes the label on numbers you enter from then on,
 * it doesn't retroactively convert past ones. A real multi-currency ledger
 * (converting and totaling mixed currencies) is future work — see README
 * "Future-ready architecture".
 */
export const CURRENCIES: Array<{ code: string; name: string }> = [
  // English-speaking
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "INR", name: "Indian Rupee" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "JMD", name: "Jamaican Dollar" },
  // French-speaking
  { code: "EUR", name: "Euro" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "HTG", name: "Haitian Gourde" },
  // Spanish-speaking
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "PYG", name: "Paraguayan Guaraní" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "DOP", name: "Dominican Peso" },
  // Other major currencies
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "BRL", name: "Brazilian Real" },
];

export function isSupportedCurrency(code: string): boolean {
  return CURRENCIES.some((c) => c.code === code);
}
