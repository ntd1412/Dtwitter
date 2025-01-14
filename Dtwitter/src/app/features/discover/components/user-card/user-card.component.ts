import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PresenceService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/presence.service';
import { FirstWordPipe } from '../../../../shared/pipes/first-word.pipe';
import { RelativeUrlPipe } from '../../../../shared/pipes/relative-url.pipe';
import { RouterLink } from '@angular/router';
import { NgClass, NgOptimizedImage, AsyncPipe } from '@angular/common';
import { User } from '../../models/discoverUser';

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    NgOptimizedImage,
    RelativeUrlPipe,
    AsyncPipe,
    FirstWordPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  @Input() user: User | undefined;

  isHovered: boolean = false;

  onHover(hovering: boolean): void {
    this.isHovered = hovering;
  }

  constructor(public presenceService: PresenceService) {}
}
