import { inject } from '@angular/core';
import { getAuth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Routes } from '@angular/router';

// Custom Route Guard to check if user is an admin
const adminGuard = async () => {
  const auth = getAuth();
  const firestore = inject(Firestore);

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data()['role'] === 'admin') {
          resolve(true);
        } else {
          alert('Access Denied: Admins Only');
          resolve(false);
        }
      } else {
        alert('Please log in to access this page.');
        resolve(false);
      }
    });
  });
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./courses/courses.component').then((m) => m.CoursesComponent),
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./course-detail/course-detail.component').then(
        (m) => m.CourseDetailComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'user',
    loadComponent: () =>
      import('./user-page/user-page.component').then(
        (m) => m.UserPageComponent
      ),
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [adminGuard],
  },
];
