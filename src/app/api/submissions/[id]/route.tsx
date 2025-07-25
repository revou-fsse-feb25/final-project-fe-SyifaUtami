import { NextResponse, NextRequest } from 'next/server';
import assignmentsData from '@/data/assignments.json';
import studentAssignmentsData from '@/data/studentAssignments.json';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('Fetching submission by ID:', id);
    
    // Find the submission by submissionId
    const submission = studentAssignmentsData.find(sa => sa.submissionId === id);
    
    if (!submission) {
      console.log('Submission not found:', id);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    console.log('Found submission:', submission);
    
    // Find the related assignment
    const assignment = assignmentsData.find(a => a.id === submission.assignmentId);
    
    if (!assignment) {
      console.log('Related assignment not found for submission:', submission.assignmentId);
      return NextResponse.json({ error: 'Related assignment not found' }, { status: 404 });
    }
    
    console.log('Found related assignment:', assignment);
    
    // Return both submission and assignment data
    return NextResponse.json({
      submission,
      assignment
    });
    
  } catch (error) {
    console.error('Submission by ID error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}