import React, { useEffect, useState } from 'react';
import {
  HeadlessUniversalCheckout,
  PrimerCheckoutData,
  PrimerClientSession,
  PrimerError,
  PrimerErrorHandler,
  PrimerPaymentMethodTokenData,
  PrimerResumeHandler,
  PrimerSettings,
  PrimerTokenizationHandler
} from '@primer-io/react-native';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { createClientSession, createPayment, resumePayment } from '../network/api';
import { appPaymentParameters } from '../models/IClientSessionRequestBody';
import type { IPayment } from '../models/IPayment';
import { getPaymentHandlingStringVal } from '../network/Environment';
import { ActivityIndicator } from 'react-native';

let paymentId: string | null = null;
let log: string | undefined;

export const HeadlessCheckoutScreen = (props: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = React.useState<string | undefined>(undefined);
  const [paymentMethods, setPaymentMethods] = useState<undefined | string[]>(undefined);
  const [paymentResponse, setPaymentResponse] = useState<null | string>(null);
  const [localImageUrl, setLocalImageUrl] = useState<null | string>(null);
  const [clearLogs, setClearLogs] = useState<boolean>(false);
  const [error, setError] = useState<null | any>(null);

  const updateLogs = (str: string) => {
    const currentLog = log || '';
    const combinedLog = currentLog + '\n\n' + str;
    log = combinedLog;
  }

  const getLogo = async (identifier: string) => {
    try {
      const assetUrl = await HeadlessUniversalCheckout.getAssetForPaymentMethod(
        identifier,
        'logo'
      );
      setLocalImageUrl(assetUrl);
    } catch (err) {
      updateLogs(`\n\nError:\n${JSON.stringify(err, null, 2)}`);
    }
  };

  const onHUCPrepareStart = (paymentMethod: string) => {
    updateLogs(`HUC started preparing for ${paymentMethod}`);
    setIsLoading(true);
    setLoadingMessage(`HUC started preparing payment with ${paymentMethod}`);
  };

  const onHUCPaymentMethodPresent = (paymentMethod: string) => {
    updateLogs(`HUC presented ${paymentMethod}`);
    setIsLoading(true);
    setLoadingMessage(`HUC presented ${paymentMethod}`);
  };

  const onHUCTokenizeStart = (paymentMethod: string) => {
    updateLogs(`HUC started tokenization for ${paymentMethod}`);
    setIsLoading(true);
    setLoadingMessage(`HUC started tokenizing ${paymentMethod}`);
  };

  const onHUCClientSessionSetup = (paymentMethods: string[]) => {
    updateLogs(`HUC did set up client session for payment methods ${JSON.stringify(paymentMethods)}`);
    setIsLoading(true);
    setLoadingMessage(`HUC did set up client session for payment methods ${JSON.stringify(paymentMethods)}`);
  };

  const onCheckoutComplete = (checkoutData: PrimerCheckoutData) => {
    updateLogs(`PrimerCheckoutData:\n${JSON.stringify(checkoutData)}`);
    setLoadingMessage(undefined);
    setIsLoading(false);
    props.navigation.navigate('Result', checkoutData);
  };

  const onTokenizeSuccess = async (paymentMethodTokenData: PrimerPaymentMethodTokenData, handler: PrimerTokenizationHandler) => {
    updateLogs(`onTokenizeSuccess:\n${JSON.stringify(paymentMethodTokenData, null, 2)}`);

    try {
      const payment: IPayment = await createPayment(paymentMethodTokenData.token);

      if (payment.requiredAction && payment.requiredAction.clientToken) {
        paymentId = payment.id;

        if (payment.requiredAction.name === "3DS_AUTHENTICATION") {
          updateLogs("\n\nMake sure you have used a card number that supports 3DS, otherwise the SDK will hang.")
        }
        paymentId = payment.id;
        handler.continueWithNewClientToken(payment.requiredAction.clientToken);
      } else {
        props.navigation.navigate('Result', payment);
        setIsLoading(false);
        setLoadingMessage(undefined);
      }
    } catch (err) {
      updateLogs(`\n\nError:\n${JSON.stringify(err, null, 2)}`);
      console.error(err);
      setIsLoading(false);
      setLoadingMessage(undefined);
      props.navigation.navigate('Result', err);
    }
  }

  const onResumeSuccess = async (resumeToken: string, handler: PrimerResumeHandler) => {
    updateLogs(`\n\nonResumeSuccess:\n${JSON.stringify(resumeToken)}`);

    try {
      if (paymentId) {
        const payment: IPayment = await resumePayment(paymentId, resumeToken);
        props.navigation.navigate('Result', payment);
        setIsLoading(false);
        setLoadingMessage(undefined);

      } else {
        const err = new Error("Invalid value for paymentId");
        throw err;
      }
      paymentId = null;

    } catch (err) {
      console.error(err);
      paymentId = null;
      props.navigation.navigate('Result', err);
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }

  const onError = (error: PrimerError, checkoutData: PrimerCheckoutData | null, handler: PrimerErrorHandler | undefined) => {
    updateLogs(`\n\nHUC failed with error:\n\n${JSON.stringify(error, null, 2)}\n\ncheckoutData:\n${JSON.stringify(checkoutData, null, 2)}`);
    console.error(error);
    handler?.showErrorMessage("My RN message");
    setIsLoading(false);
    setLoadingMessage(undefined);
  };

  const onBeforeClientSessionUpdate = () => {
    updateLogs(`\n\nonBeforeClientSessionUpdate`);
  };

  const onClientSessionUpdate = (clientSession: PrimerClientSession) => {
    updateLogs(`\n\nonClientSessionUpdate`);
  }

  let settings: PrimerSettings = {
    paymentHandling: getPaymentHandlingStringVal(appPaymentParameters.paymentHandling),
    paymentMethodOptions: {
      iOS: {
        urlScheme: 'merchant://primer.io'
      },
    },
    onCheckoutComplete: onCheckoutComplete,
    onTokenizeSuccess: onTokenizeSuccess,
    onResumeSuccess: onResumeSuccess,
    onHUCPrepareStart: onHUCPrepareStart,
    onHUCPaymentMethodPresent: onHUCPaymentMethodPresent,
    onHUCTokenizeStart: onHUCTokenizeStart,
    onHUCClientSessionSetup: onHUCClientSessionSetup,
    onBeforeClientSessionUpdate: onBeforeClientSessionUpdate,
    onClientSessionUpdate: onClientSessionUpdate,
    onBeforePaymentCreate: (checkoutPaymentMethodData, handler) => {
      updateLogs(`\n\nonBeforePaymentCreate`);
      handler.continuePaymentCreation();
    },
    onError: onError
  };

  if (appPaymentParameters.merchantName) {
    //@ts-ignore
    settings.paymentMethodOptions.applePayOptions = {
      merchantIdentifier: 'merchant.checkout.team',
      merchantName: appPaymentParameters.merchantName
    }
  }

  useEffect(() => {
    createClientSession()
      .then((session) => {
        setIsLoading(false);
        HeadlessUniversalCheckout.startWithClientToken(session.clientToken, settings)
          .then((response) => {
            updateLogs(`\n\nAvailable payment methods:\n${JSON.stringify(response.paymentMethodTypes, null, 2)}`);
            setPaymentMethods(response.paymentMethodTypes);
          })
          .catch((err) => {
            updateLogs(`\n\nError:\n${JSON.stringify(err, null, 2)}`);
            console.error(err);
            setError(err);
          });
      });

    // getLogo('GOOGLE_PAY')
    //   .then(() => {})
    //   .catch((err) => {});
  }, []);

  const payWithPaymentMethod = (paymentMethod: string) => {
    createClientSession()
      .then((session) => {
        setIsLoading(false);
        HeadlessUniversalCheckout.startWithClientToken(session.clientToken, settings)
          .then((response) => {
            HeadlessUniversalCheckout.showPaymentMethod(paymentMethod);
          })
          .catch((err) => {
            updateLogs(`\n\nError:\n${JSON.stringify(err, null, 2)}`);
            setError(err);
          });
      });
  };

  const renderPaymentMethods = () => {
    if (!paymentMethods) {
      return null;
    } else {
      return (
        <View>
          {paymentMethods.map((pm) => {
            return (
              <TouchableOpacity
                key={pm}
                style={{
                  marginHorizontal: 20,
                  marginVertical: 4,
                  height: 50,
                  backgroundColor: 'black',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 4,
                }}
                onPress={() => {
                  payWithPaymentMethod(pm);
                }}
              >
                <Text style={{ color: 'white' }}>{pm}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
  };

  const renderResponse = () => {
    if (!paymentResponse) {
      return null;
    } else {
      return (
        <Text style={{ color: 'black' }}>
          {JSON.stringify(paymentResponse)}
        </Text>
      );
    }
  };

  const renderTestImage = () => {
    if (!localImageUrl) {
      return null;
    } else {
      return (
        <Image
          style={{ width: 300, height: 150 }}
          source={{ uri: localImageUrl }}
        />
      );
    }
  };

  const renderError = () => {
    if (!error) {
      return null;
    } else {
      return <Text style={{ color: 'red' }}>{JSON.stringify(error)}</Text>;
    }
  };

  const renderLoadingOverlay = () => {
    if (!isLoading) {
      return null;
    } else {
      return <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        zIndex: 1000
      }}>
        <ActivityIndicator size='small' />
        <Text
          style={{
            fontSize: 14,
            color: 'black',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 24,
            marginTop: 8,
            marginBottom: 24
          }}
        >
          {loadingMessage}
        </Text>
      </View>
    }
  };

  return (
    <View style={{ paddingHorizontal: 24, flex: 1 }}>
      {renderPaymentMethods()}
      <TouchableOpacity
        key={'clear-logs'}
        style={{
          marginHorizontal: 20,
          marginVertical: 4,
          height: 50,
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 4,
        }}
        onPress={() => {
          log = undefined;
          setClearLogs(!clearLogs);
        }}
      >
        <Text style={{ color: 'black' }}>Clear Logs</Text>
      </TouchableOpacity>
      {renderTestImage()}
      {renderResponse()}
      {renderError()}
      <ScrollView 
        key={`${clearLogs}`}
        style={{ backgroundColor: 'lightgrey', marginVertical: 10, marginBottom: 40 }}
      >
        <Text>
          {log}
        </Text>
      </ScrollView>
      {renderLoadingOverlay()}
    </View>
  );
};
