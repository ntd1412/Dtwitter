import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/core/services/account.service';
import {
  atLeastOneNumberValidator,
  matchValues,
  hasSpaceValidator,
  standardLettersOnlyValidator,
  standardLettersAndSpacesValidator,
  validCountryValidator,
} from 'D:/Dotnet/Dtwitter/Dtwitter/src/app/shared/validators/formValidators';
import { Observable, debounceTime, first, map, startWith } from 'rxjs';
import countries from '../../../../../assets/data/countries.json';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatDatepickerModule,
    MatAutocompleteModule,
    NgFor,
    MatOptionModule,
    NgClass,
    AsyncPipe,
  ],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup = new FormGroup({});
  minDate: Date;
  maxDate: Date;
  filteredCountries?: Observable<string[]>;
  isLoading: boolean = false;

  @Output() exitRegistration = new EventEmitter<void>();

  constructor(
    private accountService: AccountService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.minDate = new Date(1925, 0, 1);
    this.maxDate = new Date(2010, 5, 30);
  }

  ngOnInit(): void {
    this.initializeForm();

    this.filteredCountries = this.registerForm.controls[
      'country'
    ].valueChanges.pipe(
      debounceTime(100),
      startWith(''),
      map((value) => (typeof value === 'string' ? value : value.name)),
      map((name) => (name ? this.filterCountries(name) : countries.slice()))
    );
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      gender: ['male', Validators.required],

      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(10),
          standardLettersOnlyValidator(),
        ],
      ],

      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(30),
          standardLettersAndSpacesValidator(),
          hasSpaceValidator(),
        ],
      ],

      dateOfBirth: [
        '',
        [Validators.required, Validators.max(1925), Validators.min(2012)],
      ],

      country: ['', [Validators.required, validCountryValidator()]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          atLeastOneNumberValidator(),
        ],
      ],
      confirmPassword: ['', [Validators.required, matchValues('password')]],
    });

    this.registerForm.controls['password'].valueChanges.subscribe(() => {
      this.registerForm.controls['confirmPassword'].updateValueAndValidity();
    });
  }

  displayFn(country: string): string {
    return country ? country : '';
  }

  private filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return countries.filter((country) =>
      country.toLowerCase().includes(filterValue)
    );
  }

  register(): void {
    this.isLoading = true;

    const dob = this.getOnlyDate(
      this.registerForm?.controls['dateOfBirth'].value
    );
    const values = { ...this.registerForm.value, dateOfBirth: dob };

    this.accountService
      .register(values)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.accountService.setLoggedIn(true);
          this.router.navigate(['/home']);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  cancel(): void {
    this.exitRegistration.emit();
  }

  private getOnlyDate(dob: string | undefined) {
    if (!dob) return;

    let date = new Date(dob);

    return new Date(
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    )
      .toISOString()
      .slice(0, 10);
  }
}
