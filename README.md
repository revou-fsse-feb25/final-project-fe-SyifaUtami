# Imajine University LMS - Frontend

- **Live URL**: [https://imajine-uni-frontend.vercel.app](https://imajine-uni-frontend.vercel.app)
- **Backend API**: [https://imajine-uni-api-production.up.railway.app](https://imajine-uni-api-production.up.railway.app)

## info

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Icons**: FontAwesome
- **Authentication**: JWT with refresh tokens
- **State Management**: React hooks + Context API
- **HTTP Client**: Fetch API with custom wrapper
- **Deployment**: Vercel (Automatic deployments)


### Student P

#### **Dashboard & Profile**
- Profile info
- enrollment data

#### **Course & Unit Management**
- View enrolled courses (Business Management, Business Analytics)
- progress track
- Unit information

#### **Assignment System**
- View all assignments with status (OPEN/CLOSED)
- Filter assignments by unit, status, and submission state
- Assignment submission page
- Grade viewing and feedback system

#### **Progress Analytics**
- Individual unit progress bar
- Weekly material completion check
- Assignment completion tracking

### 👨‍💼 Coordinator Portal

#### **Dashboard & Analytics**
- System overview with key metrics
- Student behaviour statistics
- Teacher and course counts
- Performance analytics

#### **Student Management**
- Complete student data with search and filters
- Individual student profiles with detailed analytics
- Academic performance tracking
- Progress monitoring across all units
- Change grades and week performance

#### **Course & Unit Administration**
- Course overview and management
- Unit creation, editing, and deletion
- Assignment management
- Progress tracking for all students

#### **Teacher Management**
- Faculty data and contact information
- Teacher statistics and performance metrics
- Course assignment tracking
- add / delete teacher

### **Design System**
- Integrated css with global.css to ensure designs are consistent
- Responsive design with mobile-first approach
- Consistent card-based layout system

### **other**
- **Navigation**: Collapsible sidebar with role-based menu items
- **Modal System**: Course and unit management modals
- **Error Handling**: User-friendly error messages


### **Authentication System**
- JWT token authentication
- Automatic token refresh
- Role-based access control (Student/Coordinator)
- Cross-tab login/logout synchronization
- Secure local storage management

### **Route Protection**

- Private routes with authentication middleware
- Role-based route protection
- Automatic redirects based on user role

### **Test Credentials**
```
Coordinator:
Email: coordinator@imajine.ac.id
Password: coordinator123

Student:
Email: TomHolland@imajine.ac.id
Password: student123
```

### **Key API Endpoints**
```
Authentication:
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Students:
- GET /students (coordinator-side information)
- GET /students/:id/units
- GET /students/stats

Assignments:
- GET /assignments
- GET /assignments/:id
- PUT /assignments/:id

Analytics:
- GET /analytics/overview
- GET /analytics/student/:id
- GET /analytics/trends

Progress:
- GET /student-progress/student/:id
- PUT /student-progress/student/:id/unit/:code
```
