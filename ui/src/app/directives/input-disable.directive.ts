import {Directive, Input} from '@angular/core';
import {FormControl} from '@angular/forms';

@Directive({
    selector: '[disable-tracker]'
})
export class InputDisableDirective {
    @Input() formControl: FormControl;
    @Input() set disable(value: boolean) {
        if (!this.formControl) {
            return;
        }

        if (value) {
            this.formControl.disable();
        } else {
            this.formControl.enable();
        }
    }
}
