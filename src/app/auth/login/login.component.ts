import { Component, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  constructor(private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      passwd: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, passwd } = this.loginForm.value;

      // Authenticate user with Firebase
      signInWithEmailAndPassword(this.auth, email, passwd)
        .then(() => {
          this.successMessage = 'Login successful! Redirecting...';
          this.errorMessage = '';
          this.loginForm.reset();

          // Navigate to the homepage
          this.router.navigate(['']);
        })
        .catch((error) => {
          console.error('Login error:', error.message);
          this.errorMessage = 'Invalid email or password. Please try again.';
          this.successMessage = '';
        });
    } else {
      this.errorMessage = 'Please fill out the form correctly.';
      this.successMessage = '';
    }
  }
}
