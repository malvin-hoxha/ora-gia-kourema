import {
  LogOutIcon,
  UserRoundIcon,
  ScissorsIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
const navigationItems = [
  { label: "Αρχική", href: "#home" },
  { label: "Υπηρεσίες", href: "#services" },
  { label: "Σχετικά", href: "#about" },
  { label: "Επικοινωνία", href: "#contact" },
];

export function Header() {

  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  
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

        <div className="flex items-center gap-3">
          {!isLoading && !isAuthenticated && (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline-flex"
              >
                Σύνδεση
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md hover:shadow-orange-200"
              >
                Εγγραφή
              </Link>
            </>
          )}

          {!isLoading && isAuthenticated && user && (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 sm:flex">
                <div className="flex size-7 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <UserRoundIcon className="size-3.5" />
                </div>

                <span className="max-w-32 truncate text-sm font-medium text-slate-700">
                  {user.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="flex size-9 items-center justify-center rounded-full border border-black/[0.06] bg-white text-gray-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
                aria-label="Αποσύνδεση"
              >
                <LogOutIcon className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}