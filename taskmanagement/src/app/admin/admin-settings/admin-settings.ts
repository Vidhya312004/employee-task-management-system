import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.css'
})
export class AdminSettings implements OnInit {
  appName: string = 'Zira';
  darkMode: boolean = false;
  emailNotifications: boolean = true;
  user: any;
  isSaving: boolean = false;
  showSuccess: boolean = false;

  constructor(
    private authService: AuthService, 
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.darkMode = this.themeService.isDarkMode();
  }

  saveSettings() {
    this.isSaving = true;
    this.showSuccess = false;
    this.themeService.setDarkMode(this.darkMode);
    this.cdr.detectChanges();
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      this.showSuccess = true;
      this.cdr.detectChanges();
      console.log('Settings saved', { appName: this.appName, darkMode: this.darkMode, emailNotifications: this.emailNotifications });
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        this.showSuccess = false;
        this.cdr.detectChanges();
      }, 3000);
    }, 800);
  }
}
