import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-3">Forgot password</h1>
      <p className="text-sm text-[var(--amazon-text-muted)] mb-4">
        Password reset flow is not enabled in this assignment build yet.
      </p>
      <p className="text-sm">
        Please contact support, or sign in using OTP from the login page.
      </p>
      <Link href="/login" className="amazon-link inline-block mt-4">Back to Sign in</Link>
    </main>
  );
}
