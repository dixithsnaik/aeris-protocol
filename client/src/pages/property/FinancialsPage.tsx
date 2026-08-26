import { useOutletContext } from "react-router-dom";
import { PropertyFinancials } from "../../components/sections/PropertyFinancials";
import type { PropertyOutlet } from "./PropertyPage";

export function FinancialsPage() {
  const { item } = useOutletContext<PropertyOutlet>();
  return <PropertyFinancials item={item} />;
}
