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
  const otpPreview = params.get("otp") ?? "";

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
          setError(err?.response?.data?.error ?? "Invalid or expired OTP");
        },
      }
    );
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
  }

  function usePreview() {
    if (otpPreview) setOtp(otpPreview);
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
            Enter the 6-digit code for <span className="text-primary font-medium">{email || "your email"}</span>
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
          {/* OTP Preview Box */}
          {otpPreview && (
            <div className="px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Your OTP Code</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-primary tracking-[0.4em]">{otpPreview}</span>
                <button
                  type="button"
                  onClick={usePreview}
                  className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors"
                >
                  Use
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Simulation mode — this is your actual OTP. Valid for 15 min.</p>
            </div>
          )}

          {!otpPreview && (
            <div className="px-3 py-2.5 bg-muted/30 border border-border rounded-md">
              <p className="text-xs text-muted-foreground">
                Check the API server logs for your OTP, or go back and register again to get a fresh code shown here.
              </p>
            </div>
          )}

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
                autoFocus
                className="w-full px-3 py-3 bg-secondary border border-input rounded-md text-2xl font-mono text-center text-foreground tracking-[0.6em] placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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
              {verify.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : "Verify & Activate Account"}
            </button>
          </form>

          <div className="pt-3 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Wrong account?{" "}
              <button onClick={() => navigate("/register")} className="text-primary hover:underline">
                Register again
              </button>
              {" · "}
              <button onClick={() => navigate("/login")} className="text-primary hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
