import Link from "next/link";
import { Shield } from "react-feather"; // A simple, relevant icon from our library

export default function SplashPage() {
  return (
    // Main container to center content vertically and horizontally
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-800">
      <div className="max-w-3xl mx-auto text-center p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-blue-600 rounded-full shadow-lg">
            <Shield size={48} className="text-white" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900">
          Welcome to Zubete
        </h1>

        {/* Subheading / Value Proposition */}
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          From on-site risk assessments and dynamic safety logs to comprehensive
          equipment tracking and team management, our platform provides the
          tools your team needs to operate safely and efficiently.
        </p>

        {/* Call to Action Button */}
        <div className="mt-12">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white font-bold text-lg px-10 py-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Sign In or Create Account
          </Link>
        </div>
      </div>

      {/* A simple footer */}
      <footer className="absolute bottom-6 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Zubete. All rights reserved.</p>
      </footer>
    </div>
  );
}
