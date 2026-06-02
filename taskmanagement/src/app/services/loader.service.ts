import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  public isLoading$ = this.isLoadingSubject.asObservable();

  show(): void {
    if (this.activeRequests === 0) {
      this.isLoadingSubject.next(true);
    }
    this.activeRequests++;
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests === 0) {
      this.isLoadingSubject.next(false);
    }
    // Prevent negative request counts if hide is called unexpectedly
    if (this.activeRequests < 0) {
      this.activeRequests = 0;
      this.isLoadingSubject.next(false);
    }
  }
}
