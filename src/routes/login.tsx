import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Globe2 } from "lucide-react";
import { Logo } from "@/components/octopus/Logo";
import { useWorkspace, getInitials, isAuthenticated } from "@/lib/workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Octopus SCM" },
      { name: "description", content: "Sign in to your Octopus SCM freight forwarding workspace." },
    ],
  }),
  component: Login,
});

interface FormValues {
  username: string;
  password: string;
  remember: boolean;
}

function Login() {
  const navigate = useNavigate();
  const ws = useWorkspace();
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { username: "", password: "", remember: true },
  });

  // const onSubmit = handleSubmit(async (values) => {
  //   // Simulate auth round-trip. Wire to FastAPI by replacing this block:
  //    const res = await fetch(`${API}/auth/login`, { method: "POST", body: JSON.stringify(values) })
  //   await new Promise((r) => setTimeout(r, 700));
  //   const name = values.username.includes(".")
  //     ? values.username
  //         .split(".")
  //         .map((s) => s[0]!.toUpperCase() + s.slice(1))
  //         .join(" ")
  //     : values.username;
  //   ws.login({
  //     id: values.username,
  //     name,
  //     initials: getInitials(name),
  //     role: "Ops Manager",
  //     email: `${values.username}@octopus.scm`,
  //   });
  //   toast.success(`Welcome back, ${name.split(" ")[0]}`);
  //   navigate({ to: "/dashboard" });
  // });  


//   const onSubmit = handleSubmit(async (values) => {
//   try {
//     const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email: values.username,
//         password: values.password,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Invalid email or password");
//     }

//     const data = await response.json();

//     console.log("1. Response received");

// localStorage.setItem("access_token", data.access_token);

// console.log("2. Token saved");

// const name = values.username.includes(".")
//   ? values.username
//       .split(".")
//       .map((s) => s[0].toUpperCase() + s.slice(1))
//       .join(" ")
//   : values.username;

// ws.login({
//   id: values.username,
//   name,
//   initials: getInitials(name),
//   role: "Admin",
//   email: values.username,
// });

// console.log("3. Workspace updated");

// navigate({
//   to: "/dashboard",
// });

// console.log("4. Navigate called");

// toast.success("Login successful");

// } catch (e) {
//   toast.error(
//     e instanceof Error ? e.message : "Login failed"
//   );
// }
// });

//     localStorage.setItem("access_token", data.access_token); Temporarily commented out for testing purposes. You can uncomment this line to store the access token in localStorage if needed.

//     const name = values.username.includes(".")
//       ? values.username
//           .split(".")
//           .map((s) => s[0]!.toUpperCase() + s.slice(1))
//           .join(" ")
//       : values.username;

//     ws.login({
//       id: values.username,
//       name,
//       initials: getInitials(name),
//       role: "Admin",
//       email: values.username,
//     });

//     toast.success("Login successful");

//     navigate({
//       to: "/dashboard",
//     });
//   } catch (e) {
//     toast.error(
//       e instanceof Error ? e.message : "Login failed",
//     );
//   }
// });
const onSubmit = handleSubmit(async (values) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.username,
          password: values.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Invalid email or password");
    }

    localStorage.setItem(
  "access_token",
  data.access_token,
);

localStorage.setItem(
  "refresh_token",
  data.refresh_token,
);

    const name = values.username.includes(".")
      ? values.username
          .split(".")
          .map(
            (s) => s.charAt(0).toUpperCase() + s.slice(1)
          )
          .join(" ")
      : values.username;

    ws.login({
      id: values.username,
      name,
      initials: getInitials(name),
      role: data.user?.role ?? "Admin",
      email: data.user?.email ?? values.username,
    });

    toast.success("Login successful");

    navigate({
      to: "/dashboard",
    });
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "Login failed"
    );
  }
});
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[oklch(0.22_0.06_255)] text-white lg:block">
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-32 size-[520px] rounded-full bg-brand/40 blur-3xl" />
          <div className="absolute -bottom-40 -right-32 size-[520px] rounded-full bg-brand-orange/25 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex h-full flex-col p-12">
          <Logo size={36} showWordmark className="[&_span]:!text-white [&_span:last-child]:!text-white/60" />

          <div className="my-auto max-w-lg space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/80 backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-orange" />
              Built for global freight forwarders
            </div>
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
              One workspace for every shipment, container and customs filing.
            </h2>
            <p className="text-base leading-relaxed text-white/70">
              Octopus SCM unifies bookings, vessel tracking, customs clearance, and invoicing into a
              single, minimal command center designed for modern logistics teams.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-6">
              {[
                { label: "Active shipments", value: "12,480" },
                { label: "Ports connected", value: "1,200+" },
                { label: "On-time delivery", value: "99.2%" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-white/55">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-between text-[11px] text-white/50">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> SOC 2 · ISO 27001
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="size-3.5" /> 38 countries
              </span>
            </div>
            <span>v1.0.0 · © {new Date().getFullYear()} Octopus SCM</span>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo size={32} showWordmark />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your Octopus SCM workspace
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Username or email</label>
              <input
                {...register("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                })}
                aria-invalid={!!errors.username}
                className="h-11 w-full rounded-lg border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              {errors.username && (
                <p className="text-[11px] font-medium text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => toast.info("A password reset link would be sent to your email.")}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                  })}
                  aria-invalid={!!errors.password}
                  className="h-11 w-full rounded-lg border border-border bg-card px-3.5 pr-10 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                {...register("remember")}
                className="size-3.5 rounded border-border accent-brand"
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-elevated transition hover:opacity-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            Protected by enterprise SSO · Need access?{" "}
            <a className="text-brand hover:underline" href="mailto:admin@octopus.scm">
              Contact your admin
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
