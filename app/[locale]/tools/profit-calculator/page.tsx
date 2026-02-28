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
  return (
  <main className="mx-auto max-w-5xl px-4 py-10">
    <ProfitCalculator />
  <section className="mt-16 max-w-3xl text-slate-700">
  <h2 className="text-2xl font-semibold">
    How to calculate real profit for your beauty business
  </h2>

  <p className="mt-4">
    Many service professionals calculate profit incorrectly by only looking at the service price.
    Real profit is what remains after deducting product costs, platform fees, taxes, and monthly
    expenses. To calculate profit per appointment, subtract all variable costs (products used,
    payment processing fees, and taxes) from your service price. Then divide the result by the
    number of hours spent to understand your true hourly earnings.
  </p>

  <h3 className="mt-8 text-xl font-semibold">
    Why product cost per client matters
  </h3>

  <p className="mt-3">
    Products like hair oil, nail polish, lash glue, wax, or skincare treatments are rarely used
    entirely on one client. However, they still reduce your real earnings. If a product costs
    20 and lasts for 40 clients, that means each appointment carries a hidden cost. Ignoring this
    can lead to underpricing your services and shrinking your margins over time.
  </p>

  <h3 className="mt-8 text-xl font-semibold">
    Why hourly rate is more important than service price
  </h3>

  <p className="mt-3">
    Charging 100 for a service sounds profitable, but if it takes three hours, your effective
    hourly rate may be lower than expected. Successful beauty and wellness professionals focus
    on profit per hour, not just price per service. Monitoring your hourly earnings helps you
    adjust pricing, reduce unnecessary costs, and build a sustainable business.
  </p>

  <p className="mt-6">
    Use this calculator regularly to test new pricing strategies, understand how deposits and
    product usage affect margins, and confidently grow your income.
  </p>
</section> 
</main>);
}