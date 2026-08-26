import { useOutletContext } from "react-router-dom";
import { PropertyVault } from "../../components/sections/PropertyVault";
import type { PropertyOutlet } from "./PropertyPage";

export function ContractsPage() {
  const { item } = useOutletContext<PropertyOutlet>();
  return <PropertyVault item={item} />;
}
