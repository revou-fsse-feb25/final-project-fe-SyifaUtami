/* 
- Receives the Student's Work
- Finds the Storage File
- detect duplicate 
*/

import { NextResponse, NextRequest } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const submissionData = await request.json();
    
    console.log('=== SUBMISSION SAVE ===');
    console.log('Processing submission:', submissionData.submissionId);
    
    // FIXED: Correct path to data folder in project root
    const filePath = path.join(process.cwd(), 'data/studentAssignments.json');
    const fileContent = await readFile(filePath, 'utf8');
    const studentAssignments = JSON.parse(fileContent);
    
    console.log('Current submissions count:', studentAssignments.length);
    
    // Check for duplicates (same student + assignment)
    const existingIndex = studentAssignments.findIndex(
      (submission: any) => 
        submission.studentId === submissionData.studentId && 
        submission.assignmentId === submissionData.assignmentId
    );
    
    if (existingIndex !== -1) {
      // Update existing submission
      console.log('Updating existing submission:', studentAssignments[existingIndex].submissionId);
      studentAssignments[existingIndex] = submissionData;
      
      // Save updated data
      await writeFile(filePath, JSON.stringify(studentAssignments, null, 2));
      
      return NextResponse.json({ 
        success: true,
        message: submissionData.submissionStatus === 'submitted' 
          ? 'Assignment submitted successfully!' 
          : 'Draft updated successfully!',
        action: 'updated',
        data: submissionData 
      });
    } else {
      // Add new submission
      console.log('Adding new submission');
      studentAssignments.push(submissionData);
      
      // Save updated data
      await writeFile(filePath, JSON.stringify(studentAssignments, null, 2));
      
      return NextResponse.json({ 
        success: true,
        message: submissionData.submissionStatus === 'submitted' 
          ? 'Assignment submitted successfully!' 
          : 'Draft saved successfully!',
        action: 'created',
        data: submissionData 
      });
    }
    
  } catch (error) {
    console.error('Submission save error:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to save submission. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}