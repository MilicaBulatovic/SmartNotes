import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Router } from '@angular/router';
import {shareReplay, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebRequestService, private http: HttpClient, private router: Router ) {}

  login(email: string, password: string) {
   return  this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // the auth tokens will be in the header of this response
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
        console.log("LOGGED IN!");
       // console.log(res);
      })
    )
  }

  signup(email: string, password: string) {
    return  this.webService.signup(email, password).pipe(
       shareReplay(),
       tap((res: HttpResponse<any>) => {
         // the auth tokens will be in the header of this response
         this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
         console.log("Successfully signed up!");
        // console.log(res);
       })
     )
   }

    logout() {
      this.removeSession();
  
      this.router.navigate(['/login']);
    }

    getAccessToken(){
      return localStorage.getItem('x-access-token');
    }
    getRefreshToken() {
      return localStorage.getItem('x-refresh-token');
    }
  
    getUserId() {
      return localStorage.getItem('user-id');
    }
  
    setAccessToken(accessToken: string | null) {
      localStorage.setItem('x-access-token', accessToken ?? '');
    }
    
    private setSession(userId: string, accessToken: string | null, refreshToken: string | null) {
      localStorage.setItem('user-id', userId);
      localStorage.setItem('x-access-token', accessToken ?? '');
      localStorage.setItem('x-refresh-token', refreshToken ?? '');
    }
    
    private removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }

  getNewAccessToken() {
    const refreshToken = this.getRefreshToken();
    const userId = this.getUserId();
  
    if (refreshToken && userId) {
      return this.http.get(`${this.webService.ROOT_URL}/users/me/access-token`, {
        headers: {
          'x-access-token': refreshToken,
          '_id': userId
        },
        observe: 'response'
      }).pipe(
        tap((res: HttpResponse<any>)=> {
          this.setAccessToken(res.headers.get('x-access-token'));
        })
      )
    }
  
    throw new Error('Refresh token or user ID not found.');
  }
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!accessToken && !!refreshToken;
  }
}