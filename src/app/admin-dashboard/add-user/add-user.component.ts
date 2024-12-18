import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { getAuth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './add-user.component.html',
})
export class AddUserComponent {
  userForm!: FormGroup;
  @Output() formSubmit = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);

  successMessage: string = '';
  errorMessage: string = '';

  constructor() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      passwd: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      const auth = getAuth();
      const adminUser = auth.currentUser;

      try {
        // Create a new user with email/password but keep the admin signed in
        const newUserCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.passwd
        );

        const newUser = newUserCredential.user;

        // Save additional user data in Firestore
        const userDocRef = doc(this.firestore, 'users', newUser.uid);
        await setDoc(userDocRef, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          registeredCourses: [],
        });

        // Success feedback
        this.successMessage = 'User added successfully!';
        this.formSubmit.emit(); // Notify parent to close modal
        this.userForm.reset();

        // Re-authenticate admin user
        if (adminUser) {
          await auth.updateCurrentUser(adminUser);
        }
      } catch (error: any) {
        console.error('Error adding user:', error.message);
        this.errorMessage = 'Failed to add user. ' + error.message;
      }
    } else {
      console.error('Form is invalid');
      this.errorMessage = 'Please fill out the form correctly.';
    }
  }
}
