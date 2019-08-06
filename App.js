import RNSentiance from "react-native-sentiance";
import React, {
    Component
} from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    FlatList,
    ScrollView,
    TouchableOpacity,
    Clipboard,
    NativeEventEmitter,
    Dimensions,
    PermissionsAndroid
} from "react-native";

rnSentianceEmitter = new NativeEventEmitter(RNSentiance);
type Props = {};

export default class App extends Component < Props > {
    constructor() {
        super();
        this.state = {
            userId: "...",
            sdkVersion: "...",
            userActivity: "...",
            data: []
        };

        this.setupSdk();
    }

    componentDidMount() {
        this.subscribe();
        this.requestPermissionAndroid();
    }

    componentWillUnmount() {
        this.unSubscribe();
    }

    unSubscribe() {
        this.sdkStatusSubscription.remove();
        this.sdkUserActivityUpdateSubscribtion.remove();
    }

    subscribe() {
        this.sdkStatusSubscription = rnSentianceEmitter.addListener(
            "SDKStatusUpdate",
            sdkStatus => this.onSdkStatusUpdate(sdkStatus)
        );

        this.sdkUserActivityUpdateSubscribtion = rnSentianceEmitter.addListener(
            "SDKUserActivityUpdate",
            userActivity => {
                this.onUserActivityUpdate(userActivity);
            }
        );
    }

   async setupSdk() {
        var shouldInitialize = await this.shouldInitialize();
        if (shouldInitialize) {
            await RNSentiance.init(
                'APP_ID',
                "APP_SECRET",
                null,
                true,
            );
        }

        var sdkInitialized = await this.isSdkInitiazed();
        if (sdkInitialized) {
            const sdkStatus = await RNSentiance.getSdkStatus();
            this.onSdkStatusUpdate(sdkStatus);
            this.updateUserIdAndSdkVersion();
            this.listenToUserActivity();
        }
    }

    async onSdkStatusUpdate(sdkStatus) {
      console.log("onSdkStatusUpdate");
      const data = await this.statusToData(sdkStatus);
      this.setState({
        data: data
      });

      if (this.isSdkInitiazed()) {
        this.updateUserIdAndSdkVersion();
        this.listenToUserActivity();
      }
    }

    onUserActivityUpdate(userActivity) {
        var {
            type,
            tripInfo,
            stationaryInfo
        } = userActivity;

        if (type === "USER_ACTIVITY_TYPE_STATIONARY") {
            var {
                location
            } = stationaryInfo;
            if (location) {
                var {
                    latitude,
                    longitude
                } = location;
                stationaryLocation = parseFloat(latitude) + "," + parseFloat(longitude);
            }

            info = "Stationary  @" + stationaryLocation;
            this.setState({
                userActivity: info
            });
        } else if (type === "USER_ACTIVITY_TYPE_TRIP") {
            this.setState({
                userActivity: "Trip"
            });
        } else if (type === "USER_ACTIVITY_TYPE_UNKNOWN") {
            this.setState({
                userActivity: "Unknown"
            });
        }
    }

    async updateUserIdAndSdkVersion() {
        await RNSentiance.getUserId()
            .then(userId => {
                this.setState({
                    userId: userId
                });
            })
            .catch(err => console.log("There was an error:" + err));
        this.setState({
            sdkVersion: await RNSentiance.getVersion()
        });
    }

    async isSdkInitiazed() {
        var initState = await RNSentiance.getInitState();
        return initState == "INITIALIZED";
    }

    async shouldInitialize() {
        var initState = await RNSentiance.getInitState();
        return initState == "NOT_INITIALIZED";
    }

    async listenToUserActivity() {
        //listen to user activity changes
        RNSentiance.listenUserActivityUpdates();
        const activity = await RNSentiance.getUserActivity();
        this.onUserActivityUpdate(activity);
    }

    copyUserIdToBuffer = () => {
        Clipboard.setString(this.state.userId);
    }

    async requestPermissionAndroid(){
        if(Platform.OS === 'android'){
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                
                var sdkInitialized = await this.isSdkInitiazed();
                if (sdkInitialized) {
                    const sdkStatus = await RNSentiance.getSdkStatus();
                    this.onSdkStatusUpdate(sdkStatus);
                }
            }
        }
    }

    async statusToData(sdkStatus) {
      const isInitialized = await this.isSdkInitiazed();
        var {
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

        diskQuota = !isInitialized ? '--' : await RNSentiance.getDiskQuotaLimit();
        diskQuotaUsed = !isInitialized ? '--' : await RNSentiance.getDiskQuotaUsage();

        mobileQuota = !isInitialized ? '--' : await RNSentiance.getMobileQuotaLimit();
        mobileQuotaUsed = !isInitialized ? '--' : await RNSentiance.getMobileQuotaUsage();

        wifiQuota = !isInitialized ? '--' : await RNSentiance.getWiFiQuotaLimit();
        wifiQuotaUsed = !isInitialized ? '--' : await RNSentiance.getWiFiQuotaUsage();

        data = [{
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
                value: wifiQuotaStatus + "  (" + wifiQuotaUsed + "/" + wifiQuota + ")"
            },
            {
                key: "mobileQuotaStatus",
                value: mobileQuotaStatus + "  (" + mobileQuotaUsed + "/" + mobileQuota + ")"
            },
            {
                key: "diskQuotaStatus",
                value: diskQuotaStatus + "  (" + diskQuotaUsed + "/" + diskQuota + ")"
            }
        ];

        return data;
      
    }

   render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}> RNSentiance </Text>
        <Text style={styles.valueStyle}> {this.state.userId} </Text>
        <Text style={styles.sdkVersion}> SDK version: {this.state.sdkVersion}</Text>
        <TouchableOpacity
          onPress={this.copyUserIdToBuffer.bind()}
          underlayColor="#fff"
        >
        <Text style={styles.copyButton}> copy </Text>
        </TouchableOpacity>
        <Text style={styles.heading}> User Activity </Text>
        <Text style={styles.valueStyle}> {this.state.userActivity} </Text>
        <Text style={styles.heading}> SDK Status </Text>
        <ScrollView>
          <FlatList
            style={styles.sdkStatusList}
            data={this.state.data}
            renderItem={({ item }) => (
              <View>
                <Text style={styles.valueStyle}>{item.key}: {item.value}</Text>
              </View>
            )}
          />
        </ScrollView>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "black"
  },
  sdkStatusList: {
    width: Dimensions.get("window").width,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#d6d7da",
    color: "white",
    textAlign: "left",
    flexGrow: 0
  },
  welcome: {
    width: Dimensions.get("window").width,
    marginTop: 30,
    fontSize: 40,
    textAlign: "center",
    margin: 10,
    color: "white",
    fontWeight: "bold"
  },
  valueStyle: {
    textAlign: "left",
    fontSize: 15,
    color: "white",
    marginBottom: 5,
    marginLeft: 10
  },
  heading: {
    marginTop: 10,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "bold",
    color: "yellow",
    marginBottom: 5,
    marginLeft: 10
  },
  copyButton: {
    marginTop: 0,
    padding: 5,
    backgroundColor: "red",
    color: "white",
    fontSize: 15,
    marginLeft: 10
  },
  sdkVersion: {
    width: Dimensions.get("window").width,
    position: "absolute",
    bottom: 15,
    color: "gray",
    textAlign: "center"
  }
});
