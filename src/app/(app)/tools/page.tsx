import { PageHeader } from "@/components/ui/Misc";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { WorldClock } from "@/components/tools/WorldClock";

export default function ToolsPage() {
  return (
    <div>
      <PageHeader title="Tools" description="Currency conversion and world clock" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-1 text-base font-semibold">Currency converter</h2>
          <p className="mb-4 text-sm text-slate-500">
            Live rates from Frankfurter (European Central Bank reference rates) — informational only,
            not used anywhere else in the app since Budge itself tracks USD only for now.
          </p>
          <CurrencyConverter />
        </section>
        <section className="card">
          <h2 className="mb-1 text-base font-semibold">World clock</h2>
          <p className="mb-4 text-sm text-slate-500">Current time in a few major cities.</p>
          <WorldClock />
        </section>
      </div>
    </div>
  );
}
