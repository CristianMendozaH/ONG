// src/app/services/data-refresh.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {

  // Un 'Subject' es como un canal de radio. Podemos emitir mensajes por él.
  private refreshRequired = new Subject<void>();

  // Cualquier componente puede "sintonizar" este canal para escuchar los mensajes.
  get refreshNeeded$() {
    return this.refreshRequired.asObservable();
  }

  // Usaremos esta función para "emitir" el mensaje de que algo cambió.
  notify() {
    this.refreshRequired.next();
  }
}
