import { ModuleBase, SharedEventEmitter, utils } from 'expo-firebase-app';
import invariant from 'invariant';
import AndroidAction from './AndroidAction';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import AndroidNotifications from './AndroidNotifications';
import AndroidRemoteInput from './AndroidRemoteInput';
import IOSNotifications from './IOSNotifications';
import Notification from './Notification';
import { BadgeIconType, Category, Defaults, GroupAlert, Importance, Priority, SemanticAction, Visibility, } from './types';
const { isFunction, isObject } = utils;
const NATIVE_EVENTS = {
    notificationDisplayed: 'Expo.Firebase.notifications_notification_displayed',
    notificationOpened: 'Expo.Firebase.notifications_notification_opened',
    notificationReceived: 'Expo.Firebase.notifications_notification_received',
};
export const MODULE_NAME = 'ExpoFirebaseNotifications';
export const NAMESPACE = 'notifications';
export const statics = {
    Android: {
        Action: AndroidAction,
        BadgeIconType,
        Category,
        Channel: AndroidChannel,
        ChannelGroup: AndroidChannelGroup,
        Defaults,
        GroupAlert,
        Importance,
        Priority,
        RemoteInput: AndroidRemoteInput,
        SemanticAction,
        Visibility,
    },
    Notification,
};
// iOS 8/9 scheduling
// fireDate: Date;
// timeZone: TimeZone;
// repeatInterval: NSCalendar.Unit;
// repeatCalendar: Calendar;
// region: CLRegion;
// regionTriggersOnce: boolean;
// iOS 10 scheduling
// TODO
// Android scheduling
// TODO
/**
 * @class Notifications
 */
export default class Notifications extends ModuleBase {
    constructor(app) {
        super(app, {
            events: Object.values(NATIVE_EVENTS),
            hasCustomUrlSupport: false,
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            namespace: NAMESPACE,
        });
        this._android = new AndroidNotifications(this);
        this._ios = new IOSNotifications(this);
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onNotificationDisplayed
        NATIVE_EVENTS.notificationDisplayed, (notification) => {
            SharedEventEmitter.emit('onNotificationDisplayed', new Notification(notification, this));
        });
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onNotificationOpened
        NATIVE_EVENTS.notificationOpened, (notificationOpen) => {
            SharedEventEmitter.emit('onNotificationOpened', {
                action: notificationOpen.action,
                notification: new Notification(notificationOpen.notification, this),
                results: notificationOpen.results,
            });
        });
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onNotification
        NATIVE_EVENTS.notificationReceived, (notification) => {
            SharedEventEmitter.emit('onNotification', new Notification(notification, this));
        });
        // Tell the native module that we're ready to receive events
        if (this.nativeModule.jsInitialised) {
            this.nativeModule.jsInitialised();
        }
    }
    get android() {
        return this._android;
    }
    get ios() {
        return this._ios;
    }
    /**
     * Cancel all notifications
     */
    cancelAllNotifications() {
        return this.nativeModule.cancelAllNotifications();
    }
    /**
     * Cancel a notification by id.
     * @param notificationId
     */
    cancelNotification(notificationId) {
        invariant(notificationId, 'Notifications: cancelNotification expects a `notificationId`');
        return this.nativeModule.cancelNotification(notificationId);
    }
    /**
     * Display a notification
     * @param notification
     * @returns {*}
     */
    displayNotification(notification) {
        invariant(notification instanceof Notification, `Notifications:displayNotification expects a 'Notification' but got type ${typeof notification}`);
        try {
            return this.nativeModule.displayNotification(notification.build());
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    getBadge() {
        return this.nativeModule.getBadge();
    }
    getInitialNotification() {
        return this.nativeModule
            .getInitialNotification()
            .then((notificationOpen) => {
            if (notificationOpen) {
                return {
                    action: notificationOpen.action,
                    notification: new Notification(notificationOpen.notification, this),
                    results: notificationOpen.results,
                };
            }
            return null;
        });
    }
    /**
     * Returns an array of all scheduled notifications
     * @returns {Promise.<Array>}
     */
    getScheduledNotifications() {
        return this.nativeModule.getScheduledNotifications();
    }
    onNotification(nextOrObserver) {
        let listener;
        if (isFunction(nextOrObserver)) {
            listener = nextOrObserver;
        }
        else if (isObject(nextOrObserver) &&
            nextOrObserver.next &&
            typeof nextOrObserver.next === 'function') {
            listener = nextOrObserver.next;
        }
        else {
            throw new Error('Notifications.onNotification failed: First argument must be a function or observer object with a `next` function.');
        }
        this.logger.info('Creating onNotification listener');
        SharedEventEmitter.addListener('onNotification', listener);
        return () => {
            this.logger.info('Removing onNotification listener');
            SharedEventEmitter.removeListener('onNotification', listener);
        };
    }
    onNotificationDisplayed(nextOrObserver) {
        let listener;
        if (isFunction(nextOrObserver)) {
            listener = nextOrObserver;
        }
        else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
            listener = nextOrObserver.next;
        }
        else {
            throw new Error('Notifications.onNotificationDisplayed failed: First argument must be a function or observer object with a `next` function.');
        }
        this.logger.info('Creating onNotificationDisplayed listener');
        SharedEventEmitter.addListener('onNotificationDisplayed', listener);
        return () => {
            this.logger.info('Removing onNotificationDisplayed listener');
            SharedEventEmitter.removeListener('onNotificationDisplayed', listener);
        };
    }
    onNotificationOpened(nextOrObserver) {
        let listener;
        if (isFunction(nextOrObserver)) {
            listener = nextOrObserver;
        }
        else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
            listener = nextOrObserver.next;
        }
        else {
            throw new Error('Notifications.onNotificationOpened failed: First argument must be a function or observer object with a `next` function.');
        }
        this.logger.info('Creating onNotificationOpened listener');
        SharedEventEmitter.addListener('onNotificationOpened', listener);
        return () => {
            this.logger.info('Removing onNotificationOpened listener');
            SharedEventEmitter.removeListener('onNotificationOpened', listener);
        };
    }
    /**
     * Remove all delivered notifications.
     */
    removeAllDeliveredNotifications() {
        return this.nativeModule.removeAllDeliveredNotifications();
    }
    /**
     * Remove a delivered notification.
     * @param notificationId
     */
    removeDeliveredNotification(notificationId) {
        invariant(notificationId, 'Notifications: removeDeliveredNotification expects a `notificationId`');
        return this.nativeModule.removeDeliveredNotification(notificationId);
    }
    /**
     * Schedule a notification
     * @param notification
     * @returns {*}
     */
    scheduleNotification(notification, schedule) {
        invariant(notification instanceof Notification, `Notifications:scheduleNotification expects a 'Notification' but got type ${typeof notification}`);
        try {
            const nativeNotification = notification.build();
            nativeNotification.schedule = schedule;
            return this.nativeModule.scheduleNotification(nativeNotification);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    setBadge(badge) {
        return this.nativeModule.setBadge(badge);
    }
}
Notifications.moduleName = MODULE_NAME;
Notifications.namespace = NAMESPACE;
Notifications.statics = statics;
export { AndroidAction, AndroidChannel, AndroidChannelGroup, AndroidNotifications, AndroidRemoteInput, Notification, };
//# sourceMappingURL=index.js.map