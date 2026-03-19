export function Contact() {
  return (
    <section id="contact" className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Contact
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Talk to our team and see PlotFlow in action
          </h2>
          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Share a few details and we will reach out to schedule a product demo
            tailored to your real estate workflow.
          </p>

          <div className="mt-8 space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm text-neutral-500">Email</p>
              <p className="mt-1 font-medium text-black">hello@plotflow.com</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Office hours</p>
              <p className="mt-1 font-medium text-black">
                Monday to Friday, 9:00 AM to 6:00 PM
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Support</p>
              <p className="mt-1 font-medium text-black">
                Fast onboarding and priority help for active customers
              </p>
            </div>
          </div>
        </div>

        <form className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Tell us about your layouts, plots, or sales workflow."
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
