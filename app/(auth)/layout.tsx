import { Suspense } from "react";
import { Zap, CheckCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NexusLogo } from "@/components/shared/NexusLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex w-[60%] flex-col relative overflow-hidden px-16 py-12"
        style={{
          background: "linear-gradient(135deg, #080810, #0f0f1a)"
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <NexusLogo className="h-10 w-10 text-accent" />
          <span className="font-display text-2xl font-black tracking-tighter text-white">
            Nexus
          </span>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-xl">
          <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-8 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
            Ship your SaaS<br />
            faster than ever.
          </h1>

          <div className="space-y-4 mb-16">
            {[
              "Multi-tenant architecture",
              "Role-based access control",
              "Stripe billing built-in",
              "Deploy-ready in minutes"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-text-muted text-[15px]">
                <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Testimonial */}
        <div className="relative z-10">
          <div className="glass p-6 rounded-2xl max-w-lg border border-border bg-bg-surface/10">
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="italic text-text-muted text-lg mb-6 leading-relaxed">
              &quot;Nexus completely transformed how we ship products. We saved months of development time and focused entirely on our core business logic from day one.&quot;
            </p>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src="https://i.pravatar.cc/150?u=sarah" />
                <AvatarFallback>SW</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium">Sarah Williams</p>
                <p className="text-sm text-text-muted">CTO at TechNova</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#080810] relative z-10 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2.5 mb-12">
          <NexusLogo className="h-8 w-8 text-accent" />
          <span className="font-display text-xl font-bold text-white">
            Nexus
          </span>
        </div>

        <main className="w-full max-w-[400px] flex flex-col gap-6">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
