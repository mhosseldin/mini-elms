import { Component, inject, Output, EventEmitter } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { Course } from '../../types';

@Component({
  selector: 'app-create-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './create-course-form.component.html',
  styleUrl: './create-course-form.component.css',
})
export class CreateCourseFormComponent {
  courseForm!: FormGroup;
  fb = inject(FormBuilder);
  @Output() formSubmit = new EventEmitter<void>();

  firestore = inject(Firestore);

  constructor() {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
    });
  }

  async onSubmit() {
    const course: Course = {
      ...this.courseForm.value,
      id: self.crypto.randomUUID(),
    };
    const docRef = doc(this.firestore, `courses/${course.id}`);
    await setDoc(docRef, course);
    this.formSubmit.emit();
  }
}
