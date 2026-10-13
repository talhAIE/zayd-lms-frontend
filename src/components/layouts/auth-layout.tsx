import { ReactNode } from "react";
import { Link } from "react-router-dom";
import backdrop from "@/assets/images/backdrop.png";
import logo from "@/assets/zayd-logo.png";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="flex flex-col md:min-h-screen h-[300px] bg-gray-100 bg-no-repeat bg-cover bg-bottom"
      style={{ backgroundImage: `url(${backdrop})` }}
    >
      {" "}
      <header className="sticky top-0 z-50 w-full">
        <div className="container w-full flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="font-semibold text-xl text-[var(--font-dark)]"
              >
                <img src={logo} alt="ZAYD Logo" className="h-12 w-auto object-contain" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
