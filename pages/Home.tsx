
import React from 'react';

interface HomeProps {
  onNavigate: (page: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Attendo <br/><span className="text-indigo-300 underline decoration-indigo-400">Attendance Redefined.</span>
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Experience the future of classroom management with AI-powered insights, 
            secure QR scanning, and real-time student tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Sign Up for Free
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="px-8 py-4 bg-indigo-600 text-white border-2 border-indigo-500 rounded-xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg"
            >
              Login to Account
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto -mt-20 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "AI-Powered", desc: "Gemini AI detects anomalies and predicts attendance risks automatically.", icon: "✨" },
          { title: "QR Secure", desc: "Dynamic, time-limited QR codes prevent unauthorized attendance marking.", icon: "🛡️" },
          { title: "Real-time", desc: "Teachers and Admins see attendance update live as students scan.", icon: "⚡" }
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <span className="text-4xl mb-4">{f.icon}</span>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{f.title}</h3>
            <p className="text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Stats / Proof */}
      <section className="py-24 max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { label: "Institutes", val: "500+" },
          { label: "Active Students", val: "100k+" },
          { label: "Classes Logged", val: "1M+" },
          { label: "AI Accuracy", val: "99.9%" }
        ].map((s, i) => (
          <div key={i}>
            <p className="text-3xl font-black text-indigo-600">{s.val}</p>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-12 text-center text-gray-400 text-sm">
        <p>© 2024 Attendo - Smart Attendance System. All rights reserved.</p>
        <p className="mt-2 font-medium text-gray-500 underline">support@attendo.edu</p>
      </footer>
    </div>
  );
};

export default Home;
