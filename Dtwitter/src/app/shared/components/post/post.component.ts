import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Post } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/posts';
import { CommentsService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/comments.service';
import { LikesService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/likes.service';
import { PostsService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/posts.service';
import { Comment } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/comments';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RelativeUrlPipe } from '../../pipes/relative-url.pipe';
import { UploadCommentComponent } from '../upload-comment/upload-comment.component';
import { CommentComponent } from '../comment/comment.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { RouterLink } from '@angular/router';
import { NgIf, NgClass, NgOptimizedImage } from '@angular/common';
import { Subject, first, takeUntil } from 'rxjs';
import { LikedUser } from '../../models/likedUser';
import { LikedUsersListComponent } from '../liked-users-list/liked-users-list.component';
import { ClickOutsideService } from '../../services/click-outside.service';
import { CacheManagerService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/cache-manager.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    UserAvatarComponent,
    NgClass,
    NgOptimizedImage,
    CommentComponent,
    UploadCommentComponent,
    RelativeUrlPipe,
    RelativeTimePipe,
    LikedUsersListComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostComponent implements OnDestroy {
  @Input() post: Post | undefined;

  @Output() postDeleted: EventEmitter<Post> = new EventEmitter();

  @Output() postUpdated: EventEmitter<Post> = new EventEmitter();

  comments: Comment[] = [];
  commentsShown: boolean = false;
  commentsLoading: boolean = false;
  uploadCommentLoading: boolean = false;
  errorLoadingComments: boolean = false;
  pageNumber: number = 1;
  pageSize: number = 3;
  totalComments: number | undefined;
  allCommentsLoaded: boolean = false;
  likedUsers: LikedUser[] = [];
  showLikedUsers: boolean = false;
  isLoading: boolean = false;
  deletePostLoading: boolean = false;
  optimisticLike: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private likesService: LikesService,
    private postsService: PostsService,
    private commentsService: CommentsService,
    private cacheManager: CacheManagerService,
    public dialog: MatDialog,
    private clickOutsideService: ClickOutsideService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  displayLikedUsers(): void {
    if (this.post?.likesCount === 0 || this.isLoading) {
      return;
    } else if (this.post?.likesCount === 1 && this.post?.isLikedByCurrentUser) {
      this.changeDetectorRef.markForCheck();
      this.showLikedUsers = !this.showLikedUsers;
      this.handleOutsideClick();
      return;
    }

    this.showLikedUsers = !this.showLikedUsers;
    if (this.showLikedUsers) {
      if (this.likedUsers.length === 0 && this.post?.postId) {
        const cachedLikedUsers = this.cacheManager.getCache<LikedUser[]>(
          'likedUsers' + this.post.postId
        );
        if (cachedLikedUsers) {
          this.likedUsers = cachedLikedUsers;
        } else {
          this.loadLikedUsers();
        }
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
    this.isLoading = true;

    if (this.post?.postId) {
      this.likesService
        .getPostLikes(this.post.postId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (likedUsers) => {
            this.isLoading = false;
            this.likedUsers = likedUsers;
            this.changeDetectorRef.markForCheck();
            this.cacheManager.setCache(
              'likedUsers' + this.post?.postId,
              this.likedUsers
            );
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }
  }

  toggleLike(post: Post): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (post.isLikedByCurrentUser) {
      post.likesCount -= 1;
      this.optimisticLike = false;
      post.isLikedByCurrentUser = false;

      this.likesService
        .unlikePost(post.postId)
        .pipe(first())
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.postUpdated.emit(post);
          },
          error: () => {
            this.isLoading = false;
            post.isLikedByCurrentUser = true;
            post.likesCount += 1;
          },
        });
    } else {
      this.optimisticLike = true;
      post.likesCount += 1;

      this.likesService
        .likePost(post.postId)
        .pipe(first())
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.optimisticLike = false;
            post.isLikedByCurrentUser = true;
            this.postUpdated.emit(post);
          },
          error: () => {
            this.isLoading = false;
            this.optimisticLike = false;
            post.likesCount -= 1;
          },
        });
    }
  }

  deletePost(post: Post): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete Post',
        message: 'Are you sure you want to delete this post?',
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
          this.isLoading = true;
          this.deletePostLoading = true;

          this.postsService.deletePost(post.postId).subscribe({
            next: () => {
              this.isLoading = false;
              this.deletePostLoading = false;
              this.post = undefined;
              this.changeDetectorRef.markForCheck();
              this.postDeleted.emit(post);
            },
            error: () => {
              this.isLoading = false;
              this.deletePostLoading = false;
              this.changeDetectorRef.markForCheck();
            },
          });
        }
      });
  }

  toggleComments(): void {
    this.commentsShown = !this.commentsShown;

    if (
      this.post?.commentsCount !== 0 &&
      this.commentsShown &&
      this.comments.length === 0
    ) {
      const cachedComments = this.cacheManager.getCache<Comment[]>(
        'comments' + this.post?.postId
      );
      if (cachedComments) {
        this.comments = cachedComments;
        this.allCommentsLoaded =
          this.comments.length === this.post?.commentsCount;
      } else {
        this.loadComments();
      }
    }
  }

  loadComments(): void {
    if (this.isLoading) {
      return;
    }
    this.commentsLoading = true;
    this.errorLoadingComments = false;

    if (this.post?.postId) {
      this.commentsService
        .getPostComments(this.post.postId, this.pageNumber, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.changeDetectorRef.markForCheck();
            this.commentsLoading = false;
            const loadedComments = response.result;
            if (loadedComments) {
              const reversedComments = loadedComments.reverse();

              this.comments = [...reversedComments, ...this.comments];
              this.cacheManager.setCache(
                'comments' + this.post?.postId,
                this.comments
              );
              this.totalComments = response.pagination?.totalItems;
              if (
                !response.pagination ||
                loadedComments.length < this.pageSize ||
                this.totalComments === this.comments.length
              ) {
                this.allCommentsLoaded = true;
              }
            }
          },
          error: () => {
            this.commentsLoading = false;
            this.errorLoadingComments = true;
          },
        });
    }
  }

  showMoreComments(): void {
    if (!this.allCommentsLoaded) {
      this.pageNumber++;
      this.loadComments();
    }
  }

  onCommentUpload(comment: { commentDto: Comment }): void {
    this.comments = [...this.comments, comment.commentDto];
    this.post!.commentsCount += 1;
    this.cacheManager.setCache('comments' + this.post?.postId, this.comments);
    this.postUpdated.emit(this.post);
    this.totalComments = this.totalComments ? this.totalComments + 1 : 1;
    if (this.totalComments === this.comments.length) {
      this.allCommentsLoaded = true;
    }
  }

  onCommentDelete(commentId: number): void {
    this.comments = this.comments.filter(
      (comment) => comment.commentId !== commentId
    );
    this.post!.commentsCount -= 1;
    this.cacheManager.setCache('comments' + this.post?.postId, this.comments);
    this.postUpdated.emit(this.post);
  }

  ngOnDestroy(): void {
    this.clickOutsideService.unbind(this);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
