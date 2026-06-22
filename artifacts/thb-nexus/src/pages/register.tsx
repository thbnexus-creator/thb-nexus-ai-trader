import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const register = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    register.mutate(
      { data: { name, email, password } },
      {
        onSuccess: (data) => {
          navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        },
        onError: (err: any) => {
          setError(err?.response?.data?.error ?? "Registration failed");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 glow-cyan mb-4">
            <span className="text-primary text-xl font-bold">Nx</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join the THB Nexus trading platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="John Trader"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="trader@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={register.isPending}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all glow-cyan"
            >
              {register.isPending ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }} className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-widest">
          Simulation Platform — Not Financial Advice
        </p>
      </div>
    </div>
  );
}
