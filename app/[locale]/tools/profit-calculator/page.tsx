import type { Metadata } from "next";
import ProfitCalculator from "./ProfitCalculator";

export const metadata: Metadata = {
  title: "Beauty Service Profit Calculator | Free Pricing & Cost Tool",
  description:
    "Free profit calculator for hairstylists, nail techs, barbers and beauty professionals. Calculate real profit per appointment, hourly earnings, product costs, and monthly income.",
  keywords: [
    "beauty profit calculator",
    "hair stylist profit calculator",
    "nail tech pricing calculator",
    "service pricing calculator",
    "beauty business profit tool",
    "salon pricing tool",
  ],
  openGraph: {
    title: "Beauty Business Profit Calculator",
    description:
      "See your real profit per appointment and per hour. Built for beauty and wellness professionals.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ProfitCalculator />;
}