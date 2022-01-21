import { Component, OnInit } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  public message: string | undefined;
  public title: string | undefined;

  constructor(private service: ToastService) { }

  ngOnInit(): void {
    this.service.toastRequests.subscribe(toastRequest => {
      this.message = toastRequest.message;
      this.title = toastRequest.title;
      setTimeout(() => {
        this.message = undefined;
        this.title = undefined;
      }, 1000)
    })
  }

}
