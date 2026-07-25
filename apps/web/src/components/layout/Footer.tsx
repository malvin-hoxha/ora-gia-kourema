import { ScissorsIcon } from "lucide-react";

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative isolate overflow-hidden border-t border-black/[0.06] bg-white py-10"
    >
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 rounded-2xl border border-black/[0.06] bg-white/80 px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:px-8 md:flex-row md:items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <ScissorsIcon className="size-4" />
            </div>

            <div>
              <p className="font-serif text-xl tracking-tight text-slate-900 sm:text-2xl">
                OraGiaKourema
                <span className="text-orange-500">.</span>
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Modern barber booking experience.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-slate-600">
              OraGiaKourema
            </span>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}