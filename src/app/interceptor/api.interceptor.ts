import { isPlatformBrowser } from '@angular/common';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../app.state';
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private store: Store<AppState>
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let authToken;
    if (isPlatformBrowser(this.platformId)) {
      authToken = sessionStorage.getItem('uuid');
    }

    const modifiedReq = req.clone({
      setHeaders: { Authorization: `${authToken}` },
    });

    return next.handle(modifiedReq);
  }
}
