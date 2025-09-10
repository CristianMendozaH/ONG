import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService, User } from './users.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  constructor(private usersSvc: UsersService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.usersSvc.list().subscribe({
      next: data => { this.users = data; this.loading = false; },
      error: err => { this.error = err?.error?.message || 'No se pudo cargar usuarios'; this.loading = false; }
    });
  }

  roleClass(role: User['role']) {
    return {
      'role-badge': true,
      'role-admin': role === 'admin',
      'role-tech': role === 'tech',
      'role-user': role === 'user',
    };
  }
}
