import {
  CreditCard,
  LayoutGrid,
  MapPinned,
  Users,
  type LucideIcon,
} from "lucide-react";

type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const services: Service[] = [
  {
    title: "Layout Management",
    description:
      "Organize project layouts with structured phases, availability, and status tracking.",
    icon: LayoutGrid,
  },
  {
    title: "Plot Management",
    description:
      "View, assign, and update every plot with accurate details and real-time visibility.",
    icon: MapPinned,
  },
  {
    title: "Customer Management",
    description:
      "Keep customer profiles, communication notes, and transaction history in one workspace.",
    icon: Users,
  },
  {
    title: "Booking & Payment Tracking",
    description:
      "Track bookings, installment plans, and payment follow-ups without manual spreadsheets.",
    icon: CreditCard,
  },
];

export function Services() {
  return (
    <section id="services" className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Services
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Core tools for plot-focused real estate operations
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            PlotFlow simplifies the day-to-day work of sales, operations, and
            management teams with a single connected platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="inline-flex rounded-2xl bg-black p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-black">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
