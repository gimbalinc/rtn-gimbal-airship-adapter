import { EmitterSubscription, NativeModules } from 'react-native';
import EventEmitter from './EventEmitter';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

export enum RegionEventType {
  /**
   * Region enter.
   */
  Enter = 'regionEnter',

  /**
   * Region exit.
   */
  Exit = 'regionExit',
}

/**
 * Gimbal consent types.
 */
export enum ConsentType {
  /**
   * Indicates a choice for consent to Place Monitoring functionality
   */
  Places = 'places',
}

/**
 * Gimbal consent state.
 */
export enum ConsentState {
  /**
   * Unknown. Typically because the user has not yet been asked for consent.
   */
  Unknown = 'unknown',

  /**
   * Consent has been granted by the user.
   */
  Granted = 'granted',

  /**
   * Consent has been refused by the user
   */
  Refused = 'refused',
}

/**
 * GDPR consent requirement.
 */
export enum ConsentRequirement {
  /**
   * GDPR user consent status is not yet known - The Gimbal SDK has not yet been able to contact its server
   */
  Unknown = 'unknown',

  /**
   * GDPR user consent is required at this location
   */
  NotRequired = 'notRequired',

  /**
   * GDPR user consent is not required at this location - it may be required at a different location
   */
  Required = 'required',
}

/**
 * A Gimbal place.
 */
export interface Place {
  /**
   * The place's ID.
   */
  identifier: string;

  /**
   * The place's name.
   */
  name: string;

  /**
   * The place's attributes.
   */
  attribute: object;
}

/**
 * An event fired when a region is entered or exited.
 */
export interface RegionEvent {
  /**
   * The visit ID.
   */
  identifier: string;

  /**
   * Dwell time in seconds.
   */
  dwellTime: number;

  /**
   * The arrival time as an ISO 8601 timestamp.
   */
  arrivalTime: string;

  /**
   * The departure time aas an ISO 8601 timestamp.
   */
  departureTime?: string;

  /**
   * The place.
   */
  place: Place;
}

/**
 * @hidden
 */
function convertEventEnum(eventType: RegionEventType): string {
  if (eventType === RegionEventType.Enter) {
    return 'com.urbanairship.gimbal.region_enter';
  } else if (eventType === RegionEventType.Exit) {
    return 'com.urbanairship.gimbal.region_exit';
  }
  throw new Error('Invalid event type: ' + eventType);
}
const GimbalAirshipAdapterModule = isTurboModuleEnabled
  ? require('./NativeGimbalAirshipAdapterModule').default
  : NativeModules.RtnGimbalAirshipAdapter;

const eventEmitter = new EventEmitter();

import type { Spec as GimbalAirshipAdapterSpec } from './GimbalAirshipAdapter';

/**
 * Airship Gimbal Adapter.
 */
export const GimbalAirshipAdapter: GimbalAirshipAdapterSpec = {
  /**
   * Sets the Gimbal API key.
   * @param apiKey The Gimbal API key.
   */
  setGimbalApiKey(apiKey: string) {
    return GimbalAirshipAdapterModule.setGimbalApiKey(apiKey);
  },

  /**
   * Starts the adapter.
   * @return A promise with the result.
   */
  start(): Promise<boolean> {
    return GimbalAirshipAdapterModule.start();
  },

  /**
   * Stops the Gimbal Adapter.
   */
  stop() {
    GimbalAirshipAdapterModule.stop();
  },

  /**
   * Checks if the adapter is started.
   * @return A promise with the result.
   */
  isStarted(): Promise<boolean> {
    return GimbalAirshipAdapterModule.isStarted();
  },

  /**
   * Checks if GDPR consent is required to use Gimbal.
   * @return A promise with the result.
   */
  getGdprConsentRequirement(): Promise<ConsentRequirement> {
    return GimbalAirshipAdapterModule.getGdprConsentRequirement();
  },

  /**
   * Sets the GDPR consent result for the consent type.
   * @param consentType The consent type.
   * @param consentState The consent state.
   */
  setUserConsent(consentType: ConsentType, consentState: ConsentState) {
    GimbalAirshipAdapterModule.setUserConsent(consentType, consentState);
  },

  /**
   * Gets the GDPR consent for the consent type.
   * @param consentType The consent type.
   * @return A promise with the result.
   */
  getUserConsent(consentType: ConsentType): Promise<ConsentState> {
    return GimbalAirshipAdapterModule.getUserConsent(consentType);
  },

  /**
   * Adds a listener for an Airship Gimbal event.
   *
   * @param eventType The event type. Either regionEnter or regionExit.
   * @param listener The event listener.
   * @return An emitter subscription.
   */
  addListener(
    eventType: RegionEventType,
    listener: (event: RegionEvent) => void
  ): EmitterSubscription {
    var name = convertEventEnum(eventType);
    return eventEmitter.addListener(name, listener);
  },

  /**
   * Removes a listener for an Airship Gimbal event.
   *
   * @param eventType The event type. Either regionEnter or regionExit.
   * @param listener The event listener.
   */
  removeListeners(eventType: RegionEventType) {
    var name = convertEventEnum(eventType);
    eventEmitter.removeAllListeners(name);
  },
};
