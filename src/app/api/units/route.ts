import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch units (optionally filtered by course)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    let units = coursesData.units || [];
    
    // Filter by course if specified
    if (courseCode) {
      units = units.filter((unit: any) => unit.courseCode === courseCode);
    }
    
    return NextResponse.json({ units });
    
  } catch (error) {
    console.error('Units GET error:', error);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}

// POST - Add new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Adding new unit:', body);
    
    // Validate request body
    if (!body.code || !body.name || !body.courseCode) {
      return NextResponse.json(
        { error: 'Unit code, name, and courseCode are required' }, 
        { status: 400 }
      );
    }
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Check if unit with same code already exists
    const existingUnit = coursesData.units.find((u: any) => u.code === body.code);
    if (existingUnit) {
      return NextResponse.json(
        { error: 'A unit with this code already exists' },
        { status: 409 }
      );
    }
    
    // Check if the course exists
    const course = coursesData.courses.find((c: any) => c.code === body.courseCode);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Add new unit
    const newUnit = {
      code: body.code.trim(),
      name: body.name.trim(),
      courseCode: body.courseCode.trim(),
      description: body.description || 'Unit description will be added here.',
      currentWeek: body.currentWeek || 1
    };
    
    coursesData.units.push(newUnit);
    
    // Also add the unit to the course's units array
    if (!course.units.includes(newUnit.code)) {
      course.units.push(newUnit.code);
    }
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    
    console.log('Unit added successfully:', newUnit);
    
    return NextResponse.json({
      message: 'Unit added successfully',
      unit: newUnit
    });
    
  } catch (error) {
    console.error('Unit POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to add unit',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE - Delete unit by code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitCode = searchParams.get('code');
    
    if (!unitCode) {
      return NextResponse.json(
        { error: 'Unit code is required' }, 
        { status: 400 }
      );
    }
    
    console.log('Deleting unit with code:', unitCode);
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Find unit to delete
    const unitIndex = coursesData.units.findIndex((u: any) => u.code === unitCode);
    
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }
    
    const unitToDelete = coursesData.units[unitIndex];
    
    // Remove unit from its parent course's units array
    const parentCourse = coursesData.courses.find((c: any) => c.code === unitToDelete.courseCode);
    if (parentCourse) {
      parentCourse.units = parentCourse.units.filter((u: string) => u !== unitCode);
    }
    
    // Remove the unit
    coursesData.units.splice(unitIndex, 1);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    
    console.log('Unit deleted successfully:', unitToDelete);
    
    return NextResponse.json({
      message: 'Unit deleted successfully',
      unit: unitToDelete
    });
    
  } catch (error) {
    console.error('Unit DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete unit',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}