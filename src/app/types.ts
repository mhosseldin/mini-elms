export type Course = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category: string;
  instructorId: string;
  instructorName?: string; // Add this
  students?: string[];
  selectedInstructorId: '';
  selectedStudentId: '';
};

export type Lecture = {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  description?: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  registeredCourses?: string[];
};
