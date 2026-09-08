import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
      <p className="mt-4 text-center text-xs text-slate-400">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
      </p>
    </AuthCard>
  );
}
