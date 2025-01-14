import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'D:/Dotnet/Dtwitter/Dtwitter/src/environments/environment';
import { ProfileUser } from '../models/users';
import { Observable, map, of } from 'rxjs';
import { CacheManagerService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/cache-manager.service';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cacheManager: CacheManagerService
  ) {}

  getUser(username: string): Observable<ProfileUser> {
    const cachedUser = this.cacheManager.getCache<ProfileUser>(
      'user-' + username
    );
    if (cachedUser) {
      return of(cachedUser);
    }

    return this.http
      .get<{ user: ProfileUser }>(this.baseUrl + 'Users/username/' + username)
      .pipe(
        map((response) => {
          const user = response.user;
          this.cacheManager.setCache('user-' + username, user);
          return user;
        })
      );
  }

  //used when a moderator deletes a photo or description or when a user updates their own profile
  invalidateUserCache(username: string): void {
    this.cacheManager.clearCache('user-' + username);
  }
}
