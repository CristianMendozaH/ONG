import { TestBed } from '@angular/core/testing';

import { DataRefresh } from './data-refresh';

describe('DataRefresh', () => {
  let service: DataRefresh;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataRefresh);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
