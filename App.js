import RNSentiance from 'react-native-sentiance';
import React, { Component } from 'react';
import {
  Platform,
  Text,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import styles from './styles';

const rnSentianceEmitter = new NativeEventEmitter(RNSentiance);

const ACTIVITY_RECOGNITION = 'android.permission.ACTIVITY_RECOGNITION';

export default class App extends Component {
  state = {
    userId: "...",
    sdkVersion: "...",
    userActivityText: "...",
    userLinkInstallId: "...",
    tripProfile: "...",
    fullProfilingEnabled: true,
    data: [],
  };

  async componentDidMount() {
    try {
      this.subscribeSDKEvents();
      await this.initSDK();
      await this.requestPermissionAndroid();
    } catch (e) {
      console.error(e.code, e);
    }
  }

  componentWillUnmount() {
    this.unSubscribe();
  }

  unSubscribe() {
    this.sdkStatusSubscription.remove();
    this.sdkUserActivityUpdateSubscription.remove();
    this.userLinkListener.remove();
    this.sdkTripProfilesSubscription.remove();
  }

  /**
   * The user-linking logics are required to be implemented in your backend.
   * 1. Sending the installId to your backend.
   * 2. Calling the Sentiance API with the installId and the externalId in your backend.
   * 3. Responding the result.
   * If the backend responds successful, call RNSentiance.userLinkCallback(true);. Otherwise, RNSentiance.userLinkCallback(false);
   * SDK will not be initialized if linking is failed.
   */
  async linkUser(installId) {
    throw new Error(
      'You must implement your own user linking logic inside linkUser(installId)'
    );
  }

  subscribeSDKEvents() {
    this.userLinkListener = rnSentianceEmitter.addListener(
      'SDKUserLink',
      async id => {
        const { installId } = id;
        this.setState({ userLinkInstallId: installId });
        await this.linkUser(installId);
      }
    );
    this.sdkStatusSubscription = rnSentianceEmitter.addListener(
      'SDKStatusUpdate',
      sdkStatus => this.onSdkStatusUpdate(sdkStatus)
    );
    this.sdkUserActivityUpdateSubscription = rnSentianceEmitter.addListener(
      'SDKUserActivityUpdate',
      userActivity => this.onUserActivityUpdate(userActivity)
    );
    this.sdkTripProfilesSubscription = rnSentianceEmitter.addListener(
      "SDKTripProfile",
      (tripProfile) => {
        this.setState({
          tripProfile: JSON.stringify(tripProfile, null, 2)
        });
      }
    );
  }

  async initSDK() {
    const sdkNotInitialized = await this.isSdkNotInitialized();

    if (sdkNotInitialized) {
      const appId = '';
      const appSecret = '';

      console.log('Initializing in JS');
      await RNSentiance.initWithUserLinkingEnabled(
        appId,
        appSecret,
        null,
        true
      );

      await RNSentiance.enableNativeInitialization();
    }

    this.interval = setInterval(async () => {
      if (await this.isSdkInitialized()) {
        const userId = await RNSentiance.getUserId();
        const sdkVersion = await RNSentiance.getVersion();
        const sdkStatus = await RNSentiance.getSdkStatus();
        const data = await this.statusToData(sdkStatus);
        this.onUserActivityUpdate(await RNSentiance.getUserActivity());
        this.setState({ userId, sdkVersion, data });
        await RNSentiance.listenUserActivityUpdates();
        RNSentiance.listenTripProfiles();

        clearInterval(this.interval);
      }
    }, 1000);
  }

  async onSdkStatusUpdate(sdkStatus) {
    const data = await this.statusToData(sdkStatus);
    this.setState({ data: data });
  }

  onUserActivityUpdate(userActivity) {
    const { type, stationaryInfo } = userActivity;
    let userActivityText = '';
    let stationaryLocation = '';

    if (type === 'USER_ACTIVITY_TYPE_STATIONARY') {
      const { location } = stationaryInfo;
      if (location) {
        const { latitude, longitude } = location;
        stationaryLocation = `${parseFloat(latitude)},${parseFloat(longitude)}`;
      }
      userActivityText = `Stationary @${stationaryLocation}`;
    } else if (type === 'USER_ACTIVITY_TYPE_TRIP') {
      userActivityText = 'Trip';
    } else if (type === 'USER_ACTIVITY_TYPE_UNKNOWN') {
      userActivityText = 'Unknown';
    }
    this.setState({ userActivityText });
  }

  async isSdkInitialized() {
    const initState = await RNSentiance.getInitState();
    return initState === 'INITIALIZED';
  }

  async isSdkNotInitialized() {
    const initState = await RNSentiance.getInitState();
    return initState === 'NOT_INITIALIZED';
  }

  copyUserIdToBuffer = () => {
    Clipboard.setString(this.state.userId);
  };

  async refreshSdkStatus() {
    const sdkInitialized = await this.isSdkInitialized();
    if (sdkInitialized) {
      const sdkStatus = await RNSentiance.getSdkStatus();
      await this.onSdkStatusUpdate(sdkStatus);
    }
  }

  async requestPermissionAndroid() {
    if (Platform.OS === 'android') {
      const {
        ACCESS_BACKGROUND_LOCATION,
        ACCESS_FINE_LOCATION,
      } = PermissionsAndroid.PERMISSIONS;
      const { GRANTED } = PermissionsAndroid.RESULTS;
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
          await this.refreshSdkStatus();
        }
      } else {
        const granted = await PermissionsAndroid.request(ACCESS_FINE_LOCATION);
        if (granted === GRANTED) {
          await this.refreshSdkStatus();
        }
      }
    }
  }

  async statusToData(sdkStatus) {
    const {
      startStatus,
      isRemoteEnabled,
      isLocationPermGranted,
      locationSetting,
      isAccelPresent,
      isGyroPresent,
      isGooglePlayServicesMissing,
      wifiQuotaStatus,
      mobileQuotaStatus,
      diskQuotaStatus,
      isActivityRecognitionPermGranted,
      isAirplaneModeEnabled,
      isLocationAvailable,
      isBatteryOptimizationEnabled,
      isBatterySavingEnabled,
      isBackgroundProcessingRestricted,
    } = sdkStatus;

    const diskQuota = await RNSentiance.getDiskQuotaLimit();
    const diskQuotaUsed = await RNSentiance.getDiskQuotaUsage();
    const mobileQuota = await RNSentiance.getMobileQuotaLimit();
    const mobileQuotaUsed = await RNSentiance.getMobileQuotaUsage();
    const wifiQuota = await RNSentiance.getWiFiQuotaLimit();
    const wifiQuotaUsed = await RNSentiance.getWiFiQuotaUsage();

    const isAndroid = Platform.OS === 'android';

    return [
      {
        key: 'startStatus',
        value: startStatus,
      },
      {
        key: 'isRemoteEnabled',
        value: isRemoteEnabled ? 'YES' : 'NO',
      },
      {
        key: 'isLocationPermGranted',
        value: isLocationPermGranted ? 'YES' : 'NO',
      },
      {
        key: 'isAccelPresent',
        value: isAccelPresent ? 'YES' : 'NO',
      },
      {
        key: 'isGyroPresent',
        value: isGyroPresent ? 'YES' : 'NO',
      },
      {
        key: 'wifiQuotaStatus',
        value: `${wifiQuotaStatus} (${wifiQuotaUsed}/${wifiQuota} )`,
      },
      {
        key: 'mobileQuotaStatus',

        value: `${mobileQuotaStatus} (${mobileQuotaUsed}/${mobileQuota} )`,
      },
      {
        key: 'diskQuotaStatus',
        value: `${diskQuotaStatus} (${diskQuotaUsed}/${diskQuota} )`,
      },
      {
        key: 'isAirplaneModeEnabled',
        value: isAirplaneModeEnabled ? 'YES' : 'NO',
      },
      {
        key: 'locationSetting',
        value: isAndroid ? locationSetting : 'NA',
      },
      {
        key: 'isGooglePlayServicesMissing',
        value: isAndroid ? (isGooglePlayServicesMissing ? 'YES' : 'NO') : 'NA',
      },
      {
        key: 'isActivityRecognitionPermGranted',
        value: isAndroid
          ? isActivityRecognitionPermGranted
            ? 'YES'
            : 'NO'
          : 'NA',
      },
      {
        key: 'isLocationAvailable',
        value: isAndroid ? (isLocationAvailable ? 'YES' : 'NO') : 'NA',
      },
      {
        key: 'isBatteryOptimizationEnabled',
        value: isAndroid ? (isBatteryOptimizationEnabled ? 'YES' : 'NO') : 'NA',
      },
      {
        key: 'isBatterySavingEnabled',
        value: isAndroid ? (isBatterySavingEnabled ? 'YES' : 'NO') : 'NA',
      },
      {
        key: 'isBackgroundProcessingRestricted',
        value: isAndroid
          ? isBackgroundProcessingRestricted
            ? 'YES'
            : 'NO'
          : 'NA',
      },
    ];
  }

  toggleTripProfiling = async () => {
    const { fullProfilingEnabled } = this.state
    try {
      await RNSentiance.updateTripProfileConfig({ enableFullProfiling: !fullProfilingEnabled, speedLimit: 20.5 })
      this.setState({ fullProfilingEnabled: !fullProfilingEnabled })
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    const {
      userId,
      sdkVersion,
      userActivityText,
      data,
      userLinkInstallId,
      tripProfile,
      fullProfilingEnabled
    } = this.state;

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>RNSentiance</Text>
        <Text style={styles.heading}>User ID</Text>
        <Text style={styles.valueStyle}>{userId}</Text>
        <TouchableOpacity
          onPress={() => this.copyUserIdToBuffer()}
          underlayColor="#fff"
        >
          <Text style={styles.copyButton}>Copy User ID</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>User Linking Install ID</Text>
        <Text style={styles.valueStyle}>{userLinkInstallId}</Text>
        <Text style={styles.sdkVersion}>SDK version: {sdkVersion}</Text>
        <Text style={styles.heading}>User Activity</Text>
        <Text style={styles.valueStyle}> {userActivityText} </Text>
        <Text style={styles.heading}>Trip Profile</Text>
        <Text style={styles.valueStyle}>{tripProfile}</Text>
        <TouchableOpacity
          onPress={() => this.toggleTripProfiling()}
          underlayColor="#fff"
        >
          <Text style={styles.copyButton}>{ fullProfilingEnabled? 'Switch to on-device trip profiling' : 'Switch to full profiling' }</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>SDK Status</Text>
        {data.map(item => (
          <Text key={`item-${item.key}`} style={styles.valueStyle}>
            {item.key}: {item.value}
          </Text>
        ))}
        <TouchableOpacity
          onPress={async () => {
            await RNSentiance.reset();
          }}
          underlayColor="#fff"
        >
          <Text style={styles.copyButton}>SDK Reset</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}
