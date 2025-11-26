import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/src/db/edge";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user's children using Supabase (Edge compatible)
  const { data: userChildren, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', session.user.id);

  // Transform data to match expected format
  const children = (userChildren || []).map((child: any) => ({
    id: child.id,
    name: child.name,
    dateOfBirth: child.date_of_birth,
    birthCertificateUrl: child.birth_certificate_url,
    birthCertificateVerified: child.birth_certificate_verified,
  }));

  // Fetch vaccine records for all children
  const childIds = children.map(c => c.id);
  let allVaccineRecords: any[] = [];
  
  if (childIds.length > 0) {
    const { data: vaccineRecords } = await supabase
      .from('vaccine_records')
      .select('*')
      .in('child_id', childIds)
      .eq('status', 'taken');
    
    allVaccineRecords = vaccineRecords || [];
  }

  return <DashboardClient user={session.user} children={children} vaccineRecords={allVaccineRecords} />;
}

