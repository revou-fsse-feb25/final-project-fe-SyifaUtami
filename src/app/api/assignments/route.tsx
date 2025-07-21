import { NextResponse, NextRequest } from 'next/server';
import assignmentsData from '@/data/assignments.json';
import studentAssignmentsData from '@/data/studentAssignments.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');
    const unitCode = searchParams.get('unitCode');
    const studentId = searchParams.get('studentId');
    const submissionId = searchParams.get('submissionId'); // NEW
    const status = searchParams.get('status'); // NEW: for filtering open/closed
    const includeSubmissions = searchParams.get('includeSubmissions') === 'true';
    
    let filteredAssignments = assignmentsData;
    
    // Filter by specific assignment
    if (assignmentId) {
      filteredAssignments = assignmentsData.filter(a => a.id === assignmentId);
    }
    
    // Filter by unit
    if (unitCode) {
      const unitCodes = unitCode.split(',');
      filteredAssignments = assignmentsData.filter(a => unitCodes.includes(a.unitCode));
    }
    
    // Just return assignment definitions if no submissions needed
    if (!includeSubmissions) {
      return NextResponse.json(filteredAssignments);
    }
    
    // Include submission data
    let submissions = studentAssignmentsData;
    
    // Filter by specific submission ID (NEW)
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
    }
    if (studentId) {
      submissions = submissions.filter(sa => sa.studentId === studentId);
    }
    if (unitCode) {
      const assignmentIds = filteredAssignments.map(a => a.id);
      submissions = submissions.filter(sa => assignmentIds.includes(sa.assignmentId));
    }
    
    // Filter by status (NEW)
    if (status) {
      submissions = submissions.filter(sa => sa.status === status);
    }
    
    return NextResponse.json({
      assignments: filteredAssignments,
      submissions
    });
    
  } catch (error) {
    console.error('Assignments error:', error);
    return NextResponse.json({ error: 'Failed to load assignments' }, { status: 500 });
  }
}