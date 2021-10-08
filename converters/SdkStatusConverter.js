import {Platform} from "react-native";
import RNSentiance from 'react-native-sentiance';

export async function statusToData(sdkStatus) {
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