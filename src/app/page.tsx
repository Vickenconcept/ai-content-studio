import Link from "next/link";

const features = [
  {
    title: "Document-to-campaign engine",
    text: "Turn static docs into social posts, emails, blog outlines, and launch assets.",
  },
  {
    title: "Built on your KHub core",
    text: "Reuses your stable ingestion, embeddings, auth, and retrieval backend.",
  },
  {
    title: "Productized for JVZoo",
    text: "Focused offer with clear output and immediate buyer value.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080d14] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#12495f_0,#0b1b2c_35%,transparent_70%),radial-gradient(circle_at_80%_0%,#4d1e57_0,#1a1732_35%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Additional Frontend #1</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight lg:text-7xl">
            Content Studio
            <span className="block text-cyan-300">from documents to revenue assets</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Problem solved: marketers and founders sit on valuable PDFs and course files but struggle to convert them into usable campaigns.
            This app turns that material into ready-to-publish content packs.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-black hover:bg-cyan-200">
              Start Free
            </Link>
            <Link href="/login" className="rounded-full border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-3">
        {features.map((item) => (
          <article key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-white/75">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
