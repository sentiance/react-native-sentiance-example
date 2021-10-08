import {FlatList, Text, View} from "react-native";

import React from 'react';
import {useSelector} from "react-redux";
import styles from "../styles";

export default function UserContextScreen({navigation}) {

    const {userData} = useSelector(state => state.mainReducer);
    const {context: userContext} = userData;
    const {events} = userContext

    return (
        <View style={styles.root}>
            <Text style={styles.welcome}>{events.length} events</Text>
            <FlatList keyExtractor={(item, index) => index} data={events}
                      renderItem={({item, index}) => <View key={`event-${index}`}>
                          <View style={styles.separator}/>
                          <Text style={styles.heading}>#{index + 1}</Text>
                          <Text style={styles.valueStyle}>
                              Start time: {item.startTime}
                          </Text>
                          <Text style={styles.valueStyle}>
                              Type: {item.type}
                          </Text>
                          <Text style={styles.valueStyle}>
                              Venue type: {item.venueType || '-'}
                          </Text>
                      </View>}/>
        </View>
    )
}