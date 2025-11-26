"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

// Age-based vaccine milestones
const vaccineMilestones = [
  {
    milestone: "birth",
    label: "At Birth",
    ageWeeks: 0,
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
    vaccines: [
      { name: "DPT Booster-2", when: "5–6 years", order: 1 },
    ],
  },
  {
    milestone: "10-16years",
    label: "10-16 Years",
    ageWeeks: 520,
    vaccines: [
      { name: "TT", when: "At 10 years & 16 years", order: 1 },
    ],
  },
];

interface MapPageClientProps {
  childId: string;
  dateOfBirth: string;
  takenVaccines: any[];
}

export default function MapPageClient({ childId, dateOfBirth, takenVaccines }: MapPageClientProps) {
  const [nextDeadline, setNextDeadline] = useState<{
    vaccine: string;
    deadline: Date;
    milestone: string;
    daysRemaining: number;
  } | null>(null);

  useEffect(() => {
    calculateNextDeadline();
  }, [dateOfBirth, takenVaccines]);

  const calculateNextDeadline = () => {
    if (!dateOfBirth) return;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInWeeks = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

    // Create a map of taken vaccines
    const takenMap = new Map();
    takenVaccines.forEach((v) => {
      const key = `${v.age_milestone}-${v.vaccine_name}`;
      takenMap.set(key, true);
    });

    // Find the next vaccine that needs to be taken
    for (const milestone of vaccineMilestones) {
      // Check if milestone is relevant based on age
      if (ageInWeeks < milestone.ageWeeks) {
        // Future milestone - calculate deadline
        const milestoneDate = new Date(birthDate);
        milestoneDate.setDate(milestoneDate.getDate() + (milestone.ageWeeks * 7));
        
        // Find first untaken vaccine in this milestone
        for (const vaccine of milestone.vaccines) {
          const key = `${milestone.milestone}-${vaccine.name}`;
          if (!takenMap.has(key)) {
            setNextDeadline({
              vaccine: vaccine.name,
              deadline: milestoneDate,
              milestone: milestone.label,
              daysRemaining: Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            });
            return;
          }
        }
      } else {
        // Current or past milestone - check for untaken vaccines
        for (const vaccine of milestone.vaccines) {
          const key = `${milestone.milestone}-${vaccine.name}`;
          if (!takenMap.has(key)) {
            // This vaccine is overdue or due soon
            const milestoneDate = new Date(birthDate);
            milestoneDate.setDate(milestoneDate.getDate() + (milestone.ageWeeks * 7));
            
            setNextDeadline({
              vaccine: vaccine.name,
              deadline: milestoneDate,
              milestone: milestone.label,
              daysRemaining: Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            });
            return;
          }
        }
      }
    }

    // If all vaccines are taken, show completion message
    setNextDeadline(null);
  };

  if (!nextDeadline) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">All Up to Date!</h3>
        <p className="text-gray-600">
          All scheduled vaccinations have been completed. Great job keeping your child protected!
        </p>
      </div>
    );
  }

  const isOverdue = nextDeadline.daysRemaining < 0;
  const isUrgent = nextDeadline.daysRemaining >= 0 && nextDeadline.daysRemaining <= 7;

  return (
    <div className={`rounded-xl p-6 border-2 ${
      isOverdue 
        ? "bg-red-50 border-red-200" 
        : isUrgent 
        ? "bg-orange-50 border-orange-200" 
        : "bg-blue-50 border-blue-200"
    }`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${
          isOverdue 
            ? "bg-red-600" 
            : isUrgent 
            ? "bg-orange-600" 
            : "bg-blue-600"
        }`}>
          {isOverdue ? (
            <AlertCircle className="w-6 h-6 text-white" />
          ) : (
            <Clock className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{nextDeadline.vaccine}</h3>
            {isOverdue && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Overdue
              </span>
            )}
            {isUrgent && !isOverdue && (
              <span className="bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Age Milestone: {nextDeadline.milestone}</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              Due: {nextDeadline.deadline.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>
        </div>
      </div>

      <div className={`mt-4 p-4 rounded-lg ${
        isOverdue 
          ? "bg-red-100 border border-red-200" 
          : isUrgent 
          ? "bg-orange-100 border border-orange-200" 
          : "bg-blue-100 border border-blue-200"
      }`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${
            isOverdue 
              ? "text-red-600" 
              : isUrgent 
              ? "text-orange-600" 
              : "text-blue-600"
          }`} />
          <span className={`font-semibold ${
            isOverdue 
              ? "text-red-700" 
              : isUrgent 
              ? "text-orange-700" 
              : "text-blue-700"
          }`}>
            {isOverdue 
              ? `${Math.abs(nextDeadline.daysRemaining)} days overdue` 
              : isUrgent 
              ? `${nextDeadline.daysRemaining} days remaining` 
              : `${nextDeadline.daysRemaining} days until deadline`}
          </span>
        </div>
      </div>
    </div>
  );
}

