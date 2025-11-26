import Link from "next/link";
import { Shield, Calendar, MapPin, ArrowRight, Sparkles, Heart, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-6 rounded-full shadow-modern-indigo">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-6 text-blue-600">
            Child Immunization Tracker
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
            Keep track of your child's vaccination schedule with our modern, secure platform. 
            Simple, reliable, and designed with care for your family's health.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="group bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-10 py-4 rounded-xl transition-all shadow-modern-indigo hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="glass hover:bg-white/80 text-gray-700 font-semibold px-10 py-4 rounded-xl transition-all shadow-modern hover:shadow-xl hover:scale-105 border border-white/50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features with Glassmorphism */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Feature 1 - Blue */}
          <div className="group relative">
            <div className="relative glass rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-modern border-2 border-blue-200">
              <div className="bg-blue-600 p-4 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Vaccination Schedule
              </h3>
              <p className="text-gray-700 leading-relaxed">
                View complete immunization schedules based on your child's age
                and track upcoming vaccinations with our sequential unlock system.
              </p>
            </div>
          </div>

          {/* Feature 2 - Teal */}
          <div className="group relative">
            <div className="relative glass rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-modern-teal border-2 border-teal-200">
              <div className="bg-teal-600 p-4 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Secure & Verified
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your child's information is securely stored. Birth certificates
                are verified before access to vaccination charts.
              </p>
            </div>
          </div>

          {/* Feature 3 - Indigo */}
          <div className="group relative">
            <div className="relative glass rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-modern-indigo border-2 border-indigo-200">
              <div className="bg-indigo-600 p-4 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Find Hospitals
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Locate nearby health centers and hospitals for vaccination
                appointments with interactive maps.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-24 glass rounded-3xl p-12 shadow-modern">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make child immunization tracking simple, beautiful, and secure
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Age-Based Tracking</h4>
                <p className="text-gray-600 text-sm">
                  Vaccines unlock sequentially based on your child's age and completion status
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Progress Visualization</h4>
                <p className="text-gray-600 text-sm">
                  Beautiful progress bars and timelines show your child's vaccination journey
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Nearby Centers</h4>
                <p className="text-gray-600 text-sm">
                  Find vaccination centers near you with our interactive map feature
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors">
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure & Private</h4>
                <p className="text-gray-600 text-sm">
                  Your data is encrypted and protected with industry-standard security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
