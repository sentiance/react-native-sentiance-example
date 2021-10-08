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
                subscribeSDKEvents();
                await initSDK();
                await requestPermissionAndroid();
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
        //this.userLinkListener.remove();
    }

    const linkUser = async (installId) => {
        /**
         * Note: this function will be called only if you call `RNSentiance.initWithUserLinkingEnabled()`
         * instead of `RNSentiance.init()` below.
         * 
         * Her, you need to implement the following user-linking steps:
         * 
         * 1. Send the installId to your backend.
         * 2. From there, request from the Sentiance API to link the 'installId' with your 'externalId'.
         * 3. Return the result to the app here.
         * 
         * If the entire process was successful, call `RNSentiance.userLinkCallback(true)`, otherwise call 
         * `RNSentiance.userLinkCallback(false)`. Note that the SDK initialation will fail if user linking fails,
         * but you are free to try again.
         */
    }

    const subscribeSDKEvents = () => {
        this.userLinkListener = rnSentianceEmitter.addListener(
            'SDKUserLink',
            async id => {
              const {installId} = id;
              notifyUserDataChanged({linkingInstallId: installId});
              await linkUser(installId);
            }
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
        const sdkNotInitialized = await isSdkNotInitialized();

        if (sdkNotInitialized) {
            console.log('Initializing in JS');

            // To utilize the SDK's user linking feature, instead of calling `RNSentiance.init()` here,
            // call `RNSentiance.initWithUserLinkingEnabled()`. This will emit the 'SDKUserLink' event
            // during SDK initialization, and call upon `linkUser(installId)` defined above. You need 
            // to implement the required user linking steps described inside `linkUser(installId)`.
            //
            // Note: If you call `RNSentiance.initWithUserLinkingEnabled()` here, you might want to 
            // make sure that your native iOS and Android code use `initSDKIfUserLinkingCompleted` and
            // `initializeSentianceSDKIfUserLinkingCompleted` respectively, to prevent accidentally 
            // initializing the SDK natively, unless user linking has completed on the js side first.

            await RNSentiance.init(
                APP_ID,
                APP_SECRET,
                "https://api.sentiance.com",
                true
            );

            await RNSentiance.enableNativeInitialization();
        } else {
            console.log("SDK is initialised");
        }

        const userContext = await RNSentiance.getUserContext()
        notifyUserDataChanged({context: userContext});
        notifySdkStatusUpdated({isThirdPartyLinked: await RNSentiance.isThirdPartyLinked() ? 'Yes' : 'No'})

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

    const isSdkNotInitialized = async () => {
        const initState = await RNSentiance.getInitState();
        return initState === 'NOT_INITIALIZED';
    }

    const refreshSdkStatus = async () => {
        const sdkInitialized = await isSdkInitialized();
        if (sdkInitialized) {
            const sdkStatus = await RNSentiance.getSdkStatus();
            await onSdkStatusUpdate(sdkStatus);
        }
    }

    const requestPermissionAndroid = async () => {
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