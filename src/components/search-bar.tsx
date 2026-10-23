import { SearchIcon } from "@/components/icons";
import { buttonClasses } from "@/components/button";
import { ROUTES, SEARCH_TOWNS } from "@/lib/site-links";

// The ring sits on the whole field, since the input itself has no border.
const field = "flex min-w-0 flex-col justify-center gap-0.5 rounded-[14px] px-3.5 py-2.5 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary md:px-4 md:py-2";
const label = "text-xs font-bold text-foreground";
// 16px on phones so iPhones don't zoom in on focus; 15px from 768px, as in the kit.
const input = "w-full min-w-0 bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted-foreground md:text-[15px]";

/**
 * The 3-part search from the home hero (docs/build-kit 03-PAGES-AND-ROUTES.md
 * §1): What / Where / When and a green Search button. Phones: three stacked
 * rows and a full-width button. From 768px: one white bar; the fields shrink
 * (never the button), so the button always stays inside the bar and clickable.
 * It sends the words, town and first day to Explore.
 */
export function SearchBar() {
  return (
    <form
      action={ROUTES.explore}
      role="search"
      className="flex w-full max-w-[660px] flex-col rounded-[20px] bg-card p-1.5 shadow-[0_16px_40px_rgba(0,0,0,.25)] md:flex-row md:items-stretch md:gap-1 md:p-2 md:shadow-[0_20px_50px_rgba(0,0,0,.25)]"
    >
      <label className={`${field} border-b border-border md:flex-[1.4_1_0] md:border-r md:border-b-0`}>
        <span className={label}>What</span>
        <input name="q" placeholder="Camera, tent, drill…" className={input} />
      </label>
      <label className={`${field} border-b border-border md:flex-[1_1_0] md:border-r md:border-b-0`}>
        <span className={label}>Where</span>
        <input name="town" defaultValue="Windhoek" list="search-towns" autoComplete="off" className={input} />
        <datalist id="search-towns">
          {SEARCH_TOWNS.map((town) => (
            <option key={town} value={town} />
          ))}
        </datalist>
      </label>
      {/* The first day; Explore's filters add an end date (one day if left out). */}
      <label className={`${field} md:flex-[1_1_0]`}>
        <span className={label}>When</span>
        <input type="date" name="from" aria-label="When: first day" className={input} />
      </label>
      <button
        type="submit"
        className={buttonClasses({ size: "lg", className: "mt-1 w-full md:mt-0 md:h-auto md:min-h-14 md:w-auto md:flex-none md:rounded-btn md:px-6" })}
      >
        <SearchIcon />
        Search
      </button>
    </form>
  );
}
