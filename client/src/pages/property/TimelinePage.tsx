import { useOutletContext } from "react-router-dom";
import { PropertyTimeline } from "../../components/sections/PropertyTimeline";
import type { PropertyOutlet } from "./PropertyPage";

export function TimelinePage() {
  const { item } = useOutletContext<PropertyOutlet>();
  return <PropertyTimeline item={item} />;
}
