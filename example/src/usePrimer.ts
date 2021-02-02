import { useEffect, useState } from 'react';
import {
  UniversalCheckout,
  PaymentMethod,
  UXMode,
} from '@primer-io/react-native';
import type { PaymentMethodConfig } from 'src/types';

interface UsePrimerOptions {
  clientToken: string;
  paymentMethods: PaymentMethodConfig[];
  uxMode?: UXMode;
  currency?: string;
  amount?: number;
}

export function usePrimer({
  clientToken,
  uxMode = UXMode.CHECKOUT,
  amount,
  currency,
}: UsePrimerOptions) {
  const [token] = useState<string | null>(null);

  const onEvent = (e: unknown) => {
    console.log(e);
  };

  const showCheckout = () => {
    UniversalCheckout.show();
  };

  useEffect(() => {
    UniversalCheckout.initialize({
      clientToken,
      paymentMethods: [PaymentMethod.Card()],
      onEvent,
      uxMode,
      amount,
      currency,
      theme: {
        backgroundColor: '#ff0000',
        buttonCornerRadius: 2.0,
        buttonDefaultColor: '#00ff00',
        android: {
          windowMode: 'FULL_SCREEN',
        },
      },
    });

    return () => {
      UniversalCheckout.destroy();
    };
  });

  return {
    showCheckout,
    token,
  };
}
