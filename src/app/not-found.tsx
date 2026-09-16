import { SystemStateProvider } from "@/components/shared/system-state/SystemStateProvider";
import { NotFoundScreen } from "@/components/shared/system-state/NotFoundScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Resource Not Found | Fastra Suite",
  description: "The requested resource could not be found within the Fastra Suite system.",
};

export default function NotFound() {
  return (
    <SystemStateProvider>
      <NotFoundScreen />
    </SystemStateProvider>
  );
}
