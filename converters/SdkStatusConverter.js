import {Platform} from "react-native";
import RNSentiance from 'react-native-sentiance';

export async function statusToData(sdkStatus) {
    const {
        startStatus,
        canDetect,
        isRemoteEnabled,
        isAccelPresent,
        isGyroPresent,
        isGpsPresent,
        wifiQuotaStatus,
        mobileQuotaStatus,
        diskQuotaStatus,
        locationPermission,
        isBgAccessPermGranted,
        isActivityRecognitionPermGranted,
        locationSetting,
        isAirplaneModeEnabled,
        isLocationAvailable,
        isGooglePlayServicesMissing,
        isBatteryOptimizationEnabled,
        isBatterySavingEnabled,
        isBackgroundProcessingRestricted,
        isPreciseLocationAuthorizationGranted
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
            key: 'canDetect',
            value: canDetect ? 'YES' : 'NO',
        },
        {
            key: 'isRemoteEnabled',
            value: isRemoteEnabled ? 'YES' : 'NO',
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
            key: 'isGpsPresent',
            value: isGpsPresent ? 'YES' : 'NO',
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
            key: 'locationPermission',
            value: locationPermission,
        },
        {
            key: 'isBgAccessPermGranted',
            value: isAndroid ? 'NA' : (isBgAccessPermGranted ? 'YES' : 'NO'),
        },
        {
            key: 'isActivityRecognitionPermGranted',
            value: isAndroid ? (isActivityRecognitionPermGranted ? 'YES' : 'NO') : 'NA',
        },
        {
            key: 'locationSetting',
            value: isAndroid ? locationSetting : 'NA',
        },
        {
            key: 'isAirplaneModeEnabled',
            value: isAndroid ? (isAirplaneModeEnabled ? 'YES' : 'NO') : 'NA',
        },
        {
            key: 'isLocationAvailable',
            value: isAndroid ? (isLocationAvailable ? 'YES' : 'NO') : 'NA',
        },
        {
            key: 'isGooglePlayServicesMissing',
            value: isAndroid ? (isGooglePlayServicesMissing ? 'YES' : 'NO') : 'NA',
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
            value: isAndroid ? (isBackgroundProcessingRestricted ? 'YES' : 'NO') : 'NA',
        },
        {
            key: 'isPreciseLocationAuthorizationGranted',
            value: isAndroid ? 'NA' : (isPreciseLocationAuthorizationGranted ? 'YES' : 'NO'),
        },
    ];
}