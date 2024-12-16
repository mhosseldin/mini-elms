import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'eLMS';

  isLoggedIn: boolean = false; // State to track user's login status
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    // Listen to the Firebase Auth state
    onAuthStateChanged(this.auth, (user) => {
      this.isLoggedIn = !!user; // Update login state based on user presence
    });
  }

  // Logout method
  logout() {
    signOut(this.auth)
      .then(() => {
        this.isLoggedIn = false; // Update login state
        this.router.navigate(['']); // Redirect to homepage
        console.log('User logged out');
      })
      .catch((error) => {
        console.error('Error logging out:', error.message);
      });
  }
}
