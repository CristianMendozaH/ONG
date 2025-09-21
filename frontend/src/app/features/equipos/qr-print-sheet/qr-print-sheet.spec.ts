import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrPrintSheet } from './qr-print-sheet';

describe('QrPrintSheet', () => {
  let component: QrPrintSheet;
  let fixture: ComponentFixture<QrPrintSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrPrintSheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrPrintSheet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
