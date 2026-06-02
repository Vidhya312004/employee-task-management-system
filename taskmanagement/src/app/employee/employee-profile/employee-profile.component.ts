import { Component, OnInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.css']
})
export class EmployeeProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  editMode: boolean = false;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  editData: Partial<User> = {
    name: '',
    phone: '',
    department: ''
  };
  
  isUploading: boolean = false;
  showMenu: boolean = false;
  showCameraModal: boolean = false;
  isCameraLoading: boolean = false;
  stream: MediaStream | null = null;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user = currentUser;
      this.resetEditData();
    }
  }

  ngOnDestroy(): void {
    this.closeCamera();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showMenu = false;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  triggerGalleryUpload(): void {
    this.showMenu = false;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  openCamera(): void {
    this.showMenu = false;
    this.showCameraModal = true;
    this.isCameraLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: false
      })
      .then(mediaStream => {
        this.stream = mediaStream;
        this.isCameraLoading = false;
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = mediaStream;
        }
      })
      .catch(err => {
        this.isCameraLoading = false;
        this.showCameraModal = false;
        this.errorMessage = 'Could not access webcam. Please check permissions and try again.';
        console.error('Camera access error:', err);
      });
    }, 100);
  }

  closeCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.showCameraModal = false;
  }

  captureImage(): void {
    if (!this.videoElement || !this.canvasElement || !this.user || !this.user.id) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      const size = Math.min(video.videoWidth, video.videoHeight) || 480;
      canvas.width = size;
      canvas.height = size;

      // Crop to square centered
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      context.drawImage(video, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          this.uploadCapturedImage(file);
        }
      }, 'image/jpeg', 0.9);
    }
  }

  uploadCapturedImage(file: File): void {
    if (!this.user || !this.user.id) return;
    
    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.closeCamera();

    this.userService.uploadProfileImage(this.user.id, file).subscribe({
      next: (updatedUser) => {
        this.isUploading = false;
        this.user = updatedUser;
        
        // Update session storage and auth service signal
        const userObj = JSON.parse(sessionStorage.getItem('user') || '{}');
        const newUserObj = { ...userObj, profile_image: updatedUser.profile_image };
        sessionStorage.setItem('user', JSON.stringify(newUserObj));
        this.authService.currentUser.set(newUserObj);

        this.successMessage = 'Profile image updated successfully!';
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.message || 'Failed to upload captured image. Please try again.';
      }
    });
  }

  removeImage(): void {
    if (!this.user || !this.user.id) return;

    this.showMenu = false;
    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.removeProfileImage(this.user.id).subscribe({
      next: (updatedUser) => {
        this.isUploading = false;
        this.user = updatedUser;

        // Update session storage and auth service signal
        const userObj = JSON.parse(sessionStorage.getItem('user') || '{}');
        const newUserObj = { ...userObj, profile_image: null };
        sessionStorage.setItem('user', JSON.stringify(newUserObj));
        this.authService.currentUser.set(newUserObj);

        this.successMessage = 'Profile image removed successfully!';
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.message || 'Failed to remove image. Please try again.';
      }
    });
  }

  resetEditData(): void {
    if (this.user) {
      this.editData = {
        name: this.user.name,
        phone: this.user.phone || '',
        department: this.user.department || ''
      };
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.resetEditData();
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  saveProfile(): void {
    if (!this.user || !this.user.id) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateUser(this.user.id, this.editData).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.user = updatedUser;
        
        // Update session storage and auth service signal
        const userObj = JSON.parse(sessionStorage.getItem('user') || '{}');
        const newUserObj = { ...userObj, ...this.editData };
        sessionStorage.setItem('user', JSON.stringify(newUserObj));
        this.authService.currentUser.set(newUserObj);

        this.successMessage = 'Profile updated successfully!';
        this.editMode = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.user && this.user.id) {
      this.isUploading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.userService.uploadProfileImage(this.user.id, file).subscribe({
        next: (updatedUser) => {
          this.isUploading = false;
          this.user = updatedUser;
          
          // Update local storage and auth service signal
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          const newUserObj = { ...userObj, profile_image: updatedUser.profile_image };
          localStorage.setItem('user', JSON.stringify(newUserObj));
          this.authService.currentUser.set(newUserObj);

          this.successMessage = 'Profile image uploaded successfully!';
        },
        error: (err) => {
          this.isUploading = false;
          this.errorMessage = err.error?.message || 'Failed to upload image. Please try again.';
        }
      });
    }
  }
}
