import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/src/db/edge";
import VaccineAccordion from "@/components/VaccineAccordion";
import { Shield, ArrowLeft, Calendar, Baby, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function ChartPage({
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

  // Fetch child data using Supabase (Edge compatible)
  const { data: childData, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.childId)
    .limit(1)
    .single();

  if (error || !childData) {
    redirect("/dashboard");
  }

  // Transform to match expected format
  const child = {
    id: childData.id,
    name: childData.name,
    dateOfBirth: childData.date_of_birth,
    birthCertificateUrl: childData.birth_certificate_url,
    birthCertificateVerified: childData.birth_certificate_verified,
    userId: childData.user_id,
  };

  // Check if child belongs to the logged-in user
  if (child.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Check if birth certificate is verified - STRICT ENFORCEMENT
  if (!child.birthCertificateVerified) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
        <div className="glass rounded-3xl shadow-2xl p-10 max-w-lg text-center border border-white/20">
          <div className="bg-orange-500 p-5 rounded-full w-fit mx-auto mb-6 shadow-lg">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verification Required
          </h2>
          <p className="text-gray-600 mb-2 text-lg">
            Your child's birth certificate is currently being verified by our team.
          </p>
          <p className="text-gray-500 mb-8">
            Once verified, you'll have full access to the complete vaccination schedule
            and tracking features.
          </p>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-purple-800 font-semibold">
              <strong>Child:</strong> {child.name}
            </p>
            <p className="text-sm text-purple-800 mt-1 font-semibold">
              <strong>Status:</strong> Pending Verification
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate age for display
  const dob = new Date(child.dateOfBirth);
  const today = new Date();
  const ageInMonths = Math.floor(
    (today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  const ageDisplay =
    ageInMonths < 12
      ? `${ageInMonths} months`
      : `${Math.floor(ageInMonths / 12)} years ${ageInMonths % 12} months`;

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="glass border-b border-white/20 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-full shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Child Info Card */}
        <div className="bg-purple-600 rounded-3xl shadow-2xl p-10 mb-10 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full shadow-lg">
                <Baby className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6" />
                  <h1 className="text-4xl font-bold">
                    Vaccination Schedule
                  </h1>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-white/90">
                  for {child.name}
                </h2>
                <div className="flex items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Calendar className="w-5 h-5" />
                    <span>DOB: {dob.toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="font-semibold">Age: {ageDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-white/20 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-white/30">
              <p className="text-sm text-white/80 mb-1">Status</p>
              <p className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Verified
              </p>
            </div>
          </div>
        </div>

        {/* Vaccine Accordion with child data */}
        <VaccineAccordion childId={child.id} dateOfBirth={child.dateOfBirth} />
      </div>
    </div>
  );
}
