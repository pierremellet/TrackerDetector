import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogoService {


  private _logoMap: {
    [key: string]: string
  } = {
      "google": "https://logo.clearbit.com/google.com",
      "adobe": "https://logo.clearbit.com/adobe.com",
      "facebook": "https://logo.clearbit.com/facebook.com",
      "amazon": "https://logo.clearbit.com/amazon.com",
      "oracle": "https://logo.clearbit.com/oracle.com",
      "youtube": "https://logo.clearbit.com/youtube.com",
      "bing": "https://logo.clearbit.com/bing.com",
      "twitter": "https://logo.clearbit.com/twitter.com",
      "linkedin": "https://logo.clearbit.com/linkedin.com"
    }

  constructor() { }

  public findCompanyLogoURL(companyName: string): string | undefined {
    var url = undefined;
    if (companyName) {
      Object.keys(this._logoMap).forEach(k => {
        if (companyName.toLowerCase().includes(k)) {
          url = this._logoMap[k];
        }
      });
    }
    return url;
  }

}
