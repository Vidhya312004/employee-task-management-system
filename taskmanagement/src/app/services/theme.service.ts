import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeKey = 'zira-dark-mode';
  private isDark = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTheme();
    }
  }

  isDarkMode(): boolean {
    return this.isDark;
  }

  setDarkMode(isDark: boolean) {
    this.isDark = isDark;
    if (isPlatformBrowser(this.platformId)) {
      if (isDark) {
        this.document.body.classList.add('dark-theme');
      } else {
        this.document.body.classList.remove('dark-theme');
      }
      localStorage.setItem(this.darkModeKey, isDark ? 'true' : 'false');
    }
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.darkModeKey);
    if (savedTheme) {
      this.isDark = savedTheme === 'true';
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark = prefersDark;
    }
    this.setDarkMode(this.isDark);
  }
}
