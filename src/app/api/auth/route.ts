import { NextResponse, NextRequest } from 'next/server';
import studentsData from '@/data/students.json';
import facultyData from '@/data/faculty.json';

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json();
    
    if (userType === 'faculty') {
      const user = facultyData.faculty.find(f => f.email === email && f.password === password);
      
      if (user) {
        return NextResponse.json({ 
          success: true, 
          user, 
          userType: 'coordinator' 
        });
      }
    } else {
      const user = studentsData.find(s => s.email === email && s.password === password);
      
      if (user) {
        return NextResponse.json({ 
          success: true, 
          user, 
          userType: 'student' 
        });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid credentials' 
    }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Authentication error' 
    }, { status: 500 });
  }
}