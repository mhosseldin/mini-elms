import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../types';
import { FilestackService } from '../../services/filestack.service';
import { PickerFileMetadata, PickerOptions } from 'filestack-js';
import { File } from 'filestack-js/build/main/lib/api/upload';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
})
export class CourseCardComponent {
  @Input() course!: Course;
  image: PickerFileMetadata | null = null;
  firestore = inject(Firestore);
  filestack = inject(FilestackService);
  editCourseImg(event: Event) {
    event.stopPropagation();
    const options: PickerOptions = {
      fromSources: ['local_file_system'],
      maxFiles: 1,
      uploadInBackground: false,
      onUploadDone: (res) => {
        this.deletePrevImage();
        this.setImg(res.filesUploaded[0]);
      },
    };
    this.filestack.openPicker(options);
  }
  async setImg(file: PickerFileMetadata) {
    const docRef = doc(this.firestore, `courses/${this.course.id}`);
    await updateDoc(docRef, {
      ...this.course,
      imageUrl: file.url,
    });
    this.image = file;
    this.course.imageUrl = file.url;
  }

  async deletePrevImage() {
    if (!this.course.imageUrl) {
      return;
    }
    const handle = this.course.imageUrl?.split('/').at(-1) as string;
    if (!handle) {
      return;
    }
    await this.filestack.deleteFile(handle);
  }
}
