import { Component, inject, Input } from '@angular/core';
import { Course, Lecture } from '../../types';
import { CommonModule } from '@angular/common';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { PickerOptions, PickerFileMetadata, Filestack } from 'filestack-js';
import { FilestackService } from '../../services/filestack.service';

@Component({
  selector: 'app-lecture-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture-list-item.component.html',
  styleUrl: './lecture-list-item.component.css',
})
export class LectureListItemComponent {
  isOpen = false;
  @Input() lecture!: Lecture;
  @Input() course!: Course;
  firestore = inject(Firestore);
  filestack = inject(FilestackService);

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
}
