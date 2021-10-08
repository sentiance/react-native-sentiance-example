# RNSentiance Example

This is an example project using our [react-native-sentiance](https://github.com/sentiance/react-native-sentiance) bridge for react-native (>0.60).

Below are the examples of other features in separated branches:	

1. [Crash Detection](https://github.com/sentiance/react-native-sentiance-example/tree/crash-detection)
2. [On-device Trip Profiling](https://github.com/sentiance/react-native-sentiance-example/tree/on-device-trip-profiling)

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

### Install iOS dependencies
```sh
$ cd ios && pod install
```

## Setup

* Set your Sentiance credentials (app ID and secret) inside `.env`.
* If you want to make use of the SDK's user-linking feature, update both native (iOS and Android) and javascript initalization
  methods to enable user-linking (see `MyApplication.java`, `AppDelegate.m` and `App.js`). You will also need to implement the
  steps decribed in the `linkUser` function inside `App.js`.

## Run

* Open `./ios/RNSentiance.xcworkspace` in XCode
* Open `./android` folder in Android Studio
