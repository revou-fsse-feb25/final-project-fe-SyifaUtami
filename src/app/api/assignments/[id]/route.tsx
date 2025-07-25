import { NextResponse, NextRequest } from 'next/server';
import assignmentsData from '@/data/assignments.json';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('Fetching assignment by ID:', id);
    
    // Find the assignment by ID
    const assignment = assignmentsData.find(a => a.id === id);
    
    if (!assignment) {
      console.log('Assignment not found:', id);
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    console.log('Found assignment:', assignment);
    
    return NextResponse.json(assignment);
    
  } catch (error) {
    console.error('Assignment by ID error:', error);
    return NextResponse.json({ error: 'Failed to load assignment' }, { status: 500 });
  }
}