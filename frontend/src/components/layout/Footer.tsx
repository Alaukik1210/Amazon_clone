"use client";

import Link from "next/link";

const columns = [
  {
    title: "Get to Know Us",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press Releases", href: "/press" },
    ],
  },
  {
    title: "Connect with Us",
    links: [
      { label: "Facebook", href: "https://facebook.com" },
      { label: "Twitter", href: "https://twitter.com" },
      { label: "Instagram", href: "https://instagram.com" },
    ],
  },
  {
    title: "Make Money with Us",
    links: [
      { label: "Sell on Amazon", href: "/sell" },
      { label: "Become an Affiliate", href: "/affiliate" },
      { label: "Advertise Your Products", href: "/advertise" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "Your Account", href: "/account" },
      { label: "Your Orders", href: "/orders" },
      { label: "Help", href: "/help" },
    ],
  },
];

export function Footer() {
  return (
    <footer>
      {/* Back to top */}
      <div
        className="bg-[#37475a] hover:bg-[#485769] text-white text-sm text-center py-3 cursor-pointer transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        Back to top
      </div>

      {/* Links */}
      <div className="bg-[#232f3e] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-bold text-sm mb-3">{col.title}</h3>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-300 text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#131921] text-gray-400 text-xs text-center py-4 px-4">
        <p className="font-bold text-white text-lg mb-2">
          amazon<span className="text-[#ff9900]">.</span>in
        </p>
        <p>© 2024, Amazon Clone. All rights reserved.</p>
      </div>
    </footer>
  );
}
