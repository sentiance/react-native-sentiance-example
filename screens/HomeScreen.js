import RNSentiance from 'react-native-sentiance';
import {ScrollView, Text, TouchableOpacity} from "react-native";
import Clipboard from '@react-native-clipboard/clipboard';
import React, {useEffect, useState} from 'react';
import styles from "../styles";
import {useSelector} from "react-redux";

export default function HomeScreen({route, navigation}) {
    const [userActivityText, setUserActivityText] = useState("Unavailable");
    const {userData, sdkStatus} = useSelector(state => state.mainReducer);
    const {
        version: sdkVersion,
        isThirdPartyLinked,
        data
    } = sdkStatus;
    const {id: userId, linkingInstallId, activity: userActivity, context: userContext} = userData;
    const {lastKnownLocation} = userContext;

    useEffect(() => {
        formatUserActivity(userActivity);
    }, [userActivity]);

    const formatUserActivity = (userActivity) => {
        const {type, stationaryInfo} = userActivity;
        let text = '';
        let stationaryLocation = '';

        if (type === 'USER_ACTIVITY_TYPE_STATIONARY') {
            const {location} = stationaryInfo;
            if (location) {
                const {latitude, longitude} = location;
                stationaryLocation = `${parseFloat(latitude)},${parseFloat(longitude)}`;
            }
            text = `Stationary @${stationaryLocation}`;
        } else if (type === 'USER_ACTIVITY_TYPE_TRIP') {
            text = 'Trip';
        } else if (type === 'USER_ACTIVITY_TYPE_UNKNOWN') {
            text = 'Unknown';
        }
        setUserActivityText(text);
    }

    const copyUserIdToBuffer = () => {
        Clipboard.setString(userId);
    };

    return (
        <ScrollView style={styles.root} contentContainerStyle={styles.container}>
            <Text style={styles.welcome}>RNSentiance</Text>
            <Text style={styles.heading}>User ID</Text>
            <Text style={styles.valueStyle}>{userId}</Text>
            <TouchableOpacity
                onPress={() => copyUserIdToBuffer()}
                underlayColor="#fff"
            >
                <Text style={styles.copyButton}>Copy User ID</Text>
            </TouchableOpacity>
            {lastKnownLocation && <Text style={styles.heading}>Last known location</Text>}
            {lastKnownLocation && <Text style={styles.valueStyle}>{lastKnownLocation.latitude || '-'}, {lastKnownLocation.longitude || '-'}</Text>}
            <Text style={styles.sdkVersion}>SDK version: {sdkVersion}</Text>
            <Text style={styles.heading}>User Activity</Text>
            <Text style={styles.valueStyle}> {userActivityText} </Text>
            <Text style={styles.heading}>User Context</Text>
            <TouchableOpacity
                onPress={() => navigation.navigate('UserContext')}
                underlayColor="#fff"
            >
                <Text style={styles.copyButton}>Go to events</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>SDK Status</Text>
            {data && data.map(item => (
                <Text key={`item-${item.key}`} style={styles.valueStyle}>
                    {item.key}: {item.value}
                </Text>
            ))}
            <Text style={styles.valueStyle}>
                Third party linked: {isThirdPartyLinked}
            </Text>
            <TouchableOpacity
                onPress={async () => {
                    await RNSentiance.reset();
                }}
                underlayColor="#fff"
            >
                <Text style={styles.copyButton}>SDK Reset</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}