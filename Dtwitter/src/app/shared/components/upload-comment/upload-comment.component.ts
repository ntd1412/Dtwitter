import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Avatar } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/avatar';
import { AvatarService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/avatar.service';
import { CommentsService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/services/comments.service';
import { NgIf } from '@angular/common';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { first } from 'rxjs';

@Component({
  selector: 'app-upload-comment',
  templateUrl: './upload-comment.component.html',
  styleUrls: ['./upload-comment.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, UserAvatarComponent, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadCommentComponent implements OnInit {
  @Output() commentUploaded: EventEmitter<any> = new EventEmitter();

  @Input() postId: number | undefined;

  uploadCommentForm: FormGroup = new FormGroup({});
  avatar!: Avatar;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private commentsService: CommentsService,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.avatar = this.avatarService.getAvatarDetails();
  }

  initializeForm() {
    this.uploadCommentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(400)]],
    });
  }

  onSubmit() {
    if (this.uploadCommentForm.valid && this.postId) {
      const commentContent = this.uploadCommentForm.get('content')?.value;
      this.uploadCommentForm.reset();
      const commentUploadDto = {
        postId: this.postId,
        content: commentContent,
      };
      this.isLoading = true;
      this.commentsService
        .uploadComment(commentUploadDto)
        .pipe(first())
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.commentUploaded.emit(response);
          },
          error: () => (this.isLoading = false),
        });
    }
  }
}
