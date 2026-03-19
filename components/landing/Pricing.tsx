import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹999/month",
    description: "For small layouts",
    features: [
      "Up to 2 active layouts",
      "Plot inventory tracking",
      "Basic customer records",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "₹2999/month",
    description: "For growing developers",
    featured: true,
    features: [
      "Up to 10 active layouts",
      "Booking and payment tracking",
      "Advanced customer pipeline",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: "₹5999/month",
    description: "For large projects",
    features: [
      "Unlimited layouts and plots",
      "Team access controls",
      "Sales performance insights",
      "Dedicated onboarding",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom pricing",
    description: "For large organizations",
    features: [
      "Multi-project operations",
      "Custom workflows",
      "Implementation assistance",
      "Dedicated account manager",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Flexible plans for every stage of growth
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Choose a plan that fits your project scale, team size, and workflow
            complexity.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-6 shadow-sm ${
                plan.featured
                  ? "border-black bg-black text-white shadow-lg"
                  : "border-neutral-200 bg-neutral-50 text-black"
              }`}
            >
              <div className="flex min-h-[11rem] flex-col">
                <p
                  className={`text-sm font-medium ${
                    plan.featured ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {plan.name}
                </p>
                <h3 className="mt-4 text-3xl font-semibold">{plan.price}</h3>
                <p
                  className={`mt-3 text-sm ${
                    plan.featured ? "text-neutral-300" : "text-neutral-600"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 rounded-full p-1 ${
                        plan.featured
                          ? "bg-white/10 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    <span
                      className={
                        plan.featured ? "text-neutral-100" : "text-neutral-700"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="#contact"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition ${
                  plan.featured
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Choose Plan"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
