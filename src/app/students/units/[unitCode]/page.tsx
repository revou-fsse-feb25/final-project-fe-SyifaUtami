'use client';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useStudentProgress } from '../../../context/useStudentProgress';
import { StudentProgress, Assignment, Unit } from '../../../../types';
import { useEffect, useState } from 'react';
import AssignmentList from '@/src/app/components/assignmentList';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string; // Now required since all teachers have emails
  unitsTeached: string[];
}

interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  accessLevel: string;
  courseManaged: string[];
}

export default function StudentUnitPage() {
  const { unitCode } = useParams();
  const { user, userType } = useAuth();
  const { studentProgress, assignments, isLoading, error } = useStudentProgress(unitCode as string);
  
  const [unitInfo, setUnitInfo] = useState<Unit | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [coordinator, setCoordinator] = useState<Faculty | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch unit information and teaching team
  useEffect(() => {
    const fetchData = async () => {
      if (!unitCode) return;
      
      try {
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        const unit = data.units.find((u: Unit) => u.code === unitCode);
        setUnitInfo(unit || null);
        
        // Find teacher for this unit
        if (unit && data.teachers) {
          const unitTeacher = data.teachers.find((t: Teacher) => 
            t.unitsTeached.includes(unit.code)
          );
          setTeacher(unitTeacher || null);
        }

        // Find coordinator for this course
        if (unit && data.faculty) {
          const courseCoordinator = data.faculty.find((f: Faculty) => 
            f.courseManaged.includes(unit.courseCode) && f.title === 'Coordinator'
          );
          setCoordinator(courseCoordinator || null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [unitCode]);

  // Calculate progress based on weekly materials
  const calculateProgress = () => {
    if (!studentProgress) return { percentage: 0, completed: 0, total: 4 };
    
    const weeklyMaterials = [
      studentProgress.week1Material,
      studentProgress.week2Material,
      studentProgress.week3Material,
      studentProgress.week4Material
    ];
    
    const completed = weeklyMaterials.filter(status => status === 'done').length;
    const total = weeklyMaterials.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { percentage, completed, total };
  };



  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Unit Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3">{unitInfo?.name || 'Unit Name'}</h1>
        <p className="text-2xl text-gray-600 mb-4">{unitCode}</p>
        
        <hr className="border-gray-300 mb-6" />
        
        <p className="text-base text-gray-700 mb-8 leading-relaxed">
          {unitInfo?.description || 'Unit description will appear here.'}
        </p>

        {/* Teaching Team Box */}
        <div className="lms-card mb-8">
          <h3 className="text-2xl font-semibold mb-4">Teaching Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teacher && (
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Unit Teacher</h4>
                <p className="text-base">{teacher.firstName} {teacher.lastName}</p>
                <p className="text-sm text-gray-600">{teacher.email}</p>
              </div>
            )}
            {coordinator && (
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Course Coordinator</h4>
                <p className="text-base">{coordinator.firstName} {coordinator.lastName}</p>
                <p className="text-sm text-gray-600">{coordinator.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="lms-card mb-8">
        <h3 className="text-2xl font-semibold mb-6">Weekly Progress</h3>
        
        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-medium">Overall Progress</span>
            <span className="text-xl font-bold">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="h-4 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress.percentage}%`,
                backgroundColor: 'var(--primary-red)'
              }}
            ></div>
          </div>
        </div>

        {/* Weekly Checklist */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((week) => {
            const weekKey = `week${week}Material` as keyof StudentProgress;
            const status = studentProgress?.[weekKey] as "done" | "not done" | undefined;
            const isDone = status === 'done';
            
            return (
              <div key={week} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                  isDone 
                    ? 'bg-gray-500 border-gray-500' 
                    : 'border-gray-300'
                }`}>
                  {isDone && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-base ${isDone ? 'text-grau-700 font-medium' : 'text-gray-600'}`}>
                  Week {week}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignments */}
      <AssignmentList 
      assignments={assignments.map(a => ({ assignment: a }))}
      />



    {/*
      <div className="lms-card">
        <h3 className="text-2xl font-semibold mb-6">Assignments</h3>
        
        {assignments.length === 0 ? (
          <p className="text-base text-gray-600 text-center py-12">
            No assignments found for this unit.
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment: Assignment) => {
              const isOpen = assignment.status === 'open';
              
              return (
                <div 
                  key={assignment.id}
                  className="flex justify-between items-center p-5 bg-white rounded border-2 hover:shadow-md transition-shadow"
                >
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{assignment.name}</h4>
                    <p className="text-base text-gray-600">
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded text-base font-medium ${
                    isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div> */}
    </div>
  );
}