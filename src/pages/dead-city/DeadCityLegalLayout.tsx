import { ReactNode, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

type Props = { title: string; description: string; currentPage: "privacy" | "terms"; children: ReactNode };

const DeadCityLegalLayout = ({ title, description, currentPage, children }: Props) => {
  const { hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return <div className="min-h-screen bg-[#03070a] text-[#eef7f6] [color-scheme:dark]">
    <SEOHead title={`${title} - Dead City: Apocalypse`} description={description} />
    <header className="border-b border-[#68cdcf]/20 bg-[#071117]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Link className="text-sm text-[#64e4e0] hover:underline" to="/dead-city/">← Back to Dead City</Link>
        <p className="mt-5 font-display text-2xl tracking-wide sm:text-3xl">Dead City: Apocalypse — Legal Notice</p>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Dead City legal pages">
          <Link className={currentPage === "privacy" ? "font-semibold text-[#64e4e0]" : "text-[#91a6a9] hover:text-[#64e4e0]"} to="/dead-city/privacy-policy">Privacy Policy</Link>
          <Link className={currentPage === "terms" ? "font-semibold text-[#64e4e0]" : "text-[#91a6a9] hover:text-[#64e4e0]"} to="/dead-city/terms-and-conditions">Terms and Conditions</Link>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <article className="rounded-xl border border-[#68cdcf]/20 bg-[#091116] p-5 shadow-2xl shadow-black/40 sm:p-9">
        <h1 className="text-3xl tracking-wide sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[#91a6a9]">Last updated: July 21, 2026</p>
        <div className="mt-9 space-y-8 leading-7 text-[#a6b8ba] [&_a]:text-[#64e4e0] [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-[#eef7f6] [&_li]:pl-1 [&_strong]:text-[#eef7f6] [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2">{children}</div>
      </article>
    </main>
  </div>;
};

export default DeadCityLegalLayout;
