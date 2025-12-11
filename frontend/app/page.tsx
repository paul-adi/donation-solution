"use client";

// export default function Page() {
//   return (
//     <main style={{ padding: 40 }}>
//       {/* PAGE CONTENT */}
//       <h1>Donation Solution</h1>
//       <p>Donate with blockchain.</p>
//     </main>
//   );
// }

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex flex-col items-center justify-start px-6 pt-10 pb-20">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-orange-600 drop-shadow-sm">
          SEED
        </h1>

        <p className="mt-4 text-lg md:text-xl text-gray-700">
          Donate seamlessly with blockchain technology. Transparent, secure, and truly borderless.
        </p>

        <div className="mt-6">
          <button className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all">
            Start Donating
          </button>
        </div>
      </div>

      <div className="mt-14 w-full max-w-4xl">
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/40">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Why Blockchain Donations?
          </h2>
          <ul className="text-gray-700 space-y-2">
            <li>• Lower fees & global reach</li>
            <li>• Transparent transactions</li>
            <li>• Powered by USDC — a stable, trusted digital dollar</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
