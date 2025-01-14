import { Component, OnInit } from '@angular/core';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';
import { SearchUser } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/users';
import { PresenceService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/presence.service';
import { OnlineUserDisplayComponent } from '../online-user-display/online-user-display.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { UserSearchService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/user-search.service';

@Component({
  selector: 'app-online-users-list',
  templateUrl: './online-users-list.component.html',
  styleUrl: './online-users-list.component.scss',
  standalone: true,
  imports: [AsyncPipe, NgIf, OnlineUserDisplayComponent],
})
export class OnlineUsersListComponent implements OnInit {
  onlineUsers$?: Observable<SearchUser[]>;
  loadingError: boolean = false;

  constructor(
    public userSearchService: UserSearchService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    this.onlineUsers$ = combineLatest([
      this.userSearchService.getSearchUsers(),
      this.presenceService.onlineUsers$,
    ]).pipe(
      map(([users, onlineUserIds]) =>
        users.filter((user) => onlineUserIds.includes(user.appUserId))
      ),
      catchError(() => {
        this.loadingError = true;
        return of([]);
      })
    );
  }
}
