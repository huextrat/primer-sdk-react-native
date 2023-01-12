import React, { useEffect, useState } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import {
    InputElementType,
    RawDataManager,
    BancontactCardRedirectData
} from '@primer-io/react-native';
import TextField from '../components/TextField';
import { styles } from '../styles';
import type { RawDataScreenProps } from '../models/RawDataScreenProps';

export interface RawCardDataScreenProps {
    navigation: any;
    clientSession: any;
}

const rawDataManager = new RawDataManager();

const RawAdyenBancontactCardScreen = (props: any) => {

    const [isLoading, setIsLoading] = useState(false);
    const [isCardFormValid, setIsCardFormValid] = useState(false);
    const [requiredInputElementTypes, setRequiredInputElementTypes] = useState<string[] | undefined>(undefined);
    const [cardNumber, setCardNumber] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState<string>("");
    const [cardholderName, setCardholderName] = useState<string | undefined>("");
    const [metadataLog, setMetadataLog] = useState<string>("");
    const [validationLog, setValidationLog] = useState<string>("");

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        await rawDataManager.configure({
            paymentMethodType: props.route.params.paymentMethodType,
            onMetadataChange: (data => {
                const log = `\nonMetadataChange: ${JSON.stringify(data)}\n`;
                console.log(log);
                setMetadataLog(log);
            }),
            onValidation: ((isVallid, errors) => {
                let log = `\nonValidation:\nisValid: ${isVallid}\n`;

                if (errors) {
                    log += `errors:${JSON.stringify(errors, null, 2)}\n`;
                }

                console.log(log);
                setValidationLog(log);
                setIsCardFormValid(isVallid);
            })
        })
        const requiredInputElementTypes = await rawDataManager.getRequiredInputElementTypes();
        setRequiredInputElementTypes(requiredInputElementTypes);
    }

    const setRawData = (
        tmpCardNumber: string | null,
        tmpExpiryDate: string | null,
        tmpCardholderName: string | null
    ) => {
        let rawData: BancontactCardRedirectData = {
            cardNumber: cardNumber || "",
            expiryDate: expiryDate || "",
            cardholderName: cardholderName || ""
        }

        if (tmpCardNumber) {
            rawData.cardNumber = tmpCardNumber;
        }

        if (tmpExpiryDate) {
            rawData.expiryDate = tmpExpiryDate;
        }

        if (tmpCardholderName) {
            rawData.cardholderName = tmpCardholderName;
        }

        rawDataManager.setRawData(rawData);
    }

    const renderInputs = () => {
        if (!requiredInputElementTypes) {
            return null;
        } else {
            return (
                <View>
                    {
                        requiredInputElementTypes.map(et => {
                            if (et === InputElementType.CARD_NUMBER) {
                                return (
                                    <TextField
                                        key={"CARD_NUMBER"}
                                        style={{ marginVertical: 8 }}
                                        title='Card Number'
                                        value={cardNumber}
                                        keyboardType={"numeric"}
                                        onChangeText={(text) => {
                                            setCardNumber(text);
                                            setRawData(text, null, null);
                                        }}
                                    />
                                );
                            } else if (et === InputElementType.EXPIRY_DATE) {
                                return (
                                    <TextField
                                        key={"EXPIRY_DATE"}
                                        style={{ marginVertical: 8 }}
                                        title='Expiry Date'
                                        value={expiryDate}
                                        keyboardType={"default"}
                                        onChangeText={(text) => {
                                            setExpiryDate(text);
                                            setRawData(null, text, null);
                                        }}
                                    />
                                );
                            } else if (et === InputElementType.CARDHOLDER_NAME) {
                                return (
                                    <TextField
                                        key={"CARDHOLDER_NAME"}
                                        style={{ marginVertical: 8 }}
                                        title='Cardholder Name'
                                        value={cardholderName}
                                        keyboardType={"default"}
                                        onChangeText={(text) => {
                                            setCardholderName(text);
                                            setRawData(null, null, text)
                                        }}
                                    />
                                );
                            }
                        })
                    }
                </View>
            );
        }
    }

    const pay = async () => {
        try {
            await rawDataManager.submit();

        } catch (err) {
            console.error(err);
        }
    }

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
            </View>
        }
    };

    const renderPayButton = () => {
        return (
            <TouchableOpacity
                style={{
                    ...styles.button,
                    marginVertical: 16,
                    backgroundColor: isCardFormValid ? 'black' : "lightgray"
                }}
                onPress={e => {
                    if (isCardFormValid) {
                        pay();
                    }
                }}
            >
                <Text
                    style={{ ...styles.buttonText, color: 'white' }}
                >
                    Pay
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEvents = () => {
        return (
            <ScrollView>
                <View style={{ backgroundColor: "lightgray" }}>
                    <Text 
                        style={{ height: 50 }}
                        testID="headless-metadata-event"
                    >
                        {metadataLog}
                    </Text>
                </View>
                <View style={{ backgroundColor: "lightgray", marginTop: 16 }}>
                    <Text
                        testID="headless-validation-event"
                    >
                        {validationLog}
                    </Text>
                </View>
            </ScrollView>
        )
    }

    return (
        <View style={{ paddingHorizontal: 24, flex: 1 }}>
            {renderInputs()}
            {renderPayButton()}
            {renderEvents()}
            {renderLoadingOverlay()}
        </View>
    );
};

export default RawAdyenBancontactCardScreen;
