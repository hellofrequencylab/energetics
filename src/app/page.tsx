import { BirthForm } from "@/components/BirthForm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Energetics</p>
        <h1 className="text-3xl font-bold sm:text-4xl">One sky, many systems, one honest synthesis.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The sky is computed once. Each tradition interprets it in isolation. A separate layer finds
          where independent systems <em>converge</em> and where they hold <em>tension</em> — never a
          blended score, always fully attributed.
        </p>
      </div>

      <BirthForm />
    </main>
  );
}
