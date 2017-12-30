import { Component, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input()
  set isOpen(value: boolean) {
    this._isOpen = value;
    let that = this;
    if (value) {
      setTimeout(() => {
        let height = that.modalWindow.nativeElement.offsetHeight;
        that.marginTop = - height / 2 + 'px';
      }, 1);
    }
  }
  get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() title: string;
  @Input() noOverlay: boolean;
  @Input() isCall: boolean;
  @Output() public closed = new EventEmitter<void>(false);
  @ViewChild('modalWindow') private modalWindow: ElementRef;
  public marginTop: string;

  private _isOpen: boolean;

  public onClosed(): void {
    this._isOpen = false;
    this.closed.emit();
  }
}
