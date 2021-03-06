import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
  root: {
    backgroundColor: 'black',
  },
  container: {
    flexGrow: 1,
    alignItems: 'flex-start',
    backgroundColor: 'black',
    padding: 24,
  },
  welcome: {
    marginTop: 64,
    marginBottom: 24,
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  valueStyle: {
    textAlign: 'left',
    fontSize: 15,
    color: 'white',
    marginBottom: 8,
  },
  heading: {
    marginVertical: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  copyButton: {
    marginTop: 0,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    color: 'white',
    fontSize: 15,
  },
  sdkVersion: {
    width: Dimensions.get('window').width,
    position: 'absolute',
    bottom: 32,
    color: 'gray',
    textAlign: 'center',
  },
});
