import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, throwError, empty, Subject } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebRequestInterceptor implements HttpInterceptor  {

  constructor(private authService: AuthService) { }
  
  refreshingAccessToken!: boolean;
  accessTokenRefreshed: Subject<any> = new Subject();

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // opsluzivanje zahtjeva
    request = this.addAuthHeader(request);

    // pozivanje next() metode i opsluzivanje zahtjeva
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);

        if (error.status === 401) {
          // 401 error, nismo autorizovani

          // osvjezavanje pristupni tokena
          return this.refreshAccessToken()
            .pipe(
              switchMap(() => {
                request = this.addAuthHeader(request);
                return next.handle(request);
              }),
              catchError((err: any) => {
                console.log(err);
                this.authService.logout();
                return empty();
              })
            )
        }

        return throwError(error);
      })
    )
  }

  refreshAccessToken() {
   if (this.refreshingAccessToken) {
      return new Observable(observer => {
        this.accessTokenRefreshed.subscribe(() => {
          // ovaj kod se izvrsava kada se pristupni token osvjezi
          observer.next();
          observer.complete();
        })
      })
    } else {
      this.refreshingAccessToken = true;
      // zelimo da pozovemo metodu u servisu za autorizaciju kao zahtev za osvjezavanje pristupnog tokena
      return this.authService.getNewAccessToken().pipe(
        tap(() => {
          console.log("Access Token Refreshed!");
          this.refreshingAccessToken = false;
          this.accessTokenRefreshed.next(null);
        })
      )
    }
  }

  addAuthHeader(request: HttpRequest<any>) {
    const token = this.authService.getAccessToken();
    if(token){
      return request.clone({
        setHeaders: {
          'x-access-token' : token
        }
      })
    }
    return request;
  }
}
