import { NextResponse, NextRequest } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// GET - Fetch unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Getting unit by ID:', id);
    
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    const unit = coursesData.units.find((u: any) => u.code === id);
    
    if (!unit) {
      console.log('Unit not found:', id);
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }
    
    console.log('Found unit:', unit);
    return NextResponse.json({ unit });
    
  } catch (error) {
    console.error('Unit by ID GET error:', error);
    return NextResponse.json({ error: 'Failed to load unit' }, { status: 500 });
  }
}

// PUT - Update unit by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating unit:', id);
    console.log('Update data:', body);
    
    // Validate request body
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Unit code and name are required' }, 
        { status: 400 }
      );
    }
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Find unit to update
    const unitIndex = coursesData.units.findIndex((u: any) => u.code === id);
    
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }
    
    const oldUnit = coursesData.units[unitIndex];
    const newUnitCode = body.code.trim();
    
    // If unit code is changing, check for conflicts
    if (newUnitCode !== id) {
      const existingUnit = coursesData.units.find((u: any) => u.code === newUnitCode && u.code !== id);
      if (existingUnit) {
        return NextResponse.json(
          { error: 'A unit with this code already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update unit data
    const updatedUnit = {
      ...oldUnit,
      code: newUnitCode,
      name: body.name.trim(),
      description: body.description || oldUnit.description || '',
      currentWeek: body.currentWeek || oldUnit.currentWeek
    };
    
    coursesData.units[unitIndex] = updatedUnit;
    
    // If unit code changed, update course's units array
    if (newUnitCode !== id) {
      const parentCourse = coursesData.courses.find((c: any) => c.code === oldUnit.courseCode);
      if (parentCourse && parentCourse.units) {
        const unitIndexInCourse = parentCourse.units.indexOf(id);
        if (unitIndexInCourse !== -1) {
          parentCourse.units[unitIndexInCourse] = newUnitCode;
          console.log(`Updated course ${parentCourse.code} units array: ${id} -> ${newUnitCode}`);
        }
      }
    }
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    console.log('Unit data written to file successfully');
    
    // Handle teacher assignment changes if provided
    if (body.oldTeacherId !== undefined || body.newTeacherId !== undefined) {
      console.log('Handling teacher assignment changes...');
      try {
        await handleTeacherAssignmentChange(
          id, // old unit code
          newUnitCode, // new unit code
          body.oldTeacherId,
          body.newTeacherId
        );
        console.log('Teacher assignments updated successfully');
      } catch (teacherError) {
        console.warn(`Failed to update teacher assignments: ${teacherError}`);
        // Don't fail the unit update, just log the warning
      }
    }
    
    console.log('Unit updated successfully:', updatedUnit);
    
    return NextResponse.json({
      message: 'Unit updated successfully',
      unit: updatedUnit
    });
    
  } catch (error) {
    console.error('Unit PUT error:', error);
    return NextResponse.json({ 
      error: 'Failed to update unit',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE - Delete unit by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Deleting unit:', id);
    
    // Read current courses data
    const dataPath = path.join(process.cwd(), 'data/courses.json');
    const currentData = await readFile(dataPath, 'utf8');
    const coursesData = JSON.parse(currentData);
    
    // Find unit to delete
    const unitIndex = coursesData.units.findIndex((u: any) => u.code === id);
    
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }
    
    const unitToDelete = coursesData.units[unitIndex];
    
    // Remove unit from its parent course's units array
    const parentCourse = coursesData.courses.find((c: any) => c.code === unitToDelete.courseCode);
    if (parentCourse && parentCourse.units) {
      parentCourse.units = parentCourse.units.filter((u: string) => u !== id);
      console.log(`Removed unit ${id} from course ${parentCourse.code}`);
    }
    
    // Remove the unit
    coursesData.units.splice(unitIndex, 1);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(coursesData, null, 2));
    console.log('Unit deleted from courses data');
    
    // Remove unit from all teachers
    try {
      await removeUnitFromAllTeachers(id);
      console.log('Unit removed from all teachers');
    } catch (teacherError) {
      console.warn(`Failed to remove unit from teachers: ${teacherError}`);
    }
    
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

// Helper function to handle teacher assignment changes
async function handleTeacherAssignmentChange(
  oldUnitCode: string,
  newUnitCode: string,
  oldTeacherId: string | null,
  newTeacherId: string | null
): Promise<void> {
  const facultyPath = path.join(process.cwd(), 'data/faculty.json');
  
  try {
    const facultyContent = await readFile(facultyPath, 'utf8');
    const facultyData = JSON.parse(facultyContent);
    
    let hasChanges = false;
    
    // Remove unit from old teacher if changing
    if (oldTeacherId && oldTeacherId !== newTeacherId) {
      const oldTeacher = facultyData.teachers.find((t: any) => t.id === oldTeacherId);
      if (oldTeacher && oldTeacher.unitsTeached) {
        const oldIndex = oldTeacher.unitsTeached.indexOf(oldUnitCode);
        if (oldIndex !== -1) {
          oldTeacher.unitsTeached.splice(oldIndex, 1);
          hasChanges = true;
          console.log(`Removed unit ${oldUnitCode} from teacher ${oldTeacher.firstName} ${oldTeacher.lastName}`);
        }
      }
    }
    
    // Update unit code for existing teacher if code changed but teacher didn't
    if (oldUnitCode !== newUnitCode && oldTeacherId === newTeacherId && oldTeacherId) {
      const teacher = facultyData.teachers.find((t: any) => t.id === oldTeacherId);
      if (teacher && teacher.unitsTeached) {
        const unitIndex = teacher.unitsTeached.indexOf(oldUnitCode);
        if (unitIndex !== -1) {
          teacher.unitsTeached[unitIndex] = newUnitCode;
          hasChanges = true;
          console.log(`Updated unit code from ${oldUnitCode} to ${newUnitCode} for teacher ${teacher.firstName} ${teacher.lastName}`);
        }
      }
    }
    
    // Add unit to new teacher if different
    if (newTeacherId && newTeacherId !== oldTeacherId) {
      const newTeacher = facultyData.teachers.find((t: any) => t.id === newTeacherId);
      if (newTeacher) {
        if (!newTeacher.unitsTeached) {
          newTeacher.unitsTeached = [];
        }
        if (!newTeacher.unitsTeached.includes(newUnitCode)) {
          newTeacher.unitsTeached.push(newUnitCode);
          hasChanges = true;
          console.log(`Added unit ${newUnitCode} to teacher ${newTeacher.firstName} ${newTeacher.lastName}`);
        }
      }
    }
    
    // Write changes if any were made
    if (hasChanges) {
      await writeFile(facultyPath, JSON.stringify(facultyData, null, 2));
      console.log('Faculty data updated successfully');
    }
  } catch (error) {
    throw new Error(`Failed to update teacher assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to remove unit from all teachers
async function removeUnitFromAllTeachers(unitCode: string): Promise<void> {
  const facultyPath = path.join(process.cwd(), 'data/faculty.json');
  
  try {
    const facultyContent = await readFile(facultyPath, 'utf8');
    const facultyData = JSON.parse(facultyContent);
    
    let removedCount = 0;
    
    facultyData.teachers.forEach((teacher: any) => {
      if (teacher.unitsTeached && Array.isArray(teacher.unitsTeached)) {
        const initialLength = teacher.unitsTeached.length;
        teacher.unitsTeached = teacher.unitsTeached.filter((code: string) => code !== unitCode);
        
        if (teacher.unitsTeached.length < initialLength) {
          removedCount++;
          console.log(`Removed unit ${unitCode} from teacher ${teacher.firstName} ${teacher.lastName}`);
        }
      }
    });
    
    if (removedCount > 0) {
      await writeFile(facultyPath, JSON.stringify(facultyData, null, 2));
      console.log(`Unit ${unitCode} removed from ${removedCount} teacher(s)`);
    } else {
      console.log(`Unit ${unitCode} was not assigned to any teachers`);
    }
  } catch (error) {
    throw new Error(`Failed to remove unit from teachers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}