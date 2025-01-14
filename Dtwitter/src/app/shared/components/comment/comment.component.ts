import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommentsService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/comments.service';
import { LikesService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/likes.service';
import { Comment } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/comments';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { NgIf, NgClass } from '@angular/common';
import { Subject, first, takeUntil } from 'rxjs';
import { ClickOutsideService } from '../../services/click-outside.service';
import { LikedUser } from '../../models/likedUser';
import { LikedUsersListComponent } from '../liked-users-list/liked-users-list.component';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    UserAvatarComponent,
    NgClass,
    TimeAgoPipe,
    LikedUsersListComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent implements OnDestroy {
  @Input() comment: Comment | undefined;

  @Output() commentDeleted: EventEmitter<number> = new EventEmitter();

  deleteCommentLoading: boolean = false;
  likedUsers: LikedUser[] = [];
  showLikedUsers: boolean = false;
  isLoading: boolean = false;
  optimisticLike: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private commentsService: CommentsService,
    private likesService: LikesService,
    public dialog: MatDialog,
    private clickOutsideService: ClickOutsideService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  toggleLike(comment: Comment) {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (comment.isLikedByCurrentUser) {
      comment.likesCount -= 1;
      this.optimisticLike = false;
      comment.isLikedByCurrentUser = false;
      this.likesService
        .unlikeComment(comment.commentId)
        .pipe(first())
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            comment.isLikedByCurrentUser = true;
            comment.likesCount += 1;
            this.changeDetectorRef.markForCheck();
          },
        });
    } else {
      this.optimisticLike = true;
      comment.likesCount += 1;

      this.likesService
        .likeComment(comment.commentId)
        .pipe(first())
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.optimisticLike = false;
            comment.isLikedByCurrentUser = true;
            this.changeDetectorRef.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.optimisticLike = false;
            comment.likesCount -= 1;
            this.changeDetectorRef.markForCheck();
          },
        });
    }
  }

  displayLikedUsers(): void {
    if (this.comment?.likesCount === 0 || this.isLoading) {
      return;
    } else if (
      this.comment?.likesCount === 1 &&
      this.comment?.isLikedByCurrentUser
    ) {
      this.showLikedUsers = !this.showLikedUsers;
      this.handleOutsideClick();
      return;
    }
    this.showLikedUsers = !this.showLikedUsers;
    if (this.showLikedUsers) {
      if (this.likedUsers.length === 0) {
        this.loadLikedUsers();
      }
      this.clickOutsideService.bind(this, () => {
        this.showLikedUsers = false;
        this.changeDetectorRef.markForCheck();
      });
    } else {
      this.clickOutsideService.unbind(this);
    }
  }

  handleOutsideClick(): void {
    if (this.showLikedUsers) {
      this.clickOutsideService.bind(this, () => {
        this.showLikedUsers = false;
        this.changeDetectorRef.markForCheck();
      });
    } else {
      this.clickOutsideService.unbind(this);
    }
  }

  loadLikedUsers(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (this.comment?.commentId) {
      this.likesService
        .getCommentLikes(this.comment.commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (likedUsers) => {
            this.isLoading = false;
            this.likedUsers = likedUsers;
            this.changeDetectorRef.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
          },
        });
    }
  }

  deleteComment(commentId: number) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe((result) => {
        if (result) {
          if (this.isLoading) {
            return;
          }
          this.changeDetectorRef.markForCheck();
          this.deleteCommentLoading = true;
          this.isLoading = true;
          this.commentsService.deleteComment(commentId).subscribe({
            next: () => {
              this.isLoading = false;
              this.comment = undefined;
              this.commentDeleted.emit(commentId);
              this.deleteCommentLoading = false;
            },
            error: () => {
              this.isLoading = false;
              this.deleteCommentLoading = false;
              this.changeDetectorRef.markForCheck();
            },
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.clickOutsideService.unbind(this);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
