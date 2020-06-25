import RNSentiance from "react-native-sentiance";
import React, { Component } from "react";
import {
  Platform,
  Text,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  NativeEventEmitter,
  PermissionsAndroid
} from "react-native";
import styles from "./styles";

const rnSentianceEmitter = new NativeEventEmitter(RNSentiance);

export default class App extends Component {
  state = {
    userId: "...",
    sdkVersion: "...",
    userActivityText: "...",
    data: [],
    subscriptionsAdded: false
  };

  async componentDidMount() {
    try {
      await this.setupSdk();
      this.subscribeAfterSDKSetup();
      await this.requestPermissionAndroid();
    } catch (e) {
      console.error(e.code, e);
    }
  }

  componentWillUnmount() {
    if (this.state.subscriptionsAdded) {
      this.unSubscribe();
    }
  }

  unSubscribe() {
    this.sdkStatusSubscription.remove();
    this.sdkUserActivityUpdateSubscription.remove();
  }

  subscribeAfterSDKSetup() {
    this.sdkStatusSubscription = rnSentianceEmitter.addListener(
      "SDKStatusUpdate",
      sdkStatus => this.onSdkStatusUpdate(sdkStatus)
    );

    this.sdkUserActivityUpdateSubscription = rnSentianceEmitter.addListener(
      "SDKUserActivityUpdate",
      userActivity => {
        this.onUserActivityUpdate(userActivity);
      }
    );

    this.setState({ subscriptionsAdded: true });
  }

  async setupSdk() {
    const sdkNotInitialized = await this.isSdkNotInitialized();
    if (sdkNotInitialized) {
      const appId = "{{APP_ID}}";
      const appSecret = "{{APP_SECRET}}";

      await RNSentiance.init(appId, appSecret, null, true);
    }

    const userId = await RNSentiance.getUserId();
    const sdkVersion = await RNSentiance.getVersion();
    const sdkStatus = await RNSentiance.getSdkStatus();
    const data = await this.statusToData(sdkStatus);
    this.setState({ userId, sdkVersion, data });

    RNSentiance.listenUserActivityUpdates();
  }

  async onSdkStatusUpdate(sdkStatus) {
    const data = await this.statusToData(sdkStatus);
    this.setState({ data: data });
  }

  onUserActivityUpdate(userActivity) {
    const { type, stationaryInfo } = userActivity;
    let userActivityText = "";
    let stationaryLocation = "";

    if (type === "USER_ACTIVITY_TYPE_STATIONARY") {
      const { location } = stationaryInfo;
      if (location) {
        const { latitude, longitude } = location;
        stationaryLocation = `${parseFloat(latitude)},${parseFloat(longitude)}`;
      }
      userActivityText = `Stationary @${stationaryLocation}`;
    } else if (type === "USER_ACTIVITY_TYPE_TRIP") {
      userActivityText = "Trip";
    } else if (type === "USER_ACTIVITY_TYPE_UNKNOWN") {
      userActivityText = "Unknown";
    }
    this.setState({ userActivityText });
  }

  async isSdkInitialized() {
    const initState = await RNSentiance.getInitState();
    return initState === "INITIALIZED";
  }

  async isSdkNotInitialized() {
    const initState = await RNSentiance.getInitState();
    return initState === "NOT_INITIALIZED";
  }

  copyUserIdToBuffer = () => {
    Clipboard.setString(this.state.userId);
  };

  async requestPermissionAndroid() {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const sdkInitialized = await this.isSdkInitialized();
        if (sdkInitialized) {
          const sdkStatus = await RNSentiance.getSdkStatus();
          await this.onSdkStatusUpdate(sdkStatus);
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
      diskQuotaStatus
    } = sdkStatus;

    const diskQuota = await RNSentiance.getDiskQuotaLimit();
    const diskQuotaUsed = await RNSentiance.getDiskQuotaUsage();
    const mobileQuota = await RNSentiance.getMobileQuotaLimit();
    const mobileQuotaUsed = await RNSentiance.getMobileQuotaUsage();
    const wifiQuota = await RNSentiance.getWiFiQuotaLimit();
    const wifiQuotaUsed = await RNSentiance.getWiFiQuotaUsage();

    return [
      {
        key: "startStatus",
        value: startStatus
      },
      {
        key: "isRemoteEnabled",
        value: isRemoteEnabled ? "YES" : "NO"
      },
      {
        key: "isLocationPermGranted",
        value: isLocationPermGranted ? "YES" : "NO"
      },
      {
        key: "locationSetting",
        value: locationSetting ? "YES" : "NO"
      },
      {
        key: "isAccelPresent",
        value: isAccelPresent ? "YES" : "NO"
      },
      {
        key: "isGyroPresent",
        value: isGyroPresent ? "YES" : "NO"
      },
      {
        key: "isGooglePlayServicesMissing",
        value: isGooglePlayServicesMissing ? "YES" : "NO"
      },
      {
        key: "wifiQuotaStatus",
        value: `${wifiQuotaStatus} (${wifiQuotaUsed}/${wifiQuota} )`
      },
      {
        key: "mobileQuotaStatus",

        value: `${mobileQuotaStatus} (${mobileQuotaUsed}/${mobileQuota} )`
      },
      {
        key: "diskQuotaStatus",
        value: `${diskQuotaStatus} (${diskQuotaUsed}/${diskQuota} )`
      }
    ];
  }

  render() {
    const { userId, sdkVersion, userActivityText, data } = this.state;

    return (
      <ScrollView style={{backgroundColor: 'black'}} contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>RNSentiance</Text>
        <Text style={styles.heading}>User ID</Text>
        <Text style={styles.valueStyle}>{userId}</Text>
        <TouchableOpacity
          onPress={() => this.copyUserIdToBuffer()}
          underlayColor="#fff"
        >
          <Text style={styles.copyButton}>Copy User ID</Text>
        </TouchableOpacity>
        <Text style={styles.sdkVersion}>SDK version: {sdkVersion}</Text>
        <Text style={styles.heading}>User Activity</Text>
        <Text style={styles.valueStyle}> {userActivityText} </Text>
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
