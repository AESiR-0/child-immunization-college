"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Lock,
  Sparkles,
  TrendingUp,
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2
} from "lucide-react";
import dynamic from "next/dynamic";

const HealthCentersByPincode = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  ),
});

// Age-based vaccine groups with sequential order
const vaccineMilestones = [
  {
    milestone: "birth",
    label: "At Birth",
    ageWeeks: 0,
    color: "purple",
    vaccines: [
      { name: "BCG", when: "At birth or as early as possible till one year of age", order: 1 },
      { name: "Hepatitis B - Birth dose", when: "At birth or as early as possible within 24 hours", order: 2 },
      { name: "OPV-0", when: "At birth or as early as possible within the first 15 days", order: 3 },
    ],
  },
  {
    milestone: "6-14weeks",
    label: "6-14 Weeks",
    ageWeeks: 6,
    color: "orange",
    vaccines: [
      { name: "OPV 1, 2 & 3", when: "At 6 weeks, 10 weeks & 14 weeks (till 5 years of age)", order: 1 },
      { name: "Pentavalent 1, 2 & 3", when: "At 6 weeks, 10 weeks & 14 weeks (till one year of age)", order: 2 },
      { name: "Rotavirus", when: "At 6 weeks, 10 weeks & 14 weeks (till one year of age)", order: 3 },
      { name: "IPV", when: "Two fractional doses at 6 and 14 weeks of age", order: 4 },
    ],
  },
  {
    milestone: "9-12months",
    label: "9-12 Months",
    ageWeeks: 39,
    color: "pink",
    vaccines: [
      { name: "Measles / MR 1st Dose", when: "9–12 months (can be given till 5 years)", order: 1 },
      { name: "JE - 1", when: "9–12 months", order: 2 },
      { name: "Vitamin A (1st dose)", when: "At 9 completed months with measles-Rubella", order: 3 },
    ],
  },
  {
    milestone: "16-24months",
    label: "16-24 Months",
    ageWeeks: 70,
    color: "orange",
    vaccines: [
      { name: "DPT Booster-1", when: "16–24 months", order: 1 },
      { name: "Measles / MR 2nd Dose", when: "16–24 months", order: 2 },
      { name: "OPV Booster", when: "16–24 months", order: 3 },
      { name: "JE-2", when: "16–24 months", order: 4 },
      { name: "Vitamin A (2nd to 9th dose)", when: "16–18 months, then every 6 months till 5 years", order: 5 },
    ],
  },
  {
    milestone: "5-6years",
    label: "5-6 Years",
    ageWeeks: 260,
    color: "purple",
    vaccines: [
      { name: "DPT Booster-2", when: "5–6 years", order: 1 },
    ],
  },
  {
    milestone: "10-16years",
    label: "10-16 Years",
    ageWeeks: 520,
    color: "pink",
    vaccines: [
      { name: "TT", when: "At 10 years & 16 years", order: 1 },
    ],
  },
];

interface VaccineAccordionProps {
  childId?: string;
  dateOfBirth?: string;
}

