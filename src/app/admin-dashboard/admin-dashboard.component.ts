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
  DocumentData,
  DocumentReference,
  setDoc,
  query,
  where,
  getDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { NgFor, NgForOf, NgIf } from '@angular/common';
import { NgModel, FormsModule } from '@angular/forms';
import { Course, User } from '../types';
import { RegisterComponent } from '../auth/register/register.component';
import { ModalComponent } from '../components/modal/modal.component';
import { AddUserComponent } from './add-user/add-user.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgForOf,
    FormsModule,
    RegisterComponent,
    ModalComponent,
    AddUserComponent,
  ],
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

  isRegisterModalOpen = false;

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

  async assignStudent(event: Event, courseId: string) {
    event.preventDefault();
    const course = this.courses.find((c) => c.id === courseId);

    if (course?.selectedStudentId) {
      const userId = course.selectedStudentId;

      // Find the student object
      const student = this.users.find(
        (user) => user.id === userId && user.role === 'student'
      );

      if (student) {
        try {
          // Update the student's registered courses
          const userRef = doc(this.firestore, 'users', userId);
          await updateDoc(userRef, {
            registeredCourses: arrayUnion(courseId),
          });

          // Update the course list in UI
          course.students = course.students || [];
          course.students.push(student.username);

          student.registeredCourses = student.registeredCourses || [];
          student.registeredCourses.push(courseId);

          // Generate a random number for document ID
          const randomSuffix = Math.floor(Math.random() * 100000); // 5-digit random number
          const uniqueDocId = `${student.username}${randomSuffix}`;

          // Create a studentProgress document with the unique ID
          const studentProgressRef = doc(
            this.firestore,
            'studentProgress',
            uniqueDocId
          );

          await setDoc(studentProgressRef, {
            studentId: student.id, // Reference user ID
            courseId: courseId, // Assigned course ID
            watchedLectures: [], // Empty watched lectures
            progress: '0%', // Initialize progress to 0%
            assignmentUrls: [], // Empty assignments
            grade: 'N/A', // No grade initially
          });

          console.log(
            `Student progress document created: ${uniqueDocId} for course ${courseId}`
          );

          // Reset the selected student ID
          course.selectedStudentId = '';
          alert('Student assigned successfully!');
        } catch (error) {
          console.error('Error assigning student:', error);
          alert('Failed to assign student. Please try again.');
        }
      } else {
        console.error('Student not found.');
      }
    } else {
      console.error('No student selected.');
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
  async setInstructor(courseId: string, newInstructorId: string) {
    // Step 1: Find the current instructor of the course
    const courseRef = doc(this.firestore, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      console.error('Course does not exist.');
      return;
    }

    const currentInstructorId = courseSnap.data()['instructorId'];

    try {
      // Step 2: Remove the courseId from the current instructor's registeredCourses
      if (currentInstructorId) {
        const currentInstructorRef = doc(
          this.firestore,
          'users',
          currentInstructorId
        );
        await updateDoc(currentInstructorRef, {
          registeredCourses: arrayRemove(courseId),
        });
        console.log(
          `Removed course ${courseId} from previous instructor ${currentInstructorId}.`
        );
      }

      // Step 3: Assign the new instructor to the course
      await updateDoc(courseRef, { instructorId: newInstructorId });

      // Step 4: Add the courseId to the new instructor's registeredCourses
      const newInstructorRef = doc(this.firestore, 'users', newInstructorId);
      await updateDoc(newInstructorRef, {
        registeredCourses: arrayUnion(courseId),
      });

      console.log(
        `Assigned course ${courseId} to new instructor ${newInstructorId}.`
      );
    } catch (error) {
      console.error('Error assigning instructor:', error);
    }
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

    try {
      // Remove the course from the student's registeredCourses field
      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, {
        registeredCourses: arrayRemove(courseId),
      });

      // Construct the studentProgress document ID using the known pattern (e.g., username + random suffix)
      const student = this.users.find((user) => user.id === userId);
      if (!student) {
        console.error('Student not found.');
        return;
      }

      // Generate a prefix for the document name based on username
      const progressCollection = collection(this.firestore, 'studentProgress');
      const progressQuery = query(
        progressCollection,
        where('studentId', '==', userId),
        where('courseId', '==', courseId)
      );

      const progressSnap = await getDocs(progressQuery);

      if (!progressSnap.empty) {
        const progressDocRef = progressSnap.docs[0].ref;
        await deleteDoc(progressDocRef);
        console.log('Student progress document deleted successfully.');
      } else {
        console.warn('No matching studentProgress document found.');
      }

      console.log('Student removed successfully.');
    } catch (error) {
      console.error('Error removing student:', error);
    }
  }

  async deleteUser(userId: string) {
    try {
      // Step 1: Query studentProgress documents for the user
      const progressCollection = collection(this.firestore, 'studentProgress');
      const progressQuery = query(
        progressCollection,
        where('studentId', '==', userId)
      );
      const progressSnap = await getDocs(progressQuery);

      // Step 2: Delete all matching studentProgress documents
      const deletePromises = progressSnap.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
      );
      await Promise.all(deletePromises);
      console.log('All studentProgress documents deleted successfully.');

      // Step 3: Delete the user document from Firestore
      const userRef = doc(this.firestore, 'users', userId);
      await deleteDoc(userRef);
      console.log(`User document with ID ${userId} deleted successfully.`);

      // Step 4: Update the local users array
      this.users = this.users.filter((user) => user.id !== userId);

      alert('User and their progress records deleted successfully!');
    } catch (error) {
      console.error('Error deleting user and progress records:', error);
      alert('Failed to delete user and their progress records.');
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
