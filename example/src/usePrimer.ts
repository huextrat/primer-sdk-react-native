import { useEffect, useState } from 'react';
import { Primer } from '@primer-io/react-native';
import { fetchClientToken } from './fetch-client-token';
import type { PrimerSettings } from 'src/models/primer-settings';
// import type { IPrimerTheme } from 'src/models/primer-theme';
import type { PaymentInstrumentToken } from 'src/models/payment-instrument-token';
import type { OnTokenizeSuccessCallback } from 'src/models/primer-callbacks';
import type { ISinglePrimerPaymentMethodIntent } from 'src/models/primer-intent';

// const theme: IPrimerTheme = {
//   colors: {
//     background: {
//       red: 255,
//       green: 100,
//       blue: 100,
//       alpha: 255,
//     },
//   },
// };

export function usePrimer() {
  const [token, setToken] = useState<String | null>(null);
  const [
    paymentInstrument,
    setPaymentInstrument,
  ] = useState<PaymentInstrumentToken | null>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientToken().then((t) => {
      setToken(t);
      setLoading(false);
    });

    return () => {};
  }, []);

  const presentPrimer = () => {
    if (!token) return;

    const settings: PrimerSettings = {
      order: {
        amount: 8000,
        currency: 'GBP',
        countryCode: 'GB',
        items: [],
      },
      customer: {
        lastName: 'Eriksson',
        firstName: 'Carl',
        billing: {
          city: 'Paris',
          country: 'FR',
          line1: '1 Rue de Rivoli',
          postalCode: '75001',
          state: 'Paris',
        },
      },
      business: {
        name: 'Primer Ltd.',
        address: {
          line1: '1 Street',
          postalCode: 'EC3',
          city: 'London',
          country: 'GB',
        },
      },
      options: {
        isResultScreenEnabled: false,
        isLoadingScreenEnabled: false,
        isFullScreenEnabled: true,
        locale: 'sv-SE',
        ios: {
          merchantIdentifier: '',
        },
      },
    };

    const onTokenizeSuccess: OnTokenizeSuccessCallback = async (e) => {
      setPaymentInstrument(e);
      return { intent: 'showSuccess' };
    };

    const config = { settings, onTokenizeSuccess };
    const intent: ISinglePrimerPaymentMethodIntent = {
      vault: false,
      paymentMethod: 'Card',
    };

    Primer.showSinglePaymentMethod(token, intent, config);
  };

  return {
    presentPrimer,
    loading,
    paymentInstrument,
  };
}
