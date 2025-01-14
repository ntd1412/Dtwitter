import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Message } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/models/message';
import { MessagesService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/features/profile/services/message.service';
import { MessageContentComponent } from '../../components/message-content/message-content.component';
import { NgIf } from '@angular/common';
import { MessageThread } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/features/discover/models/messageThread';
import { TokenService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/token.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [NgIf, MessageContentComponent, FormsModule],
})
export class MessageComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer:
    | ElementRef
    | undefined;
  @ViewChild('messageForm') messageForm?: NgForm;
  username: string | null | undefined = null;
  messageThread: MessageThread | null = null;
  messages: Message[] = [];
  messageContent: string = '';

  constructor(
    public messagesService: MessagesService,
    private route: ActivatedRoute,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.username = this.route.parent?.snapshot.paramMap.get('username');
    const token = this.tokenService.getToken();
    if (!token || !this.username) {
      return;
    }
    this.messagesService.createHubConnection(token, this.username);
    this.messagesService.messageThread$.subscribe((messages) => {
      this.messages = messages;
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    this.messagesService.stopHubConnection();
  }

  sendMessageThroughHub(): void {
    if (!this.username) {
      return;
    }
    this.messagesService
      .sendMessageThroughHub(this.username, this.messageContent)
      .then(() => {
        this.messageForm?.reset();
        this.scrollToBottom();
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messageContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  //Not used anymore due to transition to SignalR

  // loadMessages(): void {
  //   this.username = this.route.parent?.snapshot.paramMap.get('username');
  //   if (!this.username) {
  //     return;
  //   }

  //   this.messagesService.getMessageThread(this.username).subscribe({
  //     next: (messages) => {
  //       this.messages = messages;
  //       this.scrollToBottom();
  //     },
  //   });
  // }

  // sendMessage(): void {
  //   if (!this.username) {
  //     return;
  //   }
  //   this.messagesService
  //     .sendMessage(this.username, this.messageContent)
  //     .subscribe({
  //       next: (message) => {
  //         this.messages = [...this.messages, message];
  //         this.messageForm?.reset();
  //         this.scrollToBottom();
  //       },
  //     });
  // }
}
