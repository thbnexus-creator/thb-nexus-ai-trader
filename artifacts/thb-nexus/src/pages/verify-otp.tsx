import { useState } from "react";
import { useLocation } from "wouter";
import { useVerifyOtp } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const verify = useVerifyOtp();

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    verify.mutate(
      { data: { email, otp } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          navigate("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.response?.data?.error ?? "Invalid OTP");
        },
      }
    );
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 glow-cyan mb-4">
            <span className="text-primary text-2xl">◎</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Verify Your Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit OTP for <span className="text-primary">{email}</span>
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="mb-4 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-md">
            <p className="text-xs text-primary">
              OTP has been logged to the server console (email simulation). Check the API server logs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                required
                maxLength={6}
                className="w-full px-3 py-3 bg-secondary border border-input rounded-md text-lg font-mono text-center text-foreground tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={verify.isPending || otp.length < 6}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all glow-cyan"
            >
              {verify.isPending ? "Verifying..." : "Verify & Activate"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Wrong account?{" "}
              <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }} className="text-primary hover:underline">
                Register again
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
