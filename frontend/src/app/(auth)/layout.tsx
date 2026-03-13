import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-16 px-4">
      {/* Logo */}
      <Link href="/" className="mb-6">
        <Image
          src="/logo_dark.jpg"
          alt="Amazon logo"
          width={130}
          height={40}
          priority
          className="h-auto w-[130px]"
        />
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
