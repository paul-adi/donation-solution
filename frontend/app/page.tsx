// page.tsx sbg home page
import Link from "next/link";

export default function Page() {
  return (
    <section className="py-16 text-center">
      <div className="max-w-3xl mx-auto">
        <p className="mt-4 text-lg md:text-xl text-gray-700 leading-relaxed">
          Donate seamlessly with blockchain technology.        
        </p>

        <p className="mt-2 text-lg md:text-xl">
          <span className="font-bold text-green-700">Transparent</span>,{" "}
          <span className="font-bold text-violet-600">Secure</span>, and truly{" "}
          <span className="font-bold text-amber-600">Borderless</span>.
        </p>

        <div className="mt-6">
          <Link href="/donate">
            <button className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all">
              Start Donating
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/40">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Why Blockchain Donations?
          </h2>
          <ul className="text-gray-700 space-y-2">
            <li>• Lower fees & global reach</li>
            <li>• Transparent transactions</li>
            <li>• Powered by USDC — a stable digital dollar</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
