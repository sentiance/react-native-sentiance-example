import RNSentiance from 'react-native-sentiance';
import React, {useEffect} from 'react';
import {NativeEventEmitter, PermissionsAndroid, Platform,} from 'react-native';
import {Provider, useDispatch} from 'react-redux';
import {store} from './redux/store';
import RootNavigator from './navigation/RootNavigator';
import {updateSdkStatus, updateUserData} from "./redux/actions";
import {statusToData} from "./converters/SdkStatusConverter";
import Config from "react-native-config";

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
    useEffect(() => {
        async function init() {
            try {
                subscribeToSDKEvents();
                await requestAndroidPermissions();
                await initSDK();
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
        this.sdkStatusSubscription.remove();
        this.userContextUpdateSubscription.remove();
        this.sdkUserActivityUpdateSubscription.remove();
        this.sdkStartFinishedSubscription.remove();
        this.userLinkListener.remove();
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
    }

    const subscribeToSDKEvents = () => {
        this.userLinkListener = rnSentianceEmitter.addListener(
            'SDKUserLink',
            async event => {
              const {installId} = event;
              notifyUserDataChanged({linkingInstallId: installId});
              await linkUser(installId);
            }
        );
        this.sdkStartFinishedSubscription = rnSentianceEmitter.addListener(
            'OnStartFinished',
            sdkStatus => onStartFinished(sdkStatus)
        );
        this.sdkStatusSubscription = rnSentianceEmitter.addListener(
            'SDKStatusUpdate',
            sdkStatus => onSdkStatusUpdate(sdkStatus)
        );
        this.sdkUserActivityUpdateSubscription = rnSentianceEmitter.addListener(
            'SDKUserActivityUpdate',
            userActivity => onUserActivityUpdate(userActivity)
        );
        this.userContextUpdateSubscription = rnSentianceEmitter.addListener(
            'UserContextUpdateEvent',
            event => {
                const {criteria, userContext} = event;
                onUserContextUpdate(userContext);
            }
        );
    }

    const initSDK = async () => {
        const userExists = await RNSentiance.userExists();
        if (!userExists) {
            const linkedUser = await RNSentiance.createLinkedUser(APP_ID, APP_SECRET);
            console.log(`Created new linked user: ${JSON.stringify(linkedUser)}`);
            const startResult = await RNSentiance.start();
            console.log(`SDK is now in ${startResult.startStatus} state.`);
        }

        const userContext = await RNSentiance.getUserContext()
        notifyUserDataChanged({context: userContext});
        notifySdkStatusUpdated({isThirdPartyLinked: await RNSentiance.isUserLinked() ? 'Yes' : 'No'})

        this.interval = setInterval(async () => {
            if (await isSdkInitialized()) {
                onUserActivityUpdate(await RNSentiance.getUserActivity());

                const userId = await RNSentiance.getUserId();
                const sdkVersion = await RNSentiance.getVersion();
                notifyUserDataChanged({id: userId})
                notifySdkStatusUpdated({version: sdkVersion})

                await RNSentiance.listenUserActivityUpdates();
                await RNSentiance.listenUserContextUpdates();

                clearInterval(this.interval);
            }
        }, 1000);
    }

    const onStartFinished = async (sdkStatus) => {

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