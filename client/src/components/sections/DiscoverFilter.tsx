import { useState, type FormEvent } from "react";
import verifiedIcon from "../../assets/discover/verified.svg";
import { LocationSuggest } from "../patterns/LocationSuggest";
import { MultiSelect } from "../patterns/MultiSelect";
import { Toggle } from "../patterns/Toggle";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { ui } from "../../config/ui";
import type { PropertyFilters } from "../../lib/api";

type Props = {
  draft: PropertyFilters;
  onDraft: (next: PropertyFilters) => void;
  onApply: (next: PropertyFilters) => void;
  onVerified: (verified: boolean) => void;
  onAnalytics: () => void;
  analyticsDisabled?: boolean;
};

export function DiscoverFilter({
  draft,
  onDraft,
  onApply,
  onVerified,
  onAnalytics,
  analyticsDisabled = false,
}: Props) {
  const copy = ui.discover;
  const [corrected, setCorrected] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = corrected || draft.q;
    const next = { ...draft, q };
    onDraft(next);
    onApply(next);
  };
  return (
    <div className="space-y-4">
      <form className="bg-panel p-4 sm:p-5" onSubmit={submit}>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <LocationSuggest
            id="discover-q"
            label={copy.locationLabel}
            value={draft.q}
            placeholder={copy.locationPlaceholder}
            onChange={(q) => onDraft({ ...draft, q })}
            corrected={corrected}
            onCorrected={setCorrected}
          />
          <div>
            <Label htmlFor="discover-budget">{copy.budgetLabel}</Label>
            <div className="flex items-baseline gap-2 border-b border-line focus-within:border-fg">
              <span className="font-mono text-sm text-muted">₹</span>
              <Input
                id="discover-budget"
                inputMode="numeric"
                value={draft.maxBudget}
                placeholder={copy.budgetPlaceholder}
                onChange={(e) => onDraft({ ...draft, maxBudget: e.target.value })}
              />
            </div>
          </div>
          <MultiSelect
            id="discover-config"
            label={copy.configLabel}
            options={copy.configs}
            value={draft.configs}
            emptyLabel={copy.configAll}
            onChange={(configs) => onDraft({ ...draft, configs })}
          />
          <Button type="submit" className="px-8">
            {copy.filter}
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          id="discover-verified"
          label={copy.verifiedOnly}
          checked={draft.verified}
          onChange={(e) => onVerified(e.target.checked)}
          icon={<Icon src={verifiedIcon} size={15} />}
        />
        <Button variant="outline" className="px-4 py-2" disabled={analyticsDisabled} onClick={onAnalytics}>
          {copy.analytics}
        </Button>
      </div>
    </div>
  );
}
