import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch all courses (can also be handled by academic-data, but keeping for consistency)
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    return NextResponse.json(coursesData);
    
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}

// POST - Add new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Adding new course:', body);
    
    // Validate request body
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Course code and name are required' }, 
        { status: 400 }
      );
    }

    if (!body.managedBy) {
      return NextResponse.json(
        { error: 'Please select a coordinator to manage this course' }, 
        { status: 400 }
      );
    }
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Check if course with same code already exists
    const existingCourse = coursesData.courses.find((c: any) => c.code === body.code);
    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this code already exists' },
        { status: 409 }
      );
    }
    
    // Add new course
    const newCourse = {
      code: body.code.trim(),
      name: body.name.trim(),
      units: body.units || [] // Default to empty units array
    };
    
    coursesData.courses.push(newCourse);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    
    // Also update faculty.json to add this course to coordinator's managed courses
    try {
      const facultyPath = path.join(process.cwd(), 'data/faculty.json');
      const facultyContent = await readFile(facultyPath, 'utf8');
      const facultyData = JSON.parse(facultyContent);
      
      // Find the coordinator and add the new course to their managed courses
      const coordinator = facultyData.faculty.find((f: any) => f.title === 'Coordinator');
      if (coordinator && !coordinator.courseManaged.includes(newCourse.code)) {
        coordinator.courseManaged.push(newCourse.code);
        await writeFile(facultyPath, JSON.stringify(facultyData, null, 2));
        console.log('Added course to coordinator managed list:', newCourse.code);
      }
    } catch (facultyError) {
      console.warn('Failed to update coordinator managed courses:', facultyError);
      // Don't fail the main operation, just log the warning
    }
    
    console.log('Course added successfully:', newCourse);
    
    return NextResponse.json({
      message: 'Course added successfully',
      course: newCourse
    });
    
  } catch (error) {
    console.error('Course POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to add course',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE - Delete course by code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('code');
    
    if (!courseCode) {
      return NextResponse.json(
        { error: 'Course code is required' }, 
        { status: 400 }
      );
    }
    
    console.log('Deleting course with code:', courseCode);
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Find course to delete
    const courseIndex = coursesData.courses.findIndex((c: any) => c.code === courseCode);
    
    if (courseIndex === -1) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const courseToDelete = coursesData.courses[courseIndex];
    
    // Remove all units that belong to this course
    coursesData.units = coursesData.units.filter((u: any) => u.courseCode !== courseCode);
    
    // Remove the course
    coursesData.courses.splice(courseIndex, 1);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    
    // Also update faculty.json to remove this course from ALL coordinators' managed courses
    try {
      const facultyPath = path.join(process.cwd(), 'data/faculty.json');
      const facultyContent = await readFile(facultyPath, 'utf8');
      const facultyData = JSON.parse(facultyContent);
      
      // Remove the deleted course from all coordinators' managed courses
      facultyData.faculty.forEach((coordinator: any) => {
        if (coordinator.courseManaged && Array.isArray(coordinator.courseManaged)) {
          coordinator.courseManaged = coordinator.courseManaged.filter((code: string) => code !== courseCode);
        }
      });
      
      await writeFile(facultyPath, JSON.stringify(facultyData, null, 2));
      console.log('Removed course from all coordinators managed lists:', courseCode);
    } catch (facultyError) {
      console.warn('Failed to update coordinator managed courses:', facultyError);
      // Don't fail the main operation, just log the warning
    }
    
    console.log('Course and its units deleted successfully:', courseToDelete);
    
    return NextResponse.json({
      message: 'Course and its units deleted successfully',
      course: courseToDelete
    });
    
  } catch (error) {
    console.error('Course DELETE error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete course',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}