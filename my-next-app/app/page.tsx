import Link from "next/link";

const highlights = [
  { issue: "Refund delay", place: "MetroRoute", detail: "Delivery partner · lift 2.7" },
  { issue: "Damaged item", place: "Glass Vase", detail: "Product · lift 5.0" },
  { issue: "Late delivery", place: "Warehouse B", detail: "Warehouse · lift 4.0" },
];

const steps = [
  { name: "Understand", text: "Each complaint is labeled by issue, sentiment, and severity." },
  { name: "Detect", text: "A week is a spike when it is at least 1.5 times the previous four-week average." },
  { name: "Investigate", text: "Complaint share is compared with that factor’s share of orders." },
  { name: "Act", text: "The briefing names where the issue is concentrated, for someone to check." },
];

const audiences = [
  { name: "Operations managers", text: "Open the briefing to see which issue rose and which site is carrying it." },
  { name: "Support leads", text: "Read the complaints behind a spike without searching the inbox by hand." },
  { name: "Partner owners", text: "See whether one delivery partner’s complaints outrun its share of orders." },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-800">Customer Complaint Intelligence</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            See which complaints spiked, and where they sit in the operation.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
            One briefing for the latest week. It ties what customers said to orders, products, warehouses, and delivery partners.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white" href="/briefing">
              View the sample briefing
            </Link>
            <Link className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800" href="/settings">
              Connect a support inbox
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          {highlights.map((item) => (
            <article key={item.issue} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm text-stone-500">{item.issue}</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">Concentrated at {item.place}</p>
              <p className="mt-1 text-sm text-stone-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="problem" className="border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">The complaint is visible. The pattern is not.</h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            Complaints arrive by phone, email, chat, reviews, social, and the helpdesk. Each one is closed on its own. The same
            warehouse, product, or delivery partner can sit inside that pile for weeks.
          </p>
        </div>
      </section>

      <section id="how" className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.name} className="rounded-2xl border border-stone-200 p-5">
                <p className="text-sm text-teal-800">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-stone-950">{step.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sources" className="border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">Where the complaints come from</h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            Email is the live connector. Connect the support inbox and messages in the complaints label become complaint rows.
            Phone, chat, reviews, social, and the helpdesk use the same columns and are loaded from the sample file in this build.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            {["Email · live", "Phone · sample", "Chat · sample", "Reviews · sample", "Social · sample", "Helpdesk · sample"].map((source) => (
              <li key={source} className="rounded-full border border-stone-300 px-3 py-1 text-stone-700">
                {source}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="who" className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">Who it is for</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audiences.map((audience) => (
              <article key={audience.name} className="rounded-2xl border border-stone-200 p-5">
                <h3 className="text-lg font-semibold text-stone-950">{audience.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{audience.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950">Look at the sample week.</h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            This course build runs on synthetic orders, with an optional Gmail inbox for live email.
          </p>
          <Link className="mt-8 inline-block rounded-full bg-teal-800 px-5 py-2.5 text-sm font-medium text-white" href="/briefing">
            Open the sample briefing
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-6 py-8 text-sm text-stone-500">
          <Link href="/briefing">Sample briefing</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/upload">Upload</Link>
        </div>
      </footer>
    </main>
  );
}
