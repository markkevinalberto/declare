import { DeclareMark } from "@/components/brand/declare-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-6">
      <div className="relative w-full max-w-sm">
        {/* Waves from the form card's top-right corner, clear of its fields */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/waving.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-6 z-10 hidden h-36 w-auto drop-shadow-lg sm:block"
        />
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/30">
            <DeclareMark className="size-6 text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Declare</span>
        </div>
        {children}
      </div>
    </div>
  );
}
