import { Component, inject, Output, EventEmitter } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  userForm!: FormGroup;
  @Output() formSubmit = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  successMessage: string = '';

  constructor() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      passwd: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;

      // Register the user with Firebase Authentication
      createUserWithEmailAndPassword(this.auth, formData.email, formData.passwd)
        .then((userCredential) => {
          const user = userCredential.user;

          // Save additional user data in Firestore using UID as document ID
          const userDocRef = doc(this.firestore, 'users', user.uid);
          setDoc(userDocRef, {
            username: formData.username,
            email: formData.email,
            role: formData.role,
            registeredCourses: [], // Initialize empty courses
          }).then(() => {
            console.log('User registered and data saved to Firestore!');

            this.successMessage = 'Your account has been created successfully!';
            this.formSubmit.emit(); // Notify parent component
            this.userForm.reset(); // Reset the form

            // Redirect to homepage
            this.router.navigate(['']);
          });
        })
        .catch((error) => {
          console.error('Error registering user:', error.message);
        });
    } else {
      console.error('Form is invalid');
    }
  }
}
