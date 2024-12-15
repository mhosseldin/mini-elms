import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Course, Lecture } from '../../types';
import {
  doc,
  Firestore,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
@Component({
  selector: 'app-create-lecture-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-lecture-form.component.html',
  styleUrl: './create-lecture-form.component.css',
})
export class CreateLectureFormComponent {
  lectureForm!: FormGroup;
  fb = inject(FormBuilder);
  @Input() course!: Course;
  @Output() formSubmit = new EventEmitter<void>();
  firestore = inject(Firestore);

  constructor() {
    this.lectureForm = this.fb.group({
      title: ['', Validators.required],
      duration: ['', Validators.required],
      description: [''],
    });
  }

  async onSubmit() {
    const lecture: Lecture = {
      ...this.lectureForm.value,
      id: self.crypto.randomUUID(),
    };
    const docRef = doc(
      this.firestore,
      `courses/${this.course.id}/lectures/${lecture.id}`
    );
    await setDoc(docRef, {
      ...lecture,
      cts: serverTimestamp(),
    });
    this.formSubmit.emit();
  }
}
