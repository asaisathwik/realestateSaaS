export function About() {
  return (
    <section id="about" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            About
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            A simpler way to digitize plots, layouts, and customer workflows
          </h2>
        </div>

        <div className="space-y-6">
          <p className="text-lg leading-8 text-neutral-600">
            PlotFlow helps real estate companies digitize plot and layout
            management by bringing project inventory, customer data, and booking
            operations into one clean system. Instead of switching between
            spreadsheets, calls, and disconnected tools, teams can manage their
            complete sales workflow with clarity and control.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
              <p className="text-sm text-neutral-500">Built for</p>
              <p className="mt-2 text-xl font-semibold text-black">
                Developers & sales teams
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
              <p className="text-sm text-neutral-500">Outcome</p>
              <p className="mt-2 text-xl font-semibold text-black">
                Faster and clearer operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