export default function VaccineAccordion({ childId, dateOfBirth }: VaccineAccordionProps) {
  const [openMilestone, setOpenMilestone] = useState<string | null>(null);
  const [activeMapIndex, setActiveMapIndex] = useState<string | null>(null);
  const [vaccineStatus, setVaccineStatus] = useState<Record<string, "taken" | "pending" | null>>({});
  const [vaccineRecords, setVaccineRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Calculate child's age in weeks
  const calculateAgeWeeks = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    const diffTime = today.getTime() - birthDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const ageWeeks = dateOfBirth ? calculateAgeWeeks(dateOfBirth) : 0;

  // Calculate due date for a vaccine based on milestone
  const getVaccineDueDate = (milestoneAgeWeeks: number): Date | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const dueDate = new Date(birthDate);
    dueDate.setDate(dueDate.getDate() + (milestoneAgeWeeks * 7));
    return dueDate;
  };

  // Calculate date range for a milestone
  const getMilestoneDateRange = (milestone: typeof vaccineMilestones[0]): { start: Date | null; end: Date | null } => {
    if (!dateOfBirth) return { start: null, end: null };
    const birthDate = new Date(dateOfBirth);
    
    // Calculate start date (earliest age in weeks for this milestone)
    const startDate = new Date(birthDate);
    startDate.setDate(startDate.getDate() + (milestone.ageWeeks * 7));
    
    // Calculate end date based on milestone range
    let endDate = new Date(birthDate);
    if (milestone.milestone === "birth") {
      // Birth vaccines can be given up to 1 year
      endDate.setDate(endDate.getDate() + (365 * 1));
    } else if (milestone.milestone === "6-14weeks") {
      // 6-14 weeks range
      endDate.setDate(endDate.getDate() + (14 * 7));
    } else if (milestone.milestone === "9-12months") {
      // 9-12 months range
      endDate.setDate(endDate.getDate() + (12 * 30));
    } else if (milestone.milestone === "16-24months") {
      // 16-24 months range
      endDate.setDate(endDate.getDate() + (24 * 30));
    } else if (milestone.milestone === "5-6years") {
      // 5-6 years range
      endDate.setDate(endDate.getDate() + (6 * 365));
    } else if (milestone.milestone === "10-16years") {
      // 10-16 years range
      endDate.setDate(endDate.getDate() + (16 * 365));
    } else {
      // Default: add 1 month window
      endDate.setDate(endDate.getDate() + (milestone.ageWeeks * 7) + 30);
    }
    
    return { start: startDate, end: endDate };
  };

  // Format date range for display
  const formatDateRange = (start: Date | null, end: Date | null): string => {
    if (!start || !end) return "";
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  // Load vaccine records
  useEffect(() => {
    if (childId) {
      fetch(`/api/vaccines?childId=${childId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) {
            setVaccineRecords(data.records);
            const statusMap: Record<string, "taken" | "pending"> = {};
            data.records.forEach((record: any) => {
              const key = `${record.age_milestone}-${record.vaccine_name}`;
              statusMap[key] = record.status === "taken" ? "taken" : "pending";
            });
            setVaccineStatus(statusMap);
          }
        })
        .catch((err) => console.error("Error loading vaccine records:", err));
    }
  }, [childId]);

  // Check if milestone is unlocked (previous milestone completed or child is old enough)
  const isMilestoneUnlocked = (milestoneIndex: number): boolean => {
    if (milestoneIndex === 0) return true; // Birth vaccines are always unlocked

    const currentMilestone = vaccineMilestones[milestoneIndex];
    const previousMilestone = vaccineMilestones[milestoneIndex - 1];

    // Check if child is old enough
    if (ageWeeks >= currentMilestone.ageWeeks) {
      // Check if previous milestone is mostly completed (at least 75%)
      const prevVaccines = previousMilestone.vaccines;
      const prevCompleted = prevVaccines.filter((v) => {
        const key = `${previousMilestone.milestone}-${v.name}`;
        return vaccineStatus[key] === "taken";
      }).length;
      return prevCompleted >= prevVaccines.length * 0.75;
    }

    return false;
  };

  // Check if vaccine is overdue
  const isVaccineOverdue = (milestoneIndex: number): boolean => {
    if (!dateOfBirth) return false;
    const milestone = vaccineMilestones[milestoneIndex];
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const milestoneDate = new Date(birthDate);
    milestoneDate.setDate(milestoneDate.getDate() + (milestone.ageWeeks * 7));
    return today > milestoneDate;
  };

  // Check if vaccine is locked (unlock overdue vaccines)
  const isVaccineLocked = (milestoneIndex: number, vaccineOrder: number): boolean => {
    if (!isMilestoneUnlocked(milestoneIndex)) return true;

    // If vaccine is overdue, unlock it regardless of previous vaccines
    if (isVaccineOverdue(milestoneIndex)) {
      return false;
    }

    const milestone = vaccineMilestones[milestoneIndex];
    // Check if previous vaccines in same milestone are completed
    for (let i = 0; i < vaccineOrder - 1; i++) {
      const prevVaccine = milestone.vaccines[i];
      const key = `${milestone.milestone}-${prevVaccine.name}`;
      if (vaccineStatus[key] !== "taken") {
        return true;
      }
    }
    return false;
  };

  const handleVaccineStatus = async (milestone: string, vaccineName: string, status: "taken" | "pending") => {
    if (!childId) {
      alert("Child ID is required");
      return;
    }

    const milestoneIndex = vaccineMilestones.findIndex((m) => m.milestone === milestone);
    const vaccine = vaccineMilestones[milestoneIndex]?.vaccines.find((v) => v.name === vaccineName);

    if (!vaccine) return;

    // Check if locked (but allow overdue vaccines)
    if (isVaccineLocked(milestoneIndex, vaccine.order) && !isVaccineOverdue(milestoneIndex)) {
      alert("Please complete previous vaccines in this age group first.");
      return;
    }

    // If marking as taken, show proof upload dialog
    if (status === "taken") {
      const key = `${milestone}-${vaccineName}`;
      setShowProofUpload(key);
      return;
    }

    // For pending status, proceed normally
    setLoading(true);
    const key = `${milestone}-${vaccineName}`;

    try {
      const response = await fetch("/api/vaccines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          vaccineName,
          vaccineCategory: milestone,
          status,
          ageMilestone: milestone,
          sequenceOrder: vaccine.order.toString(),
          takenDate: null,
        }),
      });

      if (response.ok) {
        setVaccineStatus({ ...vaccineStatus, [key]: status });
        setActiveMapIndex(key);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update vaccine status");
      }
    } catch (error) {
      console.error("Error updating vaccine status:", error);
      alert("Failed to update vaccine status");
    } finally {
      setLoading(false);
    }
  };

  const handleProofUpload = async (milestone: string, vaccineName: string) => {
    if (!childId || !proofFile) {
      alert("Please select a proof document");
      return;
    }

    const key = `${milestone}-${vaccineName}`;
    const existingRecord = vaccineRecords.find(
      (r) => r.age_milestone === milestone && r.vaccine_name === vaccineName
    );

    setUploadingProof(true);

    try {
      // First, create or get vaccine record
      let vaccineRecordId = existingRecord?.id;

      if (!vaccineRecordId) {
        const milestoneIndex = vaccineMilestones.findIndex((m) => m.milestone === milestone);
        const vaccine = vaccineMilestones[milestoneIndex]?.vaccines.find((v) => v.name === vaccineName);
        
        const createResponse = await fetch("/api/vaccines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childId,
            vaccineName,
            vaccineCategory: milestone,
            status: "taken",
            ageMilestone: milestone,
            sequenceOrder: vaccine?.order.toString() || "1",
            takenDate: new Date().toISOString().split("T")[0],
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create vaccine record");
        }

        const createData = await createResponse.json();
        vaccineRecordId = createData.record.id;
      }

      // Upload proof document
      const uploadFormData = new FormData();
      uploadFormData.append('file', proofFile);
      uploadFormData.append('childId', childId);
      uploadFormData.append('vaccineRecordId', vaccineRecordId);

      const uploadResponse = await fetch("/api/upload/vaccine-proof", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload proof");
      }

      // Update local state
      setVaccineStatus({ ...vaccineStatus, [key]: "taken" });
      setShowProofUpload(null);
      setProofFile(null);
      
      // Reload vaccine records to get updated proof info
      const recordsResponse = await fetch(`/api/vaccines?childId=${childId}`);
      const recordsData = await recordsResponse.json();
      if (recordsData.records) {
        setVaccineRecords(recordsData.records);
      }

      alert("Proof uploaded successfully! It will be verified by our team.");
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert(error instanceof Error ? error.message : "Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-blue-600",
          light: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
          accent: "text-blue-500",
        };
      case "orange":
        return {
          bg: "bg-teal-600",
          light: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-700",
          button: "bg-teal-600 hover:bg-teal-700",
          accent: "text-teal-500",
        };
      case "pink":
        return {
          bg: "bg-indigo-600",
          light: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-700",
          button: "bg-indigo-600 hover:bg-indigo-700",
          accent: "text-indigo-500",
        };
      default:
        return {
          bg: "bg-blue-600",
          light: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
          accent: "text-blue-500",
        };
    }
  };

  // Calculate overall progress
  const totalVaccines = vaccineMilestones.reduce((sum, m) => sum + m.vaccines.length, 0);
  const completedVaccines = Object.values(vaccineStatus).filter((s) => s === "taken").length;
  const progressPercentage = totalVaccines > 0 ? (completedVaccines / totalVaccines) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Dashboard */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-modern">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Vaccination Progress
            </h2>
            <p className="text-purple-100">
              Track your child's immunization journey
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-sm text-purple-100">Complete</div>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-2">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            {completedVaccines} Completed
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {totalVaccines - completedVaccines} Remaining
          </span>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-300 opacity-30" />

        {vaccineMilestones.map((milestone, index) => {
          const colors = getColorClasses(milestone.color);
          const isUnlocked = isMilestoneUnlocked(index);
          const isOpen = openMilestone === milestone.milestone;
          const milestoneVaccines = milestone.vaccines;
          const completedInMilestone = milestoneVaccines.filter((v) => {
            const key = `${milestone.milestone}-${v.name}`;
            return vaccineStatus[key] === "taken";
          }).length;
          const milestoneProgress = (completedInMilestone / milestoneVaccines.length) * 100;
          
          // Calculate date range for milestone
          const dateRange = dateOfBirth ? getMilestoneDateRange(milestone) : { start: null, end: null };
          const dateRangeStr = formatDateRange(dateRange.start, dateRange.end);

          return (
            <div key={milestone.milestone} className="relative mb-6">
              {/* Milestone Marker */}
              <div className="flex items-start gap-4">
                <div
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                    isUnlocked ? colors.bg : "bg-gray-400"
                  }`}
                >
                  {isUnlocked ? (
                    <span className="text-2xl">{index + 1}</span>
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>

                {/* Milestone Card */}
                <div className="flex-1">
                  <button
                    onClick={() => setOpenMilestone(isOpen ? null : milestone.milestone)}
                    disabled={!isUnlocked}
                    className={`w-full text-left rounded-xl shadow-lg overflow-hidden transition-all ${
                      isUnlocked
                        ? `${colors.bg} text-white hover:shadow-xl cursor-pointer`
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold">{milestone.label}</h3>
                          {dateRangeStr && (
                            <span className="text-xs bg-white/30 px-2 py-1 rounded-full font-medium">
                              {dateRangeStr}
                            </span>
                          )}
                          {!isUnlocked && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="text-sm opacity-90">
                          {milestoneVaccines.length} vaccines • {milestoneProgress.toFixed(0)}% complete
                        </p>
                        {isUnlocked && (
                          <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-white transition-all duration-300`}
                              style={{ width: `${milestoneProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {isUnlocked && (
                        <div className="ml-4">
                          {isOpen ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Vaccines List */}
                  {isOpen && isUnlocked && (
                    <div className={`mt-4 ${colors.light} rounded-xl p-4 space-y-3`}>
                      {milestoneVaccines.map((vaccine, vIdx) => {
                        const vaccineKey = `${milestone.milestone}-${vaccine.name}`;
                        const status = vaccineStatus[vaccineKey];
                        const isLocked = isVaccineLocked(index, vaccine.order);
                        const isMapVisible = activeMapIndex === vaccineKey;
                        const isOverdue = isVaccineOverdue(index);
                        const vaccineRecord = vaccineRecords.find(
                          (r) => r.age_milestone === milestone.milestone && r.vaccine_name === vaccine.name
                        );
                        const hasProof = vaccineRecord?.proof_url;
                        const proofVerified = vaccineRecord?.proof_verified;
                        
                        // Calculate due date for this vaccine
                        const dueDate = dateOfBirth ? getVaccineDueDate(milestone.ageWeeks) : null;
                        const today = new Date();
                        const isDueDatePast = dueDate ? dueDate < today : false;

                        return (
                          <div
                            key={vIdx}
                            className={`bg-white rounded-lg p-4 border-2 transition-all ${
                              isLocked && !isOverdue
                                ? `${colors.border} opacity-60`
                                : status === "taken"
                                ? "border-green-300 shadow-md"
                                : isOverdue
                                ? "border-red-300 shadow-md"
                                : `${colors.border} hover:shadow-md`
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {vaccine.name}
                                  </h4>
                                  {isLocked && !isOverdue && (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                  {isOverdue && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                      <AlertCircle className="w-3 h-3" />
                                      Overdue
                                    </span>
                                  )}
                                  {status === "taken" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {proofVerified ? "Verified" : "Pending Verification"}
                                    </span>
                                  )}
                                  {status === "pending" && !isLocked && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                      <XCircle className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <Calendar className={`w-4 h-4 mt-0.5 ${colors.accent} flex-shrink-0`} />
                                    <p>{vaccine.when}</p>
                                  </div>
                                  {dueDate && (
                                    <div className={`flex items-center gap-2 text-xs ${
                                      isDueDatePast ? "text-red-600 font-semibold" : "text-gray-500"
                                    }`}>
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Due: {dueDate.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric"
                                        })}
                                        {isDueDatePast && " (Overdue)"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {hasProof && (
                                  <div className="mt-2 flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-600">Proof uploaded</span>
                                    {proofVerified && (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {(!isLocked || isOverdue) && (
                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={() => handleVaccineStatus(milestone.milestone, vaccine.name, "taken")}
                                  disabled={loading || uploadingProof}
                                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                    status === "taken"
                                      ? "bg-green-600 text-white shadow-md"
                                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 hover:shadow-sm"
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {status === "taken" ? "Completed" : "Mark as Taken"}
                                </button>

                                <button
                                  onClick={() => handleVaccineStatus(milestone.milestone, vaccine.name, "pending")}
                                  disabled={loading || uploadingProof}
                                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                    status === "pending"
                                      ? `${colors.button} text-white shadow-md`
                                      : `${colors.light} ${colors.text} hover:shadow-sm border ${colors.border}`
                                  }`}
                                >
                                  <MapPin className="w-4 h-4" />
                                  Find Centers
                                </button>
                              </div>
                            )}

                            {/* Proof Upload Modal */}
                            {showProofUpload === vaccineKey && (
                              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-gray-900">Upload Proof Document</h5>
                                  <button
                                    onClick={() => {
                                      setShowProofUpload(null);
                                      setProofFile(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Upload a photo or PDF of the vaccination certificate/proof (Max 5MB)
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <label htmlFor={`proof-${vaccineKey}`} className="flex items-center gap-2 cursor-pointer bg-white border-2 border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors">
                                      <Upload className="w-5 h-5 text-blue-600" />
                                      <span className="text-gray-700">
                                        {proofFile ? proofFile.name : "Choose file (image or PDF)"}
                                      </span>
                                    </label>
                                    <input
                                      id={`proof-${vaccineKey}`}
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                      className="hidden"
                                    />
                                  </div>
                                  {proofFile && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>{proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleProofUpload(milestone.milestone, vaccine.name)}
                                      disabled={!proofFile || uploadingProof}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {uploadingProof ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4" />
                                          Upload Proof
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowProofUpload(null);
                                        setProofFile(null);
                                      }}
                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isLocked && !isOverdue && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Lock className="w-4 h-4" />
                                  Complete previous vaccines in this age group to unlock
                                </p>
                              </div>
                            )}
                            {isOverdue && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-700 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  This vaccine is overdue. You can mark it as taken and upload proof.
                                </p>
                              </div>
                            )}

                            {/* Map */}
                            {isMapVisible && (
                              <div className={`mt-4 border-2 ${colors.border} rounded-lg overflow-hidden shadow-md bg-white`}>
                                <div className={`${colors.light} px-4 py-2 border-b ${colors.border}`}>
                                  <h5 className={`font-semibold ${colors.text} flex items-center gap-2`}>
                                    <MapPin className="w-4 h-4" />
                                    Find Nearby Vaccination Centers
                                  </h5>
                                </div>
                                <HealthCentersByPincode />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Complete previous age milestones to unlock this group
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
