import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/src/db/edge";
import { ArrowLeft, Calendar, Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import MapPageClient from "./MapPageClient";
import dynamic from "next/dynamic";

const MapIframe = dynamic(() => import("./MapIframe"), { ssr: false });

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  
  if (!params.childId) {
    redirect("/dashboard");
  }

  // Fetch child data
  const { data: childData, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.childId)
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (error || !childData) {
    redirect("/dashboard");
  }

  const child = {
    id: childData.id,
    name: childData.name,
    dateOfBirth: childData.date_of_birth,
    birthCertificateUrl: childData.birth_certificate_url,
    birthCertificateVerified: childData.birth_certificate_verified,
  };

  // Fetch vaccine records to determine next deadline
  const { data: vaccineRecords } = await supabase
    .from('vaccine_records')
    .select('*')
    .eq('child_id', child.id)
    .eq('status', 'taken');

  const takenVaccines = vaccineRecords || [];

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="glass border-b border-white/20 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="bg-orange-600 rounded-3xl shadow-2xl p-10 mb-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full shadow-lg">
                <MapPin className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Vaccination Center for {child.name}
                </h1>
                <p className="text-xl text-white/90">
                  Find the nearest vaccination center and track upcoming deadlines
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Latest Deadline Preview */}
          <div className="space-y-6">
            <div className="glass rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Next Vaccination Deadline</h2>
              </div>
              <MapPageClient 
                childId={child.id} 
                dateOfBirth={child.dateOfBirth}
                takenVaccines={takenVaccines}
              />
            </div>
          </div>

          {/* Google Maps Iframe */}
          <div className="space-y-6">
            <div className="glass rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-pink-600 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Nearest Vaccination Center</h2>
              </div>
              <MapIframe />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
