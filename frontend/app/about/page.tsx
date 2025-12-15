// page.tsx sbg about page

export default function About() {
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-lg border border-white/40">
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
            What is <span className="text-orange-500">SEED</span>?
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed mb-5">
            <strong>SEED</strong> stands for{" "}
            <strong>Seamless Ethereum-Enabled Donations</strong> — a modern
            donation platform powered by blockchain technology.
          </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-5">
            Our mission is to enable{" "}
            <span className="font-bold text-green-700">transparent</span>,{" "}
            <span className="font-bold text-violet-600">secure</span>, and{" "}
            <span className="font-bold text-amber-600">borderless</span>{" "}
            giving by leveraging Ethereum and smart contracts.
          </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            With SEED, donors can support causes they care about with confidence,
            knowing that every transaction is verifiable, traceable, and
            tamper-proof.
          </p>

          {/* <div className="flex justify-center">
            <a
              href="/donate"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all"
            >
              Start Donating
            </a>
          </div> */}
        </div>
      </div>
    </section>
  );
}
