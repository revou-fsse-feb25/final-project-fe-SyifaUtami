import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch teacher by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const dataPath = path.join(process.cwd(), 'data/faculty.json');
    const currentData = await readFile(dataPath, 'utf8');
    const facultyData = JSON.parse(currentData);
    
    const teacher = facultyData.teachers.find((t: any) => t.id === id);
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({ teacher });
    
  } catch (error) {
    console.error('Teacher by ID GET error:', error);
    return NextResponse.json({ error: 'Failed to load teacher' }, { status: 500 });
  }
}

// PUT - Update teacher by ID (including unit assignments)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating teacher by ID:', id, body);
    
    // Read current faculty data
    const dataPath = path.join(process.cwd(), 'data/faculty.json');
    const currentData = await readFile(dataPath, 'utf8');
    const facultyData = JSON.parse(currentData);
    
    // Find teacher to update
    const teacherIndex = facultyData.teachers.findIndex((t: any) => t.id === id);
    
    if (teacherIndex === -1) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    // Update teacher data - preserve ID and merge with new data
    facultyData.teachers[teacherIndex] = {
      ...facultyData.teachers[teacherIndex],
      ...body,
      id: id // Ensure ID is preserved
    };
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(facultyData, null, 2));
    
    console.log('Teacher updated successfully:', facultyData.teachers[teacherIndex]);
    
    return NextResponse.json({
      message: 'Teacher updated successfully',
      teacher: facultyData.teachers[teacherIndex]
    });
    
  } catch (error) {
    console.error('Teacher by ID PUT error:', error);
    return NextResponse.json({ 
      error: 'Failed to update teacher',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}