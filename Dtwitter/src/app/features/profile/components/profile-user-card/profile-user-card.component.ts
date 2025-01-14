import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/components/dialog/dialog.component';
import {
  FriendshipStatus,
  FriendshipStatusResponse,
} from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/friends';
import { ProfileUser } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/users';
import { FriendsService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/friends.service';
import { ModeratorService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/moderator.service';
import { PresenceService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/presence.service';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { RelativeUrlPipe } from '../../../../shared/pipes/relative-url.pipe';
import { Router, RouterLink } from '@angular/router';
import {
  NgIf,
  NgOptimizedImage,
  NgSwitch,
  NgSwitchCase,
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import { UserProfileService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/user-profile.service';
import { first } from 'rxjs';
import { AccountService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/account.service';

@Component({
  selector: 'app-profile-user-card',
  templateUrl: './profile-user-card.component.html',
  styleUrl: './profile-user-card.component.scss',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    NgSwitch,
    NgSwitchCase,
    RouterLink,
    RelativeUrlPipe,
    RelativeTimePipe,
    AsyncPipe,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileUserCardComponent implements OnInit {
  @Input() user: ProfileUser | undefined;

  @Input() isCurrentUserProfile: boolean = false;

  friendshipStatus: string = 'Loading';
  isLoading: boolean = false;

  constructor(
    public dialog: MatDialog,
    public presenceService: PresenceService,
    private moderatorService: ModeratorService,
    private userProfileService: UserProfileService,
    private friendsService: FriendsService,
    private accountService: AccountService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isCurrentUserProfile) {
      this.friendshipStatus = 'Current';
      return;
    }
    this.loadFriendStatus();
  }

  loadFriendStatus(): void {
    if (this.user === undefined) {
      return;
    }
    this.friendshipStatus = 'Loading';
    this.isLoading = true;
    this.changeDetectorRef.markForCheck();
    this.friendsService
      .getFriendRequestStatus(this.user.username)
      .pipe(first())
      .subscribe({
        next: (response: FriendshipStatusResponse) => {
          this.friendshipStatus = FriendshipStatus[response.status];
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.friendshipStatus = 'Error';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  addFriend(): void {
    if (this.user === undefined) {
      return;
    }
    this.isLoading = true;
    this.friendshipStatus = 'Loading';
    this.friendsService
      .sendFriendRequest(this.user.username)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.friendshipStatus = 'Pending';
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.friendshipStatus = 'None';
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  removeFriend(): void {
    if (this.user === undefined) {
      return;
    }
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Remove Friend',
        message: 'Are you sure you want to remove this friend?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.friendshipStatus = 'Loading';
        this.friendsService
          .removeFriendship(this.user!.username)
          .pipe(first())
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.friendshipStatus = 'None';
              this.changeDetectorRef.markForCheck();
            },
            error: () => {
              this.isLoading = false;
              this.friendshipStatus = 'Friends';
              this.changeDetectorRef.markForCheck();
            },
          });
      }
    });
  }

  moderatePicture(): void {
    if (this.user === undefined) {
      return;
    }
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Moderate Picture',
        message: 'Are you sure you want to remove this picture?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.moderatorService
          .deleteUserPhoto(this.user!.username)
          .pipe(first())
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.userProfileService.invalidateUserCache(this.user!.username);
              this.user!.profilePictureUrl = null;
              this.changeDetectorRef.markForCheck();
            },
            error: () => {
              this.isLoading = false;
              this.changeDetectorRef.markForCheck();
            },
          });
      }
    });
  }

  moderateDescription(): void {
    if (this.user === undefined) {
      return;
    }
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Moderate Description',
        message: 'Are you sure you want to remove this description?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.moderatorService
          .deleteUserDescription(this.user!.username)
          .pipe(first())
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.userProfileService.invalidateUserCache(this.user!.username);
              this.user!.description = null;
              this.changeDetectorRef.markForCheck();
            },
            error: () => {
              this.isLoading = false;
              this.changeDetectorRef.markForCheck();
            },
          });
      }
    });
  }

  deleteAccount(): void {
    if (this.user === undefined || this.isCurrentUserProfile === false) {
      return;
    }

    const deleteDialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete Account',
        message: 'Are you sure you want to delete your account?',
      },
    });

    deleteDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const confirmDialogRef = this.dialog.open(DialogComponent, {
          data: {
            title: 'Confirm Deletion',
            message:
              'This action cannot be undone. Are you really certain you wish to delete your account?',
          },
        });

        confirmDialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.isLoading = true;
            this.accountService
              .deleteAccount()
              .pipe(first())
              .subscribe({
                next: () => {
                  this.accountService.logout();
                  this.router.navigate(['/portal']);
                },
                error: () => {
                  this.isLoading = false;
                },
              });
          }
        });
      }
    });
  }
}
