import { NextResponse, NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');
    
    if (!studentId || !assignmentId) {
      return NextResponse.json({ error: 'Missing studentId or assignmentId' }, { status: 400 });
    }
    
    console.log('Checking for existing submission:', { studentId, assignmentId });
    
    // CORRECTED: File is in project root data/ folder, not src/data/
    const filePath = path.join(process.cwd(), 'data/studentAssignments.json');
    console.log('Reading file from:', filePath);
    
    const fileContent = await readFile(filePath, 'utf8');
    const studentAssignments = JSON.parse(fileContent);
    
    console.log('All submissions found:', studentAssignments.length);
    console.log('Looking for studentId:', studentId, 'assignmentId:', assignmentId);
    
    // Find existing submission
    const existingSubmission = studentAssignments.find(
      (submission: any) => 
        submission.studentId === studentId && 
        submission.assignmentId === assignmentId
    );
    
    if (existingSubmission) {
      console.log('✅ Found existing submission:', existingSubmission);
      return NextResponse.json({ 
        found: true,
        submission: existingSubmission 
      });
    } else {
      console.log('❌ No existing submission found for:', { studentId, assignmentId });
      // Log all available submissions for debugging
      console.log('Available submissions:');
      studentAssignments.forEach((sub: any, index: number) => {
        console.log(`  ${index + 1}. studentId: "${sub.studentId}", assignmentId: "${sub.assignmentId}"`);
      });
      return NextResponse.json({ 
        found: false,
        submission: null 
      });
    }
    
  } catch (error) {
    console.error('❌ Check submission error:', error);
    return NextResponse.json({ error: 'Failed to check submission' }, { status: 500 });
  }
}