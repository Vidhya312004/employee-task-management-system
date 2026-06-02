import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './components/loader/loader.component';

import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [SidebarComponent, RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('taskmanagement');
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
}

