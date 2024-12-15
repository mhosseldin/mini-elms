import { Injectable } from '@angular/core';
import { Client, init, PickerOptions } from 'filestack-js';

@Injectable({
  providedIn: 'root',
})
export class FilestackService {
  client: Client;
  constructor() {
    this.client = init('ALo8aO2u2RIS9jTHxAPYdz');
  }
  openPicker(config: PickerOptions) {
    return this.client.picker(config).open();
  }
  deleteFile(handle: string) {
    return this.client.remove(handle, {
      policy: 'eyJjYWxsIjpbInJlbW92ZSJdLCJleHBpcnkiOjE3MzU1OTYwMDB9',
      signature:
        'c972de1d69d3b1251d92db79c3d9fd9c2c148d82f251be1c5ef77854bff10f44',
    });
  }
}
