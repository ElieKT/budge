import { PageHeader } from "@/components/ui/Misc";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { ForexBoard } from "@/components/tools/ForexBoard";
import { WorldTable } from "@/components/tools/WorldTable";
import { getCurrentWeatherForCities } from "@/lib/weather";
import { getMarketNews } from "@/lib/marketNews";

export default async function ToolsPage() {
  const [weather, news] = await Promise.all([getCurrentWeatherForCities(), getMarketNews()]);

  return (
    <div>
      <PageHeader title="Tools" description="Currency, world time, weather, and market headlines" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-1 text-base font-semibold">Currency converter</h2>
          <p className="mb-4 text-sm text-slate-500">
            Convert a specific amount between two currencies — informational only, not used
            elsewhere in the app.
          </p>
          <CurrencyConverter />
        </section>

        <section className="card">
          <h2 className="mb-1 text-base font-semibold">Live exchange rates</h2>
          <p className="mb-4 text-sm text-slate-500">Every major currency against a base of your choice.</p>
          <ForexBoard />
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold">World currencies, time &amp; weather</h2>
          <p className="mb-4 text-sm text-slate-500">One row per currency Budge supports, with its local time and current conditions.</p>
          <WorldTable weather={weather} />
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold">Market headlines</h2>
          <p className="mb-4 text-sm text-slate-500">
            Financial news headlines (MarketWatch). This is news only — Budge doesn&apos;t display
            live stock prices or index levels, since that needs a market-data API (e.g. Finnhub,
            Alpha Vantage) with its own key, which isn&apos;t configured here. No prices are ever
            made up to fill that gap.
          </p>
          {news.length === 0 ? (
            <p className="text-sm text-slate-400">Headlines are temporarily unavailable.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {news.map((item) => (
                <li key={item.link} className="py-2.5">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-sm font-medium text-slate-800 hover:underline dark:text-slate-100"
                  >
                    {item.title}
                  </a>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.source}
                    {item.pubDate ? ` · ${new Date(item.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
