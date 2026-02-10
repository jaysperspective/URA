// src/app/chart/page.tsx
import dynamic from "next/dynamic";

const ChartClient = dynamic(() => import("@/components/gann/ChartClient"));

export default function Page() {
  return <ChartClient />;
}
