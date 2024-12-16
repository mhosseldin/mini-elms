import { Component, inject, Input, OnInit } from '@angular/core';
import { Course, Lecture } from '../../types';
import { CommonModule, NgIf } from '@angular/common';
import {
  query,
  where,
  doc,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from '@angular/fire/firestore';
import { PickerOptions, PickerFileMetadata } from 'filestack-js';
import { FilestackService } from '../../services/filestack.service';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-lecture-list-item',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './lecture-list-item.component.html',
  styleUrl: './lecture-list-item.component.css',
})
export class LectureListItemComponent implements OnInit {
  isOpen = false;
  @Input() lecture!: Lecture;
  @Input() course!: Course;
  firestore = inject(Firestore);
  filestack = inject(FilestackService);
  userRole: string | null = null;
  userId: string | null = null;
  auth = inject(Auth);

  toggle() {
    if (!this.lecture.description && !this.lecture.videoUrl) {
      return;
    }
    this.isOpen = !this.isOpen;
  }

  uploadLectureVideo(event: Event) {
    event.stopPropagation();
    const options: PickerOptions = {
      fromSources: ['local_file_system'],
      maxFiles: 1,
      uploadInBackground: false,
      onUploadDone: (res) => {
        this.deletePrevVideo();
        this.setVideo(res.filesUploaded[0]);
      },
    };
    this.filestack.openPicker(options);
  }

  async setVideo(file: PickerFileMetadata) {
    const docRef = doc(
      this.firestore,
      `courses/${this.course.id}/lectures/${this.lecture.id}`
    );
    await updateDoc(docRef, {
      ...this.lecture,
      videoUrl: file.url,
    });
    this.lecture.videoUrl = file.url;
  }

  async deletePrevVideo() {
    if (!this.lecture.videoUrl) {
      return;
    }
    const handle = this.lecture.videoUrl?.split('/').at(-1) as string;
    if (!handle) {
      return;
    }
    await this.filestack.deleteFile(handle);
  }

  ngOnInit(): void {
    // Fetch current user's role and ID
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.userId = user.uid; // Set the userId for use in markLectureAsWatched
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          this.userRole = userDocSnap.data()['role']; // Fetch the role from Firestore
        }
      }
    });
  }

  async markLectureAsWatched() {
    if (!this.userId) return;

    const progressQuery = query(
      collection(this.firestore, 'studentProgress'),
      where('studentId', '==', this.userId),
      where('courseId', '==', this.course.id)
    );

    const progressSnap = await getDocs(progressQuery);

    if (!progressSnap.empty) {
      const progressDocRef = progressSnap.docs[0].ref;
      const progressData = progressSnap.docs[0].data();

      const watchedLectures = progressData['watchedLectures'] || [];
      if (!watchedLectures.includes(this.lecture.id)) {
        watchedLectures.push(this.lecture.id);

        console.log('Updated Watched Lectures:', watchedLectures);
        await updateDoc(progressDocRef, {
          watchedLectures: watchedLectures,
        });
      }
    } else {
      const progressDocRef = doc(collection(this.firestore, 'studentProgress'));
      await setDoc(progressDocRef, {
        studentId: this.userId,
        courseId: this.course.id,
        watchedLectures: [this.lecture.id],
        grade: 'N/A',
      });
    }
  }
}
