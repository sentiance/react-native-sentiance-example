import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from "../screens/HomeScreen";
import UserContextScreen from "../screens/UserContextScreen";

const Stack = createNativeStackNavigator();
const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false, contentStyle:{backgroundColor:'#000000'}}}>
                <Stack.Screen name="Home" component={HomeScreen} initialParams={this.state}/>
                <Stack.Screen name="UserContext" component={UserContextScreen}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
};
export default RootNavigator;