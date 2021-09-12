import { NativeModules } from 'react-native';
import type { PaymentInstrumentToken } from './models/payment-instrument-token';
import type { IPrimer } from './models/primer';
import type {
  OnDismissCallback,
  OnPrimerErrorCallback,
  OnSavedPaymentInstrumentsFetchedCallback,
  OnTokenAddedToVaultCallback,
  OnTokenizeSuccessCallback,
} from './models/primer-callbacks';
import type { PrimerConfig } from './models/primer-config';
import type { PrimerError } from './models/primer-error';
import type {
  IPrimerIntent,
  ISinglePrimerPaymentMethodIntent,
} from './models/primer-intent';
import type { IPrimerResumeRequest } from './models/primer-request';
import type { PrimerSettings } from './models/primer-settings';
import type { IPrimerTheme } from './models/primer-theme';
import { parseCallback } from './utils';

const { PrimerRN: NativeModule } = NativeModules;

export const PrimerNativeMapping: IPrimer = {
  showUniversalCheckout(token: String, config: PrimerConfig): void {
    configureIntent({ vault: false, paymentMethod: 'Any' });
    configure(config);
    NativeModule.initialize(token);
  },

  showVaultManager(token: String, config: PrimerConfig): void {
    configureIntent({ vault: true, paymentMethod: 'Any' });
    configure(config);
    NativeModule.initialize(token);
  },

  showSinglePaymentMethod(
    token: String,
    intent: ISinglePrimerPaymentMethodIntent,
    config: PrimerConfig
  ): void {
    configureIntent(intent);
    configure(config);
    NativeModule.initialize(token);
  },

  fetchSavedPaymentInstruments(token: String, config: PrimerConfig): void {
    configure(config);
    NativeModule.fetchSavedPaymentInstruments(token);
  },

  dispose(): void {
    NativeModule.dispose();
  },
};

function configure(config: PrimerConfig): void {
  configureTheme(config.theme);
  configureSettings(config.settings);
  configureOnVaultSuccess(config.onTokenAddedToVault);
  configureOnDismiss(config.onDismiss);
  configureOnError(config.onError);
  configureOnTokenizeSuccess(config.onTokenizeSuccess);
  configureOnSavedPaymentInstrumentsFetched(
    config.onSavedPaymentInstrumentsFetched
  );
}

function configureSettings(settings: PrimerSettings = {}): void {
  const data = JSON.stringify(settings);
  NativeModule.configureSettings(data);
}

function configureTheme(theme: IPrimerTheme = {}): void {
  const data = JSON.stringify(theme);
  NativeModule.configureTheme(data);
}

function configureIntent(
  intent: IPrimerIntent = { vault: false, paymentMethod: 'Any' }
): void {
  const data = JSON.stringify(intent);
  NativeModule.configureIntent(data);
}

function resume(request: IPrimerResumeRequest) {
  const data = JSON.stringify(request);
  NativeModule.resume(data);
}

function configureOnTokenizeSuccess(
  callback: OnTokenizeSuccessCallback = (_) =>
    new Promise<IPrimerResumeRequest>((resolve, __) =>
      resolve({ intent: 'showSuccess' })
    )
) {
  NativeModule.configureOnTokenizeSuccess((data: any) => {
    try {
      const parsedData = JSON.parse(data) as PaymentInstrumentToken;
      callback(parsedData).then((r) => resume(r));
    } catch (e) {
      console.log('failed to parse json', e);
    }
  });
}

function configureOnVaultSuccess(
  callback: OnTokenAddedToVaultCallback = (_) => {}
) {
  NativeModule.configureOnVaultSuccess((data: any) => {
    parseCallback<PaymentInstrumentToken>(data, callback);
  });
}

function configureOnDismiss(callback: OnDismissCallback = () => {}) {
  NativeModule.configureOnDismiss((_: any) => callback());
}

function configureOnError(callback: OnPrimerErrorCallback = (_) => {}) {
  NativeModule.configureOnPrimerError((data: any) => {
    parseCallback<PrimerError>(data, callback);
  });
}

function configureOnSavedPaymentInstrumentsFetched(
  callback: OnSavedPaymentInstrumentsFetchedCallback = (_) => {}
) {
  NativeModule.configureOnSavedPaymentInstrumentsFetched((data: any) => {
    parseCallback<PaymentInstrumentToken[]>(data, callback);
  });
}
