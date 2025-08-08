/* Filters
Specific assignment (ALL detail is in assignments/id)
Specific subject/unit
Only open assignments

includeSubmissions=true
Finds all the student's submitted work
Matches submissions to the filtered assignments
Can filter by submission status

*/

import { NextResponse, NextRequest } from 'next/server';
import assignmentsData from '@/data/assignments.json';
import studentAssignmentsData from '@/data/studentAssignments.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');
    const unitCode = searchParams.get('unitCode');
    const studentId = searchParams.get('studentId');
    const submissionId = searchParams.get('submissionId');
    const assignmentStatus = searchParams.get('status'); // open/closed (assignment status)
    const submissionStatus = searchParams.get('submissionStatus'); // empty/draft/submitted
    const includeSubmissions = searchParams.get('includeSubmissions') === 'true';
    
    // Debug logging
    console.error('=== API DEBUG ===');
    console.error('studentId param:', studentId);
    console.error('typeof studentId:', typeof studentId);
    console.error('assignmentStatus:', assignmentStatus);
    console.error('includeSubmissions:', includeSubmissions);
    console.error('Raw submissions count:', studentAssignmentsData.length);
    console.error('Sample submission:', studentAssignmentsData[0]);
    console.error('Sample submission studentId:', studentAssignmentsData[0]?.studentId);
    console.error('typeof sample studentId:', typeof studentAssignmentsData[0]?.studentId);
    
    let filteredAssignments = assignmentsData;
    
    // NEW: If studentId is provided and includeSubmissions is true, filter by student's enrolled units
    if (studentId && includeSubmissions) {
      console.error('Filtering assignments by student enrolled units...');
      
      // Find student's enrolled units from their submissions
      const studentSubmissions = studentAssignmentsData.filter(sa => sa.studentId === studentId);
      const studentEnrolledUnits = [...new Set(
        studentSubmissions.map(sub => {
          // Find the assignment for this submission to get its unit
          const assignment = assignmentsData.find(a => a.id === sub.assignmentId);
          return assignment?.unitCode;
        }).filter(Boolean)
      )];
      
      console.error('Student submissions found:', studentSubmissions.length);
      console.error('Student enrolled units:', studentEnrolledUnits);
      
      // Filter assignments to only include units the student is enrolled in
      filteredAssignments = assignmentsData.filter(a => studentEnrolledUnits.includes(a.unitCode));
      console.error('Assignments after unit filtering:', filteredAssignments.length);
    }
    
    // Filter by specific assignment
    if (assignmentId) {
      filteredAssignments = filteredAssignments.filter(a => a.id === assignmentId);
    }
    
    // Filter by unit
    if (unitCode) {
      const unitCodes = unitCode.split(',');
      filteredAssignments = filteredAssignments.filter(a => unitCodes.includes(a.unitCode));
    }
    
    // Filter by assignment status (open/closed)
    if (assignmentStatus) {
      filteredAssignments = filteredAssignments.filter(a => a.status === assignmentStatus);
    }
    
    console.error('Filtered assignments count:', filteredAssignments.length);
    console.error('Filtered assignment IDs:', filteredAssignments.map(a => a.id));
    
    // Just return assignment definitions if no submissions needed
    if (!includeSubmissions) {
      return NextResponse.json(filteredAssignments);
    }
    
    // Include submission data
    let submissions = studentAssignmentsData;
    console.error('Starting submissions count:', submissions.length);
    
    // Filter by specific submission ID
    if (submissionId) {
      submissions = submissions.filter(sa => sa.submissionId === submissionId);
      return NextResponse.json({
        assignments: filteredAssignments,
        submissions
      });
    }
    
    // Filter submissions by other criteria
    if (assignmentId) {
      submissions = submissions.filter(sa => sa.assignmentId === assignmentId);
      console.error('After assignmentId filter:', submissions.length);
    }
    
    if (studentId) {
      console.error('Filtering by studentId:', studentId);
      console.error('Before studentId filter:', submissions.length);
      submissions = submissions.filter(sa => {
        const match = sa.studentId === studentId || 
                     sa.studentId === String(studentId) || 
                     String(sa.studentId) === studentId;
        console.error(`Checking submission ${sa.submissionId}: ${sa.studentId} === ${studentId} ? ${match}`);
        return match;
      });
      console.error('After studentId filter:', submissions.length);
    }
    
    if (unitCode) {
      const assignmentIds = filteredAssignments.map(a => a.id);
      submissions = submissions.filter(sa => assignmentIds.includes(sa.assignmentId));
      console.error('After unitCode filter:', submissions.length);
    }
    
    // This ensures we only return submissions for the assignments we're showing
    const finalAssignmentIds = filteredAssignments.map(a => a.id);
    console.error('Final assignment IDs to match:', finalAssignmentIds);
    submissions = submissions.filter(sa => finalAssignmentIds.includes(sa.assignmentId));
    console.error('After final assignment filter:', submissions.length);
    
    // Filter by submission status (empty/draft/submitted)
    if (submissionStatus) {
      submissions = submissions.filter(sa => sa.submissionStatus === submissionStatus);
      console.error('After submissionStatus filter:', submissions.length);
    }
    
    console.error('Final submissions:', submissions);
    
    return NextResponse.json({
      assignments: filteredAssignments,
      submissions
    });
    
  } catch (error) {
    console.error('Assignments error:', error);
    return NextResponse.json({ error: 'Failed to load assignments' }, { status: 500 });
  }
}