import { createFileRoute } from "@tanstack/react-router";
import { CasseCode } from "@/components/casse-code";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CasseCode />;
}
