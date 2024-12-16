import { Component, inject, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { PickerFileMetadata, PickerOptions } from 'filestack-js';
import { FilestackService } from '../services/filestack.service';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [NgIf, NgForOf],
  templateUrl: './user-page.component.html',
})
export class UserPageComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private filestack = inject(FilestackService);

  userName: string = '';
  userRole: string = '';
  userId: string = '';
  registeredCourses: any[] = [];
  isLoading = true;

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.userId = user.uid;
        const userRef = doc(this.firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.userRole = userData['role'];
          this.userName = userData['username'];

          if (this.userRole === 'student') {
            await this.fetchRegisteredCourses(
              userData['registeredCourses'],
              user.uid
            );
          }

          if (this.userRole === 'instructor') {
            await this.fetchInstructorCourses(user.uid);
          }
        }

        this.isLoading = false;
      }
    });
  }

  // async fetchRegisteredCourses(courseIds: string[], userId: string) {
  //   const progressPromises = courseIds.map((courseId: string) => {
  //     return (async () => {
  //       const progressQuery = query(
  //         collection(this.firestore, 'studentProgress'),
  //         where('studentId', '==', userId),
  //         where('courseId', '==', courseId)
  //       );
  //       const progressSnap = await getDocs(progressQuery);

  //       const courseTitle = await this.getCourseTitle(courseId);
  //       const totalLectures = await this.getTotalLectures(courseId);

  //       let watchedLecturesCount = 0;
  //       let grade = 'N/A';

  //       if (!progressSnap.empty) {
  //         const filteredDocs = progressSnap.docs.filter((doc) => {
  //           const data = doc.data();
  //           return data['studentId'] === this.userId; // Ensure it's the right student
  //         });

  //         if (filteredDocs.length > 0) {
  //           const progressData = filteredDocs[0].data();
  //           console.log('Watched Lectures:', progressData['watchedLectures']);

  //           watchedLecturesCount = progressData['watchedLectures']
  //             ? progressData['watchedLectures'].length
  //             : 0;
  //           grade = progressData['grade'] || 'N/A';
  //         }
  //       }

  //       const progressPercentage =
  //         totalLectures > 0
  //           ? ((watchedLecturesCount / totalLectures) * 100).toFixed(0) + '%'
  //           : '0%';

  //       console.log({
  //         courseId,
  //         watchedLecturesCount,
  //         totalLectures,
  //         progressPercentage,
  //       });

  //       return {
  //         courseId,
  //         courseTitle,
  //         progress: progressPercentage,
  //         grade: grade,
  //       };
  //     })();
  //   });

  //   this.registeredCourses = (await Promise.all(progressPromises)).flat();
  // }

  async fetchRegisteredCourses(courseIds: string[], userId: string) {
    const progressPromises = courseIds.map((courseId: string) => {
      return (async () => {
        const progressQuery = query(
          collection(this.firestore, 'studentProgress'),
          where('studentId', '==', userId),
          where('courseId', '==', courseId)
        );
        const progressSnap = await getDocs(progressQuery);

        const courseTitle = await this.getCourseTitle(courseId);
        const totalLectures = await this.getTotalLectures(courseId);

        let watchedLecturesCount = 0;
        let grade = 'N/A';

        if (!progressSnap.empty) {
          const progressDocRef = progressSnap.docs[0].ref;
          const progressData = progressSnap.docs[0].data();

          watchedLecturesCount = progressData['watchedLectures']
            ? progressData['watchedLectures'].length
            : 0;
          grade = progressData['grade'] || 'N/A';

          const progressPercentage =
            totalLectures > 0
              ? ((watchedLecturesCount / totalLectures) * 100).toFixed(0) + '%'
              : '0%';

          console.log({
            courseId,
            watchedLecturesCount,
            totalLectures,
            progressPercentage,
          });

          // Update the progress field in Firestore
          await updateDoc(progressDocRef, {
            progress: progressPercentage,
          });

          return {
            courseId,
            courseTitle,
            progress: progressPercentage,
            grade: grade,
          };
        }

        // If no progress document exists
        return {
          courseId,
          courseTitle,
          progress: '0%',
          grade: 'N/A',
        };
      })();
    });

    this.registeredCourses = (await Promise.all(progressPromises)).flat();
  }

  async getCourseTitle(courseId: string): Promise<string> {
    const courseRef = doc(this.firestore, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    return courseSnap.exists() ? courseSnap.data()['title'] : 'Unknown Course';
  }

  async getTotalLectures(courseId: string): Promise<number> {
    const lecturesCollectionRef = collection(
      this.firestore,
      `courses/${courseId}/lectures`
    );
    const lecturesSnap = await getDocs(lecturesCollectionRef);
    console.log('Total Lectures:', lecturesSnap.size);
    return lecturesSnap.size;
  }

  submitAssignment(courseId: string) {
    const options: PickerOptions = {
      fromSources: ['local_file_system'],
      maxFiles: 1,
      uploadInBackground: false,
      onUploadDone: async (res) => {
        const uploadedFile: PickerFileMetadata = res.filesUploaded[0];
        await this.updateAssignmentURL(courseId, uploadedFile.url);
        alert('Assignment uploaded successfully!');
      },
    };
    this.filestack.openPicker(options);
  }

  async updateAssignmentURL(courseId: string, fileUrl: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const progressQuery = query(
      collection(this.firestore, 'studentProgress'),
      where('studentId', '==', user.uid),
      where('courseId', '==', courseId)
    );
    const progressSnap = await getDocs(progressQuery);

    if (!progressSnap.empty) {
      const progressDocRef = progressSnap.docs[0].ref;

      const currentData = progressSnap.docs[0].data();
      const updatedAssignmentUrls = currentData['assignmentUrls']
        ? [...currentData['assignmentUrls'], fileUrl]
        : [fileUrl];

      await updateDoc(progressDocRef, {
        assignmentUrls: updatedAssignmentUrls,
      });
    }
  }

  async fetchInstructorCourses(userId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const courseIds = userData['registeredCourses'] || [];

      this.registeredCourses = await Promise.all(
        courseIds.map(async (courseId: string) => {
          const studentsProgress = await this.getStudentsProgress(courseId);

          return {
            courseId,
            courseTitle: await this.getCourseTitle(courseId),
            students: studentsProgress,
          };
        })
      );
    }
  }

  async getStudentsProgress(courseId: string) {
    // Query studentProgress collection to get progress for all students in the course
    const progressQuery = query(
      collection(this.firestore, 'studentProgress'),
      where('courseId', '==', courseId)
    );

    const progressSnap = await getDocs(progressQuery);

    return Promise.all(
      progressSnap.docs.map(async (progressDoc) => {
        const progressData = progressDoc.data();
        const studentName = await this.getStudentName(
          progressData['studentId']
        );

        return {
          studentId: progressData['studentId'],
          studentName: studentName,
          progress: progressData['progress'] || '0%',
          grade: progressData['grade'] || 'N/A',
          assignmentUrls: progressData['assignmentUrls'] || [], // Include assignments
        };
      })
    );
  }

  async getStudentName(studentId: string): Promise<string> {
    const studentRef = doc(this.firestore, 'users', studentId);
    const studentSnap = await getDoc(studentRef);

    return studentSnap.exists() ? studentSnap.data()['username'] : 'Unknown';
  }

  async setGrade(studentId: string, courseId: string) {
    const grade = prompt('Enter grade for this student:');
    if (grade) {
      const progressQuery = query(
        collection(this.firestore, 'studentProgress'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId)
      );

      const progressSnap = await getDocs(progressQuery);

      if (!progressSnap.empty) {
        const progressDocRef = progressSnap.docs[0].ref;
        await updateDoc(progressDocRef, { grade });
        alert('Grade updated successfully!');
      }
    }
  }
}
