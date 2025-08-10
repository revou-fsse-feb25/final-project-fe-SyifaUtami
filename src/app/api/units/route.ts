// src/app/api/units/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch all units
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    return NextResponse.json({ units: coursesData.units });
    
  } catch (error) {
    console.error('Units GET error:', error);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}

// POST - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating unit with data:', body);
    
    // Validate request body
    if (!body.code || !body.name || !body.courseCode) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Unit code, name, and courseCode are required' }, 
        { status: 400 }
      );
    }
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    console.log('Current courses data loaded');
    
    // Check if unit code already exists
    const existingUnit = coursesData.units.find((u: any) => u.code === body.code.trim());
    if (existingUnit) {
      console.log('Unit code already exists:', body.code);
      return NextResponse.json(
        { error: 'A unit with this code already exists' },
        { status: 409 }
      );
    }
    
    // Check if course exists
    const course = coursesData.courses.find((c: any) => c.code === body.courseCode);
    if (!course) {
      console.log('Course not found:', body.courseCode);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    console.log('Course found:', course);
    
    // Create new unit
    const newUnit = {
      code: body.code.trim(),
      name: body.name.trim(),
      courseCode: body.courseCode,
      description: body.description?.trim() || '',
      currentWeek: body.currentWeek || 1
    };
    
    console.log('New unit object:', newUnit);
    
    // Add unit to units array
    coursesData.units.push(newUnit);
    
    // Add unit to course's units array
    if (!course.units) {
      course.units = [];
    }
    course.units.push(newUnit.code);
    
    console.log('Updated course units:', course.units);
    
    // Write courses data
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    console.log('Unit data written to file successfully');
    
    // Handle teacher assignment if provided
    if (body.teacherId) {
      try {
        await assignTeacherToUnit(body.teacherId, newUnit.code);
        console.log(`Assigned teacher ${body.teacherId} to unit ${newUnit.code}`);
      } catch (teacherError) {
        console.warn(`Failed to assign teacher to unit: ${teacherError}`);
        // Don't fail the entire operation if teacher assignment fails
      }
    }
    
    console.log('Unit created successfully:', newUnit);
    
    return NextResponse.json({
      message: 'Unit created successfully',
      unit: newUnit
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unit POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to create unit',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Helper function to assign teacher to unit
async function assignTeacherToUnit(teacherId: string, unitCode: string): Promise<void> {
  const facultyPath = path.join(process.cwd(), 'data/faculty.json');
  
  try {
    const facultyContent = await readFile(facultyPath, 'utf8');
    const facultyData = JSON.parse(facultyContent);
    
    const teacher = facultyData.teachers.find((t: any) => t.id === teacherId);
    if (teacher) {
      if (!teacher.unitsTeached) {
        teacher.unitsTeached = [];
      }
      if (!teacher.unitsTeached.includes(unitCode)) {
        teacher.unitsTeached.push(unitCode);
        await writeFile(facultyPath, JSON.stringify(facultyData, null, 2));
        console.log(`Added unit ${unitCode} to teacher ${teacher.firstName} ${teacher.lastName}`);
      }
    }
  } catch (error) {
    throw new Error(`Failed to assign teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}