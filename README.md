# RNSentiance Example

This is a basic example project using our [react-native-sentiance](https://github.com/sentiance/react-native-sentiance) bridge for react-native (>0.60).

Below are the examples of other features in separated branches:

1. [User Linking](https://github.com/sentiance/react-native-sentiance-example/tree/user-linking)
2. [Crash Detection](https://github.com/sentiance/react-native-sentiance-example/tree/crash-detection)
3. [On-device Trip Profiling](https://github.com/sentiance/react-native-sentiance-example/tree/on-device-trip-profiling)

## Docs

* The native SDK documentation can be found [here](https://docs.sentiance.com/sdk/getting-started).
* Requesting an app id & secret pair can be done [here](https://docs.sentiance.com/sdk/getting-started#requesting-an-app-id-and-secret).
* The actual documentation of the bridge can be found [here](https://github.com/sentiance/react-native-sentiance/blob/master/README.md).

## Example Project Setup

### Install npm dependencies
```sh
$ npm i
```

### Install CocoaPods (iOS)
```sh
$ gem install bundler
$ bundle install
```

### Instal iOS dependencies
```sh
$ cd ios && pod install
```

## Run

### Open `./ios/RNSentiance.xcworkspace` in XCode
### Open `./android` folder in Android Studio
