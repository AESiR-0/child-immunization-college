"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Baby,
  Calendar,
  MapPin,
  LogOut,
  Plus,
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapIframe = dynamic(() => import("../map/MapIframe"), { ssr: false });

interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  birthCertificateUrl: string | null;
  birthCertificateVerified: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export default function DashboardClient({
  user,
  children: initialChildren,
  vaccineRecords = [],
}: {
  user: User;
  children: Child[];
  vaccineRecords?: any[];
}) {
  const router = useRouter();
  const [children, setChildren] = useState(initialChildren);
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(false);
  const [latestDeadline, setLatestDeadline] = useState<{
    childName: string;
    vaccine: string;
    deadline: Date;
    milestone: string;
    daysRemaining: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    birthCertificate: null as File | null,
  });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let birthCertificateUrl = null;

      if (formData.birthCertificate) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.birthCertificate);
        uploadFormData.append('userId', user.id);

        const uploadResponse = await fetch("/api/upload/birth-certificate", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || "Failed to upload birth certificate");
        }

        const uploadData = await uploadResponse.json();
        birthCertificateUrl = uploadData.url;
      }

      const response = await fetch("/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          birthCertificateUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add child");
      }

      const data = await response.json();
      setChildren([...children, data.child]);
      setFormData({ name: "", dateOfBirth: "", birthCertificate: null });
      setShowAddChild(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding child:", error);
      alert(error instanceof Error ? error.message : "Failed to add child. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate age in months
  const calculateAge = (dob: string): string => {
    const birthDate = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (months < 12) {
      return `${months} months`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  // Get solid colors for child cards
  const getCardColor = (index: number): string => {
    const colors = [
      "bg-blue-600",
      "bg-teal-600",
      "bg-indigo-600",
      "bg-blue-600",
      "bg-green-600",
    ];
    return colors[index % colors.length];
  };

  // Calculate latest deadline across all children
  useEffect(() => {
    const calculateLatestDeadline = () => {
      const vaccineMilestones = [
        { milestone: "birth", label: "At Birth", ageWeeks: 0, vaccines: [
          { name: "BCG", order: 1 }, { name: "Hepatitis B - Birth dose", order: 2 }, { name: "OPV-0", order: 3 }
        ]},
        { milestone: "6-14weeks", label: "6-14 Weeks", ageWeeks: 6, vaccines: [
          { name: "OPV 1, 2 & 3", order: 1 }, { name: "Pentavalent 1, 2 & 3", order: 2 },
          { name: "Rotavirus", order: 3 }, { name: "IPV", order: 4 }
        ]},
        { milestone: "9-12months", label: "9-12 Months", ageWeeks: 39, vaccines: [
          { name: "Measles / MR 1st Dose", order: 1 }, { name: "JE - 1", order: 2 },
          { name: "Vitamin A (1st dose)", order: 3 }
        ]},
        { milestone: "16-24months", label: "16-24 Months", ageWeeks: 70, vaccines: [
          { name: "DPT Booster-1", order: 1 }, { name: "Measles / MR 2nd Dose", order: 2 },
          { name: "OPV Booster", order: 3 }, { name: "JE-2", order: 4 },
          { name: "Vitamin A (2nd to 9th dose)", order: 5 }
        ]},
        { milestone: "5-6years", label: "5-6 Years", ageWeeks: 260, vaccines: [
          { name: "DPT Booster-2", order: 1 }
        ]},
        { milestone: "10-16years", label: "10-16 Years", ageWeeks: 520, vaccines: [
          { name: "TT", order: 1 }
        ]},
      ];

      const today = new Date();
      let earliestDeadline: {
        childName: string;
        vaccine: string;
        deadline: Date;
        milestone: string;
        daysRemaining: number;
      } | null = null;

      // Check each child
      for (const child of children.filter(c => c.birthCertificateVerified)) {
        const birthDate = new Date(child.dateOfBirth);
        const ageInWeeks = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        // Get taken vaccines for this child
        const childVaccines = vaccineRecords.filter(v => v.child_id === child.id);
        const takenMap = new Map();
        childVaccines.forEach((v) => {
          const key = `${v.age_milestone}-${v.vaccine_name}`;
          takenMap.set(key, true);
        });

        // Find next deadline for this child
        for (const milestone of vaccineMilestones) {
          if (ageInWeeks < milestone.ageWeeks) {
            const milestoneDate = new Date(birthDate);
            milestoneDate.setDate(milestoneDate.getDate() + (milestone.ageWeeks * 7));
            
            for (const vaccine of milestone.vaccines) {
              const key = `${milestone.milestone}-${vaccine.name}`;
              if (!takenMap.has(key)) {
                const daysRemaining = Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (!earliestDeadline || daysRemaining < earliestDeadline.daysRemaining) {
                  earliestDeadline = {
                    childName: child.name,
                    vaccine: vaccine.name,
                    deadline: milestoneDate,
                    milestone: milestone.label,
                    daysRemaining,
                  };
                }
                break;
              }
            }
          } else {
            for (const vaccine of milestone.vaccines) {
              const key = `${milestone.milestone}-${vaccine.name}`;
              if (!takenMap.has(key)) {
                const milestoneDate = new Date(birthDate);
                milestoneDate.setDate(milestoneDate.getDate() + (milestone.ageWeeks * 7));
                const daysRemaining = Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (!earliestDeadline || daysRemaining < earliestDeadline.daysRemaining) {
                  earliestDeadline = {
                    childName: child.name,
                    vaccine: vaccine.name,
                    deadline: milestoneDate,
                    milestone: milestone.label,
                    daysRemaining,
                  };
                }
                break;
              }
            }
          }
        }
      }

      setLatestDeadline(earliestDeadline);
    };

    calculateLatestDeadline();
  }, [children, vaccineRecords]);

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="glass border-b border-white/20 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-blue-600">
                Immunization Tracker
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-all hover:shadow-md"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h2 className="text-4xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h2>
          </div>
          <p className="text-lg text-gray-600">
            Manage your children's immunization schedules with ease
          </p>
        </div>

        {/* Latest Deadline and Map Section */}
        {children.length > 0 && children.some(c => c.birthCertificateVerified) && (
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            {/* Latest Deadline Preview */}
            <div className="glass rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Next Vaccination Deadline</h2>
              </div>
              {latestDeadline ? (
                <div className={`rounded-xl p-6 border-2 ${
                  latestDeadline.daysRemaining < 0 
                    ? "bg-red-50 border-red-200" 
                    : latestDeadline.daysRemaining <= 7 
                    ? "bg-orange-50 border-orange-200" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${
                      latestDeadline.daysRemaining < 0 
                        ? "bg-red-600" 
                        : latestDeadline.daysRemaining <= 7 
                        ? "bg-orange-600" 
                        : "bg-blue-600"
                    }`}>
                      {latestDeadline.daysRemaining < 0 ? (
                        <AlertCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Clock className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{latestDeadline.vaccine}</h3>
                        {latestDeadline.daysRemaining < 0 && (
                          <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Overdue
                          </span>
                        )}
                        {latestDeadline.daysRemaining >= 0 && latestDeadline.daysRemaining <= 7 && (
                          <span className="bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Child: {latestDeadline.childName}</p>
                      <p className="text-sm text-gray-600 mb-1">Age Milestone: {latestDeadline.milestone}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          Due: {latestDeadline.deadline.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-4 p-4 rounded-lg ${
                    latestDeadline.daysRemaining < 0 
                      ? "bg-red-100 border border-red-200" 
                      : latestDeadline.daysRemaining <= 7 
                      ? "bg-orange-100 border border-orange-200" 
                      : "bg-blue-100 border border-blue-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-5 h-5 ${
                        latestDeadline.daysRemaining < 0 
                          ? "text-red-600" 
                          : latestDeadline.daysRemaining <= 7 
                          ? "text-orange-600" 
                          : "text-blue-600"
                      }`} />
                      <span className={`font-semibold ${
                        latestDeadline.daysRemaining < 0 
                          ? "text-red-700" 
                          : latestDeadline.daysRemaining <= 7 
                          ? "text-orange-700" 
                          : "text-blue-700"
                      }`}>
                        {latestDeadline.daysRemaining < 0 
                          ? `${Math.abs(latestDeadline.daysRemaining)} days overdue` 
                          : latestDeadline.daysRemaining <= 7 
                          ? `${latestDeadline.daysRemaining} days remaining` 
                          : `${latestDeadline.daysRemaining} days until deadline`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Up to Date!</h3>
                  <p className="text-gray-600">
                    All scheduled vaccinations have been completed for all children.
                  </p>
                </div>
              )}
            </div>

            {/* Google Maps Iframe */}
            <div className="glass rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-600 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Nearest Vaccination Center</h2>
              </div>
              <MapIframe />
            </div>
          </div>
        )}

        {/* Stats Section */}
        {children.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="glass rounded-2xl p-6 border border-white/20 shadow-modern">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Children</p>
                  <p className="text-3xl font-bold text-gray-900">{children.length}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-full">
                  <Baby className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-6 border border-white/20 shadow-modern">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {children.filter((c) => c.birthCertificateVerified).length}
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-6 border border-white/20 shadow-modern">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {children.filter((c) => !c.birthCertificateVerified).length}
                  </p>
                </div>
                <div className="bg-teal-100 p-4 rounded-full">
                  <TrendingUp className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Child Button */}
        {!showAddChild && (
          <button
            onClick={() => setShowAddChild(true)}
            className="mb-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add Child
          </button>
        )}

        {/* Add Child Form */}
        {showAddChild && (
          <div className="mb-8 glass rounded-2xl shadow-modern p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Child</h3>
            <form onSubmit={handleAddChild} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black placeholder:text-gray-400 bg-white/80 hover:bg-white"
                  placeholder="Enter child's name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black bg-white/80 hover:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Birth Certificate
                </label>
                <div className="flex items-center gap-4">
                  <label htmlFor="birthCertificateUpload" className="flex-grow cursor-pointer glass border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/80 transition-all">
                    <span className="text-gray-700 truncate">
                      {formData.birthCertificate ? formData.birthCertificate.name : "Choose file (image or PDF)"}
                    </span>
                    <Upload className="w-5 h-5 text-blue-600" />
                  </label>
                  <input
                    id="birthCertificateUpload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,.pdf"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthCertificate: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Upload birth certificate for verification (Max 5MB, Images or PDF)
                </p>
                {formData.birthCertificate && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{formData.birthCertificate.name} ({(formData.birthCertificate.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Adding..." : "Add Child"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChild(false);
                    setFormData({ name: "", dateOfBirth: "", birthCertificate: null });
                  }}
                  className="glass hover:bg-white/80 text-gray-700 font-semibold px-8 py-3 rounded-xl transition-all border border-white/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Children List */}
        {children.length === 0 ? (
          <div className="glass rounded-2xl shadow-modern p-16 text-center border border-white/20">
            <div className="bg-blue-100 p-6 rounded-full w-fit mx-auto mb-6">
              <Baby className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No children registered yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first child to start tracking their immunization schedule
            </p>
            <button
              onClick={() => setShowAddChild(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {children.map((child, index) => {
              const cardColor = getCardColor(index);
              const age = calculateAge(child.dateOfBirth);

              return (
                <div
                  key={child.id}
                  className="group relative overflow-hidden rounded-2xl shadow-modern hover:shadow-2xl transition-all hover:scale-105"
                >
                  {/* Solid Color Background */}
                  <div className={`absolute inset-0 ${cardColor} opacity-90`} />
                  
                  {/* Content */}
                  <div className="relative p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                          <Baby className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-1">
                            {child.name}
                          </h3>
                          <div className="flex items-center gap-2 text-white/90">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{age} old</span>
                          </div>
                        </div>
                      </div>
                      {child.birthCertificateVerified ? (
                        <div className="bg-green-500/20 backdrop-blur-sm p-2 rounded-full">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="bg-yellow-500/20 backdrop-blur-sm p-2 rounded-full">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-white/80 mb-2">
                        DOB: {new Date(child.dateOfBirth).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        {child.birthCertificateVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {child.birthCertificateVerified ? (
                        <Link
                          href={`/chart?childId=${child.id}`}
                          className="block w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-center font-semibold py-3 rounded-xl transition-all border border-white/30 hover:border-white/50"
                        >
                          View Vaccination Chart
                        </Link>
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm text-white/80 text-center font-medium py-3 rounded-xl border border-white/20">
                          Chart available after verification
                        </div>
                      )}

                      <Link
                        href={`/map?childId=${child.id}`}
                        className="block w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-center font-semibold py-3 rounded-xl transition-all border border-white/30 hover:border-white/50 flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Find Hospitals
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
