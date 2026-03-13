import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-16 px-4">
      {/* Logo */}
      <Link href="/" className="mb-6">
        <span className="text-[#0f1111] font-extrabold text-3xl tracking-tight">
          amazon<span className="text-[#ff9900]">.</span>in
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm border border-gray-300 rounded p-6 shadow-sm">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500 flex gap-4">
        <Link href="/conditions" className="hover:text-[#c45500] hover:underline">Conditions of Use</Link>
        <Link href="/privacy" className="hover:text-[#c45500] hover:underline">Privacy Notice</Link>
        <Link href="/help" className="hover:text-[#c45500] hover:underline">Help</Link>
      </div>
      <p className="text-xs text-gray-400 mt-2">© 2024, Amazon Clone</p>
    </div>
  );
}
