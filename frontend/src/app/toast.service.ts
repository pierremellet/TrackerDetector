import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  public toastRequests = new Subject<{
    title: string,
    message: string
  }>();

  constructor() { }

  show(title:string, message: string): void {
    this.toastRequests.next({
      message : message,
      title: title
    });
  }
  
}
