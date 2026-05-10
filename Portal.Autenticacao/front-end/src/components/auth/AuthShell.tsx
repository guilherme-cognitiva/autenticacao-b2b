import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthShellProps {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export default function AuthShell({ title, description, footer, children, wide }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--accent))_0%,hsl(var(--background))_42%,hsl(var(--muted))_100%)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Portal B2B</p>
              <p className="text-xs text-muted-foreground">SDI · Autenticação</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div
            className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-lg border bg-card shadow-elevated`}
          >
            <div className="border-b px-6 py-5">
              <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="px-6 py-6">{children}</div>
            {footer && (
              <div className="border-t bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </main>

        <footer className="px-4 py-4 text-center text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} SDI · Portal B2B
        </footer>
      </div>
    </div>
  );
}
