import React, { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  NativeEventEmitter,
  NativeModules,
  View,
  FlatList,
  Image,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { RedirectManager } from '@primer-io/react-native';
import TextField from '../components/TextField';

const redirectManager = new RedirectManager();

interface IBank {
  id: string;
  name: string;
  iconUrl: string;
  iconUrlStr: string
}

const HeadlessCheckoutWithRedirect = (props: any) => {
  //@ts-ignore
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>('');
  const [banks, setBanks] = useState<any>([]);
  const [search, setSearch] = useState<any>('');

  useEffect(() => {
    initialize();
  }, []);

  const handleGoBack = () => {
    props.navigation.goBack();
  };

  const initialize = async () => {
    await redirectManager.configure({
      paymentMethodType: props.route.params.paymentMethodType,
      //@ts-ignore
      onRetrieving: data => {
        const log = `\nonRetrieved: ${JSON.stringify(data)}\n`;
        console.log(log);
        setIsLoading(true);
      },
      //@ts-ignore
      onRetrieved: data => {
        const log = `\nonRetrieved: ${JSON.stringify(data)}\n`;
        console.log(log);
        setBanks(data);
        setIsLoading(false);
      },
      //@ts-ignore
      onValid: data => {
        const log = `\nonValid: ${JSON.stringify(data)}\n`;
        console.log(log);
        setIsLoading(false);
        setIsValidating(null);
        if (data?.id) {
          onSubmit()
        }
        // handleGoBack();
      },
      //@ts-ignore
      onInvalid: data => {
        const log = `\nonInvalid: ${JSON.stringify(data)}\n`;
        console.log(log);
        setIsLoading(false);
        setIsValidating(null);
      },
      //@ts-ignore
      onError: data => {
        const log = `\nonError: ${JSON.stringify(data)}\n`;
        console.log(log);
        setIsLoading(false);
        setIsValidating(null);
      },
    });
  };

  const onSubmit = async () => {
    try {
      await redirectManager.submit();
    } catch (err) {
      console.error(err);
    }
  };

  const pay = async (id: string) => {
    try {
      setIsValidating(id);
      await redirectManager.onBankSelected(id);
    } catch (err) {
      setIsValidating(null);
      console.error(err);
    }
  };

  const renderLoadingOverlay = () => {
    if (!isLoading) {
      return null;
    } else {
      return (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(200, 200, 200, 0.5)',
            zIndex: 1000,
          }}>
          <ActivityIndicator size="small" />
        </View>
      );
    }
  };

  const Bank = ({ item }: { item: IBank }) => (
    <TouchableOpacity
      key={item.id}
      testID={`button-${item.name
        .toLowerCase()
        .replace(' ', '-')}`}
      disabled={!!isValidating}
      onPress={() => {
        pay(item.id);
      }}
      style={{
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#f5f5f5',
        opacity: isValidating && isValidating !== item.id ? 0.8 : 1,
      }}>
      <Image source={{ uri: item.iconUrl ?? item.iconUrlStr }} style={{ width: 30, height: 30 }} />

      <Text style={{ paddingLeft: 10 }}>{item.name}</Text>

      {item.id === isValidating && (
        <ActivityIndicator
          style={{ position: 'absolute', right: 10 }}
          size="small"
        />
      )}
    </TouchableOpacity>
  );

  const renderBanks = () => {
    // return (
    //   <FlatList
    //     data={banks}
    //     renderItem={({ item }) => <Bank item={item} />}
    //     keyExtractor={item => item.id}
    //   />
    // );

    if (banks.length != 0) {
      return banks.map((bank: IBank) => {

        return <Bank key={bank.id} item={bank} />
      })
    }
  };

  const searchBanks = async (value: string) => {
    setSearch(value);

    try {
      await redirectManager.onBankFilterChange(value);
    } catch (err) {
      console.error(err);
    }
  };

  const renderSearch = () => {
    return (
      <TextField
        title="Choose your bank"
        textInputStyle={{
          backgroundColor: '#f5f5f5',
          borderColor: '#f5f5f5',
          paddingHorizontal: 10,
        }}
        style={{
          padding: 5,
          marginVertical: 10,
          borderRadius: 5,
          marginHorizontal: 5,
        }}
        placeholder="Search Banks"
        value={search}
        onChangeText={text => {
          searchBanks(text);
        }}
      />
    );
  };

  return (
    <View
      style={{
        paddingHorizontal: 5,
        flex: 1,
        backgroundColor: 'white',
      }}>
      {renderSearch()}
      {renderBanks()}
      {renderLoadingOverlay()}
    </View>
  );
};

export default HeadlessCheckoutWithRedirect;
