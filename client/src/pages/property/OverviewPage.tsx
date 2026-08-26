import { useOutletContext } from "react-router-dom";
import { PropertyOverview } from "../../components/sections/PropertyOverview";
import type { PropertyOutlet } from "./PropertyPage";

export function OverviewPage() {
  const { item, onItem } = useOutletContext<PropertyOutlet>();
  return <PropertyOverview item={item} onItem={onItem} />;
}
