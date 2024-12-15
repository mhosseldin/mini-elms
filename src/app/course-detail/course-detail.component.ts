import { Component, inject, OnInit } from '@angular/core';
import { Course, Lecture } from '../types';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../components/modal/modal.component';
import { CreateLectureFormComponent } from '../components/create-lecture-form/create-lecture-form.component';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { LectureListItemComponent } from '../components/lecture-list-item/lecture-list-item.component';
import { LoaderComponent } from '../components/loader/loader.component';
import { COURSES, LECTURES } from '../dummy-data';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  getDoc,
  orderBy,
  query,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    ModalComponent,
    CreateLectureFormComponent,
    AsyncPipe,
    LectureListItemComponent,
    LoaderComponent,
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css',
})
export class CourseDetailComponent implements OnInit {
  course: Course | null = COURSES[0];
  isLoadingCourse = false;
  lectures$!: Observable<Lecture[]>;
  isCreateLectureModalOpen = false;
  activateRoute = inject(ActivatedRoute);
  firestore = inject(Firestore);
  ngOnInit(): void {
    const id = this.activateRoute.snapshot.paramMap.get('id') as string;
    const lectureRef = query(
      collection(this.firestore, `courses/${id}/lectures`),
      orderBy('cts', 'asc')
    );
    this.getCourse(id);
    this.lectures$ = collectionData(lectureRef) as Observable<Lecture[]>;
  }
  async getCourse(id: string) {
    this.isLoadingCourse = true;
    const courseDocRef = doc(this.firestore, `courses/${id}`);
    const courseDocSnapshot = await getDoc(courseDocRef);
    const course = courseDocSnapshot.data() as Course;
    this.course = course;
    this.isLoadingCourse = false;
  }
}
