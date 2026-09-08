import "server-only";
import { XMLParser } from "fast-xml-parser";

/**
 * Market headlines via MarketWatch's public RSS feed — free, keyless, no
 * account needed. This is headlines/links only, not live quotes or price
 * data: an actual stock-price ticker would need a market-data API (e.g.
 * Finnhub, Alpha Vantage, Polygon.io), all of which require an API key —
 * see the note on the Tools page. Never fabricate a price here.
 */
const FEED_URL = "https://feeds.content.dowjones.io/public/rss/mw_topstories";

export type NewsItem = { title: string; link: string; pubDate: string | null; source: string };

export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 900 } }); // refresh every 15 min
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    const list = Array.isArray(items) ? items : items ? [items] : [];

    return list.slice(0, 12).map((item: Record<string, unknown>) => ({
      title: String(item.title ?? "").trim(),
      link: String(item.link ?? "").trim(),
      pubDate: item.pubDate ? String(item.pubDate) : null,
      source: "MarketWatch",
    }));
  } catch {
    return [];
  }
}
