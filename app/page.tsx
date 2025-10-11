import Link from "next/link";
import { Shield, BarChart2, List, Tool } from "react-feather";
import Image from "next/image";

export default function SplashPage() {
  return (
    <div className="bg-white text-slate-800">
      {/* === 1. NEW: Navigation Header === */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-slate-900">
              Zubete
            </Link>
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link href="#features" className="hover:text-blue-600">
                Features
              </Link>
              <Link href="#project-management" className="hover:text-blue-600">
                Project Management
              </Link>
              <Link href="#asset-control" className="hover:text-blue-600">
                Asset Control
              </Link>
            </nav>
            {/* Login Button */}
            <Link
              href="/login"
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* === Hero Section (Existing) === */}
      <main className="relative">
        <div className="absolute inset-0 bg-slate-50 -z-10"></div>
        <div className="container mx-auto px-6 lg:px-8 py-20 lg:py-32">
          {/* ... (rest of your hero section is unchanged) ... */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
                Streamline Your Team's Operations.
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Zubete provides the tools your team needs to operate efficiently
                and safely. Planning, scheduling, recording and tracking all in
                one intuitive platform.
              </p>
              <div className="mt-10">
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
                >
                  Get In Touch Today
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <video
                className="w-full h-80 rounded-lg shadow-xl object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/Zubete-1br.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </main>

      {/* === Features Section (Existing) === */}
      <section id="features" className="py-20 lg:py-24 bg-white">
        {/* ... (rest of your features section is unchanged) ... */}
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              A smarter way to manage your field operations.
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
              Stop juggling spreadsheets and paper forms. Zubete brings all your
              critical operations into one secure, easy-to-use platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 rounded-lg">
              <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-lg mb-4">
                <List size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Dynamic Scheduling</h3>
              <p className="text-slate-600">
                Plan and visualize your team's schedule with our intuitive
                drag-and-drop interface. Assign personnel and equipment with
                ease.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-lg">
              <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-lg mb-4">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">On-Site Safety Logs</h3>
              <p className="text-slate-600">
                Conduct dynamic risk assessments and maintain safety logs
                directly from the field, ensuring compliance and peace of mind.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-lg">
              <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-lg mb-4">
                <Tool size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Equipment Tracking</h3>
              <p className="text-slate-600">
                Manage your entire asset inventory, track calibration dates, and
                view assignment history to reduce downtime and loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === 2. NEW: Project Management Section === */}
      <section id="project-management" className="py-20 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900">
                Total Project Control
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                From initial planning to final sign-off, manage your entire
                project lifecycle. Track progress, manage documents, and keep
                your team aligned.
              </p>
            </div>
            <div className="relative w-full h-64 rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/images/Zubete1.png"
                alt="A screenshot of the scheduler page in Zubete"
                layout="fill"
                objectFit="cover"
                objectPosition="bottom"
              />
            </div>
          </div>
        </div>
      </section>

      {/* === 3. NEW: Asset Control Section === */}
      <section id="asset-control" className="py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full h-64 rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/images/Zubete2.png"
                alt="A screenshot of the next shift section in Zubete"
                layout="fill"
                objectFit="cover"
                objectPosition="top"
              />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900">
                Master Your Information
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Teams are kept fully up to date, with data at their fingetips.
                Remove duplication errors and communication barriers - ensure
                everyone is on the same page, all the time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === Final Call to Action (Existing) === */}
      <section className="bg-slate-800 text-white">
        {/* ... (rest of your CTA section is unchanged) ... */}
        <div className="container mx-auto px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Take Control of Your Operations?
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Get in touch today for a free demo and see how Zubete can transform
            your team's efficiency.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Escape Excel Hell Now!
            </Link>
          </div>
        </div>
      </section>

      {/* === 4. NEW: Enhanced Footer === */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold text-white mb-2">Zubete</h3>
              <p className="text-sm text-slate-400">
                Safety and Efficiency, Simplified.
              </p>
            </div>
            {/* Column 2: Navigation */}
            <div>
              <h4 className="font-semibold text-slate-100 mb-3">Navigate</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#project-management" className="hover:text-white">
                    Project Management
                  </Link>
                </li>
                <li>
                  <Link href="#asset-control" className="hover:text-white">
                    Asset Control
                  </Link>
                </li>
              </ul>
            </div>
            {/* Column 3: Legal (Placeholder) */}
            <div>
              <h4 className="font-semibold text-slate-100 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            {/* Column 4: Contact (Placeholder) */}
            <div>
              <h4 className="font-semibold text-slate-100 mb-3">Contact</h4>
              <p className="text-sm">
                123 Innovation Drive
                <br />
                London, UK, SW1A 0AA
                <br />
                contact@zubete.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-700 text-center text-sm text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Zubete. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
