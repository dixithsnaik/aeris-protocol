import { useOutletContext } from "react-router-dom";
import { PropertyDesk } from "../../components/sections/PropertyDesk";
import { PropertyMessage } from "../../components/sections/PropertyMessage";
import type { PropertyOutlet } from "./PropertyPage";

export function MessagePage() {
  const { item } = useOutletContext<PropertyOutlet>();
  if (item.owned) return <PropertyDesk item={item} />;
  return <PropertyMessage item={item} />;
}
