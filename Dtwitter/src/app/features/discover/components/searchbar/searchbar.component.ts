import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchUser } from 'D:/Dotnet/Dtwitter/Dtwitter/src//app/shared/models/users';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { RouterLink } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { UserSearchService } from 'D:/Dotnet/Dtwitter/Dtwitter/src//app/shared/services/user-search.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
  standalone: true,
  imports: [
    MatInputModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatOptionModule,
    RouterLink,
    UserAvatarComponent,
  ],
})
export class SearchbarComponent implements OnInit {
  @Output() filter = new EventEmitter<void>();

  searchUsers: SearchUser[] = [];
  filteredUsers: SearchUser[] = [];
  searchControl = new FormControl();

  constructor(private userSearchService: UserSearchService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe((val) => {
      this.filterUsers(val);
    });

    this.loadSearchUsers();
  }

  filterUsers(val: string) {
    if (!val) {
      this.filteredUsers = this.searchUsers;
    } else {
      this.filteredUsers = this.searchUsers.filter((user) =>
        user.fullName.toLowerCase().includes(val.toLowerCase())
      );
    }
  }

  loadSearchUsers() {
    this.userSearchService
      .getSearchUsers()
      .pipe(first())
      .subscribe({
        next: (response) => {
          if (response) {
            this.searchUsers = response;
          }
        },
      });
  }

  toggleFilter(): void {
    this.filter.emit();
  }
}
