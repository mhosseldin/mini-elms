import { Component, inject, OnInit } from '@angular/core';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { ModalComponent } from '../components/modal/modal.component';
import { CreateCourseFormComponent } from '../components/create-course-form/create-course-form.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoaderComponent } from '../components/loader/loader.component';
import { Course } from '../types';
import { COURSES } from '../dummy-data';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  getDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CourseCardComponent,
    ModalComponent,
    CreateCourseFormComponent,
    AsyncPipe,
    LoaderComponent,
    NgIf,
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  isCreateCourseModalOpen = false;
  courses$!: Observable<Course[]>;
  firestore = inject(Firestore);
  userRole: string | null = null;
  auth = inject(Auth);

  ngOnInit(): void {
    const courseRef = collection(this.firestore, 'courses');
    this.courses$ = collectionData(courseRef) as Observable<Course[]>;

    // Fetch current user's role
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          this.userRole = userDocSnap.data()['role']; // Fetch the role from Firestore
        }
      }
    });
    //console.log(this.userRole);
  }
}
