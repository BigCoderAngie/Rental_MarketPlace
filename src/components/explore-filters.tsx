import Link from "next/link";
import { buttonClasses } from "@/components/button";
import { SampleTag } from "@/components/sample-tag";
import { ANYWHERE, PRICE_CHIPS, type ExploreFilters } from "@/lib/explore";
import { formatNadWhole } from "@/lib/money";
import { SEARCH_TOWNS } from "@/lib/site-links";

const label = "flex flex-col gap-1.5 text-[13px] font-semibold";
const control = "h-12 w-full rounded-btn-sm border border-input bg-card px-3.5 text-base font-normal text-foreground md:text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
// A white chip that turns green when its radio is picked.
const chip = `${buttonClasses({ variant: "white", size: "chip" })} cursor-pointer has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-checked:[--edge:var(--primary-edge)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary`;

/**
 * The Filters card from docs/build-kit/reference/desktop/SiteExplore.html:
 * town, from and to, price per day, "Verified owners only", Reset and Show
 * results. A plain GET form, so it works without JavaScript. The desktop
 * sidebar and the phone bottom sheet both use it.
 */
export function ExploreFiltersForm({ filters, today, idPrefix }: { filters: ExploreFilters; today: string; idPrefix: string }) {
  return (
    <form action="/explore" className="flex flex-col gap-[18px]">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.cat && <input type="hidden" name="cat" value={filters.cat} />}
      {filters.sort !== "recommended" && <input type="hidden" name="sort" value={filters.sort} />}

      <label className={label}>
        Town
        <select name="town" defaultValue={filters.town} className={control}>
          {[...SEARCH_TOWNS, ANYWHERE].map((town) => (
            <option key={town}>{town}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        <label className={label}>
          From
          <input type="date" name="from" min={today} defaultValue={filters.from ?? ""} className={control} />
        </label>
        <label className={label}>
          To
          <input type="date" name="to" min={today} defaultValue={filters.to ?? ""} className={control} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Price per day, up to</legend>
        <div className="flex flex-wrap gap-2">
          <label className={chip}>
            <input type="radio" name="max" value="" defaultChecked={!filters.max} className="sr-only" />
            Any
          </label>
          {PRICE_CHIPS.map((price) => (
            <label key={price} className={chip}>
              <input type="radio" name="max" value={price} defaultChecked={filters.max === price} className="sr-only" />
              {formatNadWhole(price)}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ID checks arrive in M5 (MASTER-PLAN decision 11), so the toggle is shown but off. */}
      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-border px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <strong id={`${idPrefix}-verified`} className="flex items-center gap-2">
            Verified owners only <SampleTag>Soon</SampleTag>
          </strong>
          <span className="text-[13px] text-muted-foreground">Phone and ID checked by RentLoop</span>
        </span>
        <span role="switch" aria-checked="false" aria-disabled="true" aria-labelledby={`${idPrefix}-verified`} className="relative h-[30px] w-[50px] flex-none rounded-full bg-input">
          <span className="absolute top-[3px] left-[3px] h-6 w-6 rounded-full bg-card" />
        </span>
      </div>

      <div className="flex gap-2.5">
        <Link href="/explore" className={buttonClasses({ variant: "white", className: "flex-1" })}>
          Reset
        </Link>
        <button type="submit" className={buttonClasses({ className: "flex-[2]" })}>
          Show results
        </button>
      </div>
    </form>
  );
}
