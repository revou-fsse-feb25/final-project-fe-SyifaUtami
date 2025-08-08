//detailed view for submissions

import { NextResponse, NextRequest } from 'next/server';
import assignmentsData from '@/data/assignments.json';
import studentAssignmentsData from '@/data/studentAssignments.json';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { Assignment, StudentSubmission } from '../../../../types';

// Request body interface for grading
interface UpdateGradeRequest {
  grade: number;
  comment?: string;
  gradedBy?: string;
}

// GET method for retrieving submission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Fetching submission by ID:', id);
    
    // Find the submission by submissionId
    const submission = studentAssignmentsData.find((sa: any) => sa.submissionId === id);
    
    if (!submission) {
      console.log('Submission not found:', id);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    console.log('Found submission:', submission);
    
    // Find the related assignment
    const assignment = assignmentsData.find((a: any) => a.id === submission.assignmentId);
    
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

// PUT method for updating submission grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateGradeRequest = await request.json();
    
    console.log('Updating submission grade for ID:', id);
    console.log('Update data:', body);
    
    // Validate request body
    if (typeof body.grade !== 'number' || body.grade < 0 || body.grade > 100) {
      return NextResponse.json(
        { error: 'Grade must be a number between 0 and 100' }, 
        { status: 400 }
      );
    }
    
    // Read current data from studentAssignments.json
    const dataPath = path.join(process.cwd(), 'data/studentAssignments.json');
    
    console.log('Reading file from path:', dataPath);
    
    const currentData = await readFile(dataPath, 'utf8');
    const submissions: any[] = JSON.parse(currentData);
    
    console.log('Current submissions data loaded, total items:', submissions.length);
    
    // Find and update the submission
    const submissionIndex = submissions.findIndex((sa: any) => sa.submissionId === id);
    
    if (submissionIndex === -1) {
      console.log('Submission not found in data:', id);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    console.log('Found submission at index:', submissionIndex);
    console.log('Current submission:', submissions[submissionIndex]);
    
    // Update the submission
    submissions[submissionIndex] = {
      ...submissions[submissionIndex],
      grade: body.grade,
      comment: body.comment || submissions[submissionIndex].comment,
      gradedBy: body.gradedBy || 'coordinator'
    };
    
    console.log('Updated submission:', submissions[submissionIndex]);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(submissions, null, 2));
    
    console.log('Grade updated successfully for submission:', id);
    
    // Return the updated submission
    return NextResponse.json({
      message: 'Grade updated successfully',
      submission: submissions[submissionIndex]
    });
    
  } catch (error) {
    console.error('Submission update error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({ 
      error: 'Failed to update submission grade',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}