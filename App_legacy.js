import React, {useEffect, useState} from 'react';
import {NativeEventEmitter, PermissionsAndroid, Platform} from 'react-native';
import {Provider, useDispatch} from 'react-redux';
import {store} from './redux/store';
import RootNavigator from './navigation/RootNavigator';
import {updateSdkStatus, updateUserData} from "./redux/actions";
import {statusToData} from "./converters/SdkStatusConverter";
import Config from "react-native-config";
import axios from "axios";
import RNSentiance from "@react-native-sentiance/legacy";

const APP_ID = Config.APP_ID;
const APP_SECRET = Config.APP_SECRET;
const rnSentianceEmitter = new NativeEventEmitter(RNSentiance);
const ACTIVITY_RECOGNITION = 'android.permission.ACTIVITY_RECOGNITION';

const AppWrapper = () => {
    return (
        <Provider store={store}>
            <App/>
        </Provider>
    )
}

const App = () => {
    const [userLinkingSub, setUserLinkingSub] = useState(undefined);
    const [sdkStatusSub, setSdkStatusSub] = useState(undefined);
    const [userContextUpdateSub, setUserContextUpdateSub] = useState(undefined);
    const [sdkUserActivityUpdateSub, setSdkUserActivityUpdateSub] = useState(undefined);
    const [sdkDetectionsEnabledSub, setSdkDetectionsEnabledSub] = useState(undefined);

    useEffect(() => {
        async function init() {
            try {
                subscribeToSDKEvents();
                await requestAndroidPermissions();
                await bootstrapSDK();
            } catch (e) {
                console.error(e.code, e);
            }
        }

        init();
    }, []);

    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            unSubscribe();
        }
    }, []);

    const unSubscribe = () => {
        userLinkingSub.remove();
        sdkStatusSub.remove();
        userContextUpdateSub.remove();
        sdkUserActivityUpdateSub.remove();
        sdkDetectionsEnabledSub.remove();
    }

    /**
     * The user-linking logics are required to be implemented in your backend.
     * 1. Sending the installId to your backend.
     * 2. Calling the Sentiance API with the installId and the externalId in your backend.
     * 3. Responding the result.
     * If the backend responds successful, call RNSentiance.userLinkCallback(true);. Otherwise, RNSentiance.userLinkCallback(false);
     * SDK will not be initialized if linking is failed.
     */
    const linkUser = async (installId) => {
        try {
            const response = await axios.post(`https://preprod-api.sentiance.com/v2/users/${installId}/link`,
                {"external_id": "87979"},
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer f729832f-e229-412c-a9dd-ac2b45e0c431.ef5ee3a8751bf39037891eb0832b0f57b16b4460a19f7d7f16aa6d849ad6d7d1e679d40133962d942944bc0ad380612e1f4a6f8a49d27f02ca79304d571dd352"
                    }
                });
            RNSentiance.userLinkCallback(true);
            console.log('linking success');
            return true;
        } catch (e) {
            RNSentiance.userLinkCallback(false);
            console.log('linking failed');
            return false;
        }
    }

    const subscribeToSDKEvents = () => {
        setUserLinkingSub(rnSentianceEmitter.addListener(
            'SDKUserLink',
            async id => {
                console.log("SDKUserLink event received");
                const {installId} = id;
                await linkUser(installId);
            }
        ));
        setSdkDetectionsEnabledSub(rnSentianceEmitter.addListener(
            'OnDetectionsEnabled',
            async sdkStatus => {
                console.log("OnDetectionsEnabled event received");
                await onDetectionsEnabled(sdkStatus);
            }
        ));
        setSdkStatusSub(rnSentianceEmitter.addListener(
            'SDKStatusUpdate',
            async sdkStatus => {
                console.log("SDKStatusUpdate event received");
                await onSdkStatusUpdate(sdkStatus);
            }
        ));
        setSdkUserActivityUpdateSub(rnSentianceEmitter.addListener(
            'SDKUserActivityUpdate',
            async userActivity => {
                console.log("SDKUserActivityUpdate event received");
                await onUserActivityUpdate(userActivity);
            }
        ));
        setUserContextUpdateSub(rnSentianceEmitter.addListener(
            'UserContextUpdateEvent',
            event => {
                const {criteria, userContext} = event;
                onUserContextUpdate(userContext);
            }
        ));
    }

    const bootstrapSDK = async () => {
        const sdkNotInitialized = !(await isSdkInitialized());

        if (sdkNotInitialized) {
            console.log('Initializing in JS');
            await RNSentiance.initWithUserLinkingEnabled(
                APP_ID,
                APP_SECRET,
                'https://preprod-api.sentiance.com',
                true
            );

            await RNSentiance.enableNativeInitialization();
            console.log(await RNSentiance.isThirdPartyLinked());
        }

        //const userContext = await RNSentiance.getUserContext()
        //notifyUserDataChanged({context: userContext});
        notifySdkStatusUpdated({isThirdPartyLinked: await RNSentiance.isThirdPartyLinked() ? 'Yes' : 'No'})

        const interval = setInterval(async () => {
            try {
                if (await isSdkInitialized()) {
                    onUserActivityUpdate(await RNSentiance.getUserActivity());

                    const userId = await RNSentiance.getUserId();
                    const sdkVersion = await RNSentiance.getVersion();
                    notifyUserDataChanged({id: userId})
                    notifySdkStatusUpdated({version: sdkVersion})

                    await RNSentiance.listenUserActivityUpdates();
                    //await RNSentiance.listenUserContextUpdates();

                    clearInterval(interval);
                }
            } catch (e) {
                console.error(e);
            }
        }, 1000);
    }

    const onDetectionsEnabled = async (sdkStatus) => {
        console.log("Detections are now enabled.");
    };

    const onSdkStatusUpdate = async (sdkStatus) => {
        const data = await statusToData(sdkStatus);
        notifySdkStatusUpdated({data});
    };

    const notifyUserDataChanged = (userData) => {
        const doUpdateUserData = () => dispatch(updateUserData(userData));
        doUpdateUserData();
    }

    const notifySdkStatusUpdated = (sdkStatus) => {
        const doUpdateSdkStatus = () => dispatch(updateSdkStatus(sdkStatus));
        doUpdateSdkStatus();
    }

    const onUserContextUpdate = (userContext) => {
        notifyUserDataChanged({context: userContext});
    }

    const onUserActivityUpdate = (userActivity) => {
        notifyUserDataChanged({activity: userActivity});
    }

    const isSdkInitialized = async () => {
        const initState = await RNSentiance.getInitState();
        return initState === 'INITIALIZED';
    }

    const refreshSdkStatus = async () => {
        const sdkInitialized = await isSdkInitialized();
        if (sdkInitialized) {
            const sdkStatus = await RNSentiance.getSdkStatus();
            await onSdkStatusUpdate(sdkStatus);
        }
    }

    const requestAndroidPermissions = async () => {
        if (Platform.OS === 'android') {
            const {
                ACCESS_BACKGROUND_LOCATION,
                ACCESS_FINE_LOCATION,
            } = PermissionsAndroid.PERMISSIONS;
            const {GRANTED} = PermissionsAndroid.RESULTS;
            if (parseInt(Platform.Version, 10) >= 29) {
                const grantedResults = await PermissionsAndroid.requestMultiple([
                    ACCESS_FINE_LOCATION,
                    ACCESS_BACKGROUND_LOCATION,
                    ACTIVITY_RECOGNITION,
                ]);
                if (
                    grantedResults[ACCESS_FINE_LOCATION] === GRANTED &&
                    grantedResults[ACCESS_BACKGROUND_LOCATION] === GRANTED &&
                    grantedResults[ACTIVITY_RECOGNITION] === GRANTED
                ) {
                    await refreshSdkStatus();
                }
            } else {
                const granted = await PermissionsAndroid.request(ACCESS_FINE_LOCATION);
                if (granted === GRANTED) {
                    await refreshSdkStatus();
                }
            }
        }
    }

    return <Provider store={store}>
        <RootNavigator/>
    </Provider>;
}
export default AppWrapper;