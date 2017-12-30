import { OnDestroy } from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

export class BaseComponent implements OnDestroy {
    private subscriptions: Subscription[] = [];

    protected register(subscription: Subscription): Subscription {
        this.subscriptions.push(subscription);
        return subscription;
    }

    protected clear(): void {
        this.subscriptions.forEach(x => x.unsubscribe());
        this.subscriptions = [];
    }

    public ngOnDestroy(): void {
        this.clear();
    }
}
