import { useOutletContext } from "react-router-dom";
import { PropertySupport } from "../../components/sections/PropertySupport";
import type { PropertyOutlet } from "./PropertyPage";

export function SupportPage() {
  const { item } = useOutletContext<PropertyOutlet>();
  return <PropertySupport item={item} />;
}
