import { ScissorsIcon } from "lucide-react";

const navigationItems = [
  { label: "Αρχική", href: "#home" },
  { label: "Υπηρεσίες", href: "#services" },
  { label: "Σχετικά", href: "#about" },
  { label: "Επικοινωνία", href: "#contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href="#home"
          className="flex items-center gap-2"
        ><ScissorsIcon className="size-4" />
         <span className="text-xl lg:text-2xl font-medium font-serif text-slate-800">OraGiaKourema</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-500">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
        href="#booking"
        className="flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md hover:shadow-orange-200">
        Κλείσε ραντεβού
        </a>
      </div>
    </header>
  );
}