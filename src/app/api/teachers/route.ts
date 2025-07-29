import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch all teachers
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data/faculty.json');
    const currentData = await readFile(dataPath, 'utf8');
    const facultyData = JSON.parse(currentData);
    
    return NextResponse.json({
      teachers: facultyData.teachers || []
    });
    
  } catch (error) {
    console.error('Teachers GET error:', error);
    return NextResponse.json({ error: 'Failed to load teachers' }, { status: 500 });
  }
}

// POST - Add new teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Adding new teacher:', body);
    
    // Validate request body
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' }, 
        { status: 400 }
      );
    }
    
    // Read current faculty data
    const dataPath = path.join(process.cwd(), 'data/faculty.json');
    const currentData = await readFile(dataPath, 'utf8');
    const facultyData = JSON.parse(currentData);
    
    // Check if teacher with same email already exists
    const existingTeacher = facultyData.teachers.find((t: any) => t.email === body.email);
    if (existingTeacher) {
      return NextResponse.json(
        { error: 'A teacher with this email already exists' },
        { status: 409 }
      );
    }
    
    // Add new teacher
    const newTeacher = {
      id: body.id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      unitsTeached: body.unitsTeached || []
    };
    
    facultyData.teachers.push(newTeacher);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(facultyData, null, 2));
    
    console.log('Teacher added successfully:', newTeacher);
    
    return NextResponse.json({
      message: 'Teacher added successfully',
      teacher: newTeacher
    });
    
  } catch (error) {
    console.error('Teacher POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to add teacher',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}