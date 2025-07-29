
import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// DELETE - Remove teacher by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Deleting teacher with ID:', id);
    
    // Read current faculty data
    const dataPath = path.join(process.cwd(), 'data/faculty.json');
    const currentData = await readFile(dataPath, 'utf8');
    const facultyData = JSON.parse(currentData);
    
    // Find teacher index
    const teacherIndex = facultyData.teachers.findIndex((t: any) => t.id === id);
    
    if (teacherIndex === -1) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    // Remove teacher
    const removedTeacher = facultyData.teachers[teacherIndex];
    facultyData.teachers.splice(teacherIndex, 1);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(facultyData, null, 2));
    
    console.log('Teacher deleted successfully:', removedTeacher);
    
    return NextResponse.json({
      message: 'Teacher deleted successfully',
      teacher: removedTeacher
    });
    
  } catch (error) {
    console.error('Teacher DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete teacher',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}