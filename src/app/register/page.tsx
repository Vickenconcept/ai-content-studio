"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api-client";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.register(name, email, password, confirmPassword);
      setToken(response.token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_90%_10%,#3e1734_0,#1b1228_35%,#0b0f14_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/40 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-300">Content Studio</p>
          <h1 className="mt-3 text-3xl font-semibold">Create your workspace</h1>
          <p className="mt-2 text-sm text-white/75">Use your existing KHub backend account system.</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm">
              Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 outline-none focus:border-fuchsia-300"
              />
            </label>

            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 outline-none focus:border-fuchsia-300"
              />
            </label>

            <label className="block text-sm">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 outline-none focus:border-fuchsia-300"
              />
            </label>

            <label className="block text-sm">
              Confirm Password
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 outline-none focus:border-fuchsia-300"
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-fuchsia-400 px-4 py-2 font-semibold text-black transition hover:bg-fuchsia-300 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/75">
            Already have an account?{" "}
            <Link href="/login" className="text-fuchsia-300 underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
