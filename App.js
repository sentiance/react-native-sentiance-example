import RNSentiance from "react-native-sentiance";
import React, { Component } from "react";
import {
  Platform,
  Text,
  View,
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
    data: []
  };

  componentDidMount() {
    this.setupSdk();
    this.subscribe();
    this.requestPermissionAndroid();
  }

  componentWillUnmount() {
    this.unSubscribe();
  }

  unSubscribe() {
    this.sdkStatusSubscription.remove();
    this.sdkUserActivityUpdateSubscription.remove();
    this.sdkCrashEventSubscription.remove();
  }

  async subscribe() {
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

    const sdkInitialized = await this.isSdkInitialized();
    if (sdkInitialized) {
      this.sdkCrashEventSubscription = rnSentianceEmitter.addListener(
        "SDKCrashEvent",
        ({ time, lastKnownLocation }) => {
          this.setState({
            crash: {
              time: new Date(time),
              lastKnownLocation,
            },
          });
        }
      );
      RNSentiance.listenCrashEvents();
    }
  }

  async setupSdk() {
    const sdkInitialized = await this.isSdkInitialized();
    if (sdkInitialized) {
      const sdkStatus = await RNSentiance.getSdkStatus();
      const userId = await RNSentiance.getUserId();
      const sdkVersion = await RNSentiance.getVersion();
      const data = await this.statusToData(sdkStatus);
      this.setState({ userId, sdkVersion, data });
      RNSentiance.listenUserActivityUpdates();
    } else {
      await this.initializeSDK();
    }
  }

  async onSdkStatusUpdate(sdkStatus) {
    const data = await this.statusToData(sdkStatus);
    this.setState({
      data: data
    });
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
    this.setState({
      userActivityText
    });
  }

  async initializeSDK() {
    try {
      const appId = "{{APP_ID}}";
      const appSecret = "{{APP_SECRET}}";

      await RNSentiance.reset();
      await RNSentiance.init(appId, appSecret, null, true);

      const userId = await RNSentiance.getUserId();
      const sdkVersion = await RNSentiance.getVersion();

      this.setState({ userId, sdkVersion });
    } catch (err) {
      console.error(err);
    }
  }

  async isSdkInitialized() {
    const initState = await RNSentiance.getInitState();
    return initState === "INITIALIZED";
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
          this.onSdkStatusUpdate(sdkStatus);
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
      <View style={styles.container}>
        <Text style={styles.welcome}>RNSentiance</Text>
        <Text style={styles.heading}>User ID</Text>
        <Text style={styles.valueStyle}>{userId}</Text>
        <Text style={styles.sdkVersion}>SDK version:{sdkVersion}</Text>
        <TouchableOpacity
          onPress={e => this.copyUserIdToBuffer()}
          underlayColor="#fff"
        >
          <Text style={styles.copyButton}>copy</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>User Activity</Text>
        <Text style={styles.valueStyle}> {userActivityText} </Text>
        <Text style={styles.heading}>SDK Status</Text>
        <ScrollView contentContainerStyle={styles.sdkStatusList}>
          {data.map(item => (
            <Text key={`item-${item.key}`} style={styles.valueStyle}>
              {item.key}: {item.value}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }
}
