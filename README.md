# Imagine Unviersity LMS Frontend
- **Live URL**: https://imajine-uni-frontend.vercel.app](https://imajine-uni-frontend.vercel.app
- **Backend API**: https://imajine-uni-api-production.up.railway.app](https://imajine-uni-api-production.up.railway.app

## info

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Icons**: FontAwesome
- **Authentication**: JWT with refresh tokens
- **State Management**: React hooks + Context API
- **HTTP Client**: Fetch API with custom wrapper
- **Deployment**: Vercel (Automatic deployments)


## install

- Clone the repository
- Install dependencies
- Environment setup
- bash# Create environment file

# Edit .env.local
NEXT_PUBLIC_API_BASE_URL=https://imajine-uni-api-production.up.railway.app

Run development server

bashnpm run dev
### *Login*

<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/f2dcc652-e74a-4563-b672-8003cdf29c7d" />

- easy login data
- test helper (only during production)
### Student data

#### **Profile**
<img width="700" height="auto" alt="Screenshot 2025-08-29 at 10 13 22 pm" src="https://github.com/user-attachments/assets/e56a2baf-f849-4789-a5b4-8ca61160e13e" />


- Profile info
- enrollment data

#### **Course Unit Management**

<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/0ac8a091-1f0d-4dea-b0ca-8bcc741d5663" />

- View enrolled courses (Business Management, Business Analytics)
- progress track
- Unit information

#### **units data**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/0f6ab980-c936-4a3d-98c3-216e21decf5c" />

- Individual unit progress bar
- Weekly material completion check
- Assignment list

#### **Assignment System**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/c0d1c636-96e6-4d7b-a994-ac446ebc0a07" />

- View all assignments with status (OPEN/CLOSED)
- Filter assignments by unit, status, and submission state
- Assignment submission page

##### Submitted assignments
<img width="700" height="auto" alt="Screenshot 2025-08-29 at 10 20 34 pm" src="https://github.com/user-attachments/assets/68c4544a-9d9a-4fdd-b183-0f01a9d245d0" />

- show grade data, teacher comment, date published, and others

#### open assignments
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/665a3963-032a-477d-a0a3-2f3163dae56c" />
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/0cdcde0d-7cff-4f6c-8f48-adf5f27fad83" />

- deadline and connects to submission page

### Coordinator

#### **Profile**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/936d1b74-2571-42d8-8517-2c67735c326f" />

#### **Dashboard & Analytics**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/7321b3e2-494d-4bf4-a2fe-5d72266c1be8" />

- System overview with key metrics
- Student behaviour statistics
- Teacher and course counts
- Performance analytics

#### **Student Management**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/d08cef8f-d12d-484e-9559-d9399f344d06" />

- Complete student data with search and filters
- Individual student profiles with detailed analytics
- Academic performance tracking
- Progress monitoring across all units
- Change grades and week performance
- 
#### **Teacher Management**
<img width="700" height="auto" alt="image" src="https://github.com/user-attachments/assets/01b705ef-98b4-4836-9680-92ec88e05a74" />

- Faculty data and contact information
- Teacher statistics and performance metrics
- Course assignment tracking
- add / delete teacher


#### **Unit Management**
<img width="1196" height="786" alt="Screenshot 2025-08-29 at 10 26 10 pm" src="https://github.com/user-attachments/assets/008e89ba-45ff-4bc9-9f56-924d700ffd2c" />


- Unit creation, editing, and deletion



### **Design System**
- Integrated css with global.css to ensure designs are consistent
- Responsive design with mobile-first approach
- Consistent card-based layout system

### **other**
- **Navigation**: sidebar with for menu items
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
