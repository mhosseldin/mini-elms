import { Component, inject, OnInit } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions'; // Import Functions
import {
  Firestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { NgFor, NgForOf, NgIf } from '@angular/common';
import { NgModel, FormsModule } from '@angular/forms';
import { Course, User } from '../types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, NgForOf, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private functions = inject(Functions);

  isLoading = true;
  courses: Course[] = [];
  users: User[] = [];

  ngOnInit() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.router.navigate(['']);
      return;
    }
    this.fetchData();
  }

  // Fetch courses and users data
  async fetchData() {
    const courseSnap = await getDocs(collection(this.firestore, 'courses'));
    const courses: Course[] = courseSnap.docs.map((doc) => ({
      id: doc.id,
      title: doc.data()['title'] || '',
      category: doc.data()['category'] || '',
      instructorId: doc.data()['instructorId'] || '',
      description: doc.data()['description'] || '',
      imageUrl: doc.data()['imageUrl'] || '',
      instructorName: '',
      students: [],
      selectedInstructorId: '',
      selectedStudentId: '',
    }));

    const userSnap = await getDocs(collection(this.firestore, 'users'));
    const users: User[] = userSnap.docs.map((doc) => ({
      id: doc.id,
      username: doc.data()['username'] || '',
      role: doc.data()['role'] || '',
      registeredCourses: doc.data()['registeredCourses'] || [],
    })) as User[];

    for (const course of courses) {
      const instructor = users.find((user) => user.id === course.instructorId);
      const students = users.filter(
        (user) =>
          user.role === 'student' &&
          (user.registeredCourses ?? []).includes(course.id)
      );

      course.instructorName = instructor?.username || 'Not Assigned';
      course.students = students.map((student) => student.username);
    }

    this.courses = courses;
    this.users = users;
    this.isLoading = false;
  }

  // Assign Instructor
  async assignInstructor(event: Event, courseId: string) {
    event.preventDefault();
    const course = this.courses.find((c) => c.id === courseId);

    if (course?.selectedInstructorId) {
      const userId = course.selectedInstructorId;
      console.log('Assign Instructor:', { courseId, userId });

      if (!userId) {
        console.error('No instructor selected.');
        return;
      }

      await this.setInstructor(courseId, userId);
      const instructor = this.users.find((user) => user.id === userId);

      course.instructorName = instructor?.username || 'Not Assigned';
      course.instructorId = userId;
      course.selectedInstructorId = '';
    }
  }

  // Assign Student
  async assignStudent(event: Event, courseId: string) {
    event.preventDefault();
    const course = this.courses.find((c) => c.id === courseId);

    if (course?.selectedStudentId) {
      const userId = course.selectedStudentId;

      console.log('Assigning Student:', { userId, courseId });

      const student = this.users.find(
        (user) => user.id === userId && user.role === 'student'
      );

      if (!student) {
        console.error('Student not found or invalid.');
        return;
      }

      await this.setStudent(userId, courseId);

      course.students = course.students || [];
      course.students.push(student.username);

      student.registeredCourses = student.registeredCourses || [];
      student.registeredCourses.push(courseId);

      course.selectedStudentId = '';
    }
  }

  async removeInstructor(courseId: string, instructorId: string | undefined) {
    if (!instructorId) {
      console.error('Instructor ID is undefined.');
      return;
    }

    await this.removeInstructorMethod(courseId, instructorId);

    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      course.instructorName = 'Not Assigned';
      course.instructorId = '';
    }
  }

  async removeStudent(courseId: string, studentName: string) {
    const student = this.users.find((user) => user.username === studentName);

    if (!student) {
      console.error('Student not found.');
      return;
    }

    await this.removeStudentMethod(student.id, courseId);

    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      course.students = (course.students || []).filter(
        (s) => s !== studentName
      );
    }
  }

  // Methods for Firebase
  async setInstructor(courseId: string, userId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    const courseRef = doc(this.firestore, 'courses', courseId);

    await updateDoc(courseRef, { instructorId: userId });
    await updateDoc(userRef, {
      registeredCourses: arrayUnion(courseId),
    });
  }

  async setStudent(userId: string, courseId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      registeredCourses: arrayUnion(courseId),
    });
  }

  async removeInstructorMethod(courseId: string, userId: string | undefined) {
    if (!userId || !courseId) {
      console.error('Invalid userId or courseId for removeInstructorMethod:', {
        userId,
        courseId,
      });
      return;
    }

    const userRef = doc(this.firestore, 'users', userId);
    const courseRef = doc(this.firestore, 'courses', courseId);

    await updateDoc(courseRef, { instructorId: '' });
    await updateDoc(userRef, {
      registeredCourses: arrayRemove(courseId),
    });
  }

  async removeStudentMethod(userId: string | undefined, courseId: string) {
    if (!userId || !courseId) {
      console.error('Invalid userId or courseId for removeStudentMethod.');
      return;
    }
    const userRef = doc(this.firestore, 'users', userId);

    await updateDoc(userRef, {
      registeredCourses: arrayRemove(courseId),
    });
  }
}
