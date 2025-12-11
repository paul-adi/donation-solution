// export default function About() {
//   return (
//     <main style={{ padding: 40 }}>
//       <h1>SEED is Seamless Ethereum-Enabled Donations.</h1>
//       <p>This is a platform for donating with blockchain technology.</p>
//       <p>
//         We aim to make donations transparent and secure using smart contracts.
//       </p>
//     </main>
//   );
// }

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 px-6 py-20 flex justify-center">
      <div className="max-w-3xl bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-lg border border-white/40">
        
        <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-6 text-center drop-shadow-sm">
          About SEED
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          <strong>SEED</strong> stands for <strong>Seamless Ethereum-Enabled Donations</strong>.
          It is a modern donation platform powered by blockchain technology.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          Our mission is to enable transparent, secure, and borderless giving by
          leveraging the power of Ethereum and smart contracts.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed">
          With SEED, donors can support causes they care about with confidence,
          knowing that every transaction is verifiable, traceable, and tamper-proof.
        </p>
      </div>
    </main>
  );
}
