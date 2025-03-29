import { Loader2 } from "lucide-react";

export function Loader({ className }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}
