import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { getFunctions, provideFunctions } from '@angular/fire/functions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      })
    ),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'mini-elms-hci',
        appId: '1:326813145960:web:35d5bab3f496d25d5754dd',
        storageBucket: 'mini-elms-hci.firebasestorage.app',
        apiKey: 'AIzaSyAPcwknbnR3dwbrq5SzvLbkAL6HL_jJYVA',
        authDomain: 'mini-elms-hci.firebaseapp.com',
        messagingSenderId: '326813145960',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions()),
  ],
};
