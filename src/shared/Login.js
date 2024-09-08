import React, { Component } from 'react'
import { View, SafeAreaView, Text, Button, StatusBar, StyleSheet, Dimensions } from "react-native";
import kc from "./keycloak";

export default class LoginPage extends Component {

  state = {
    disabled: false,
    loading: true,
    user: null,
  };

  componentDidMount() {
    console.log(this.props.navigation);
    this.appLogin();
  }

  appLogin = () => {
    kc.getUser((user) => {
      if (user) {
        console.log("getUser: ", user)
        this.setState({user, loading: !!this.props.loading});
        this.props.checkPermission(user);
        //this.props.navigation.navigate("Stream");
      } else {
        this.setState({disabled: false, loading: false});
      }
    });
  };

  userLogin = () => {
    this.setState({disabled: true, loading: true});
    kc.Login(() => {
      this.appLogin();
    });
  };

  userLogout = () => {
    this.setState({disabled: true, loading: true});
    kc.Logout(user => {
      this.setState({user: null, loading: !!this.props.loading});
    });
  };

  render() {
    const {user,disabled} = this.state;

    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.top} />
            <View style={styles.middle}>
              {user ? "" : <Button disabled={disabled} title="Login" onPress={this.userLogin} />}
              {user ? <Button title="Logout" onPress={this.userLogout} />: ""}
            </View>
          <View style={styles.bottom} />
        </SafeAreaView>
      )
  }
}

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height/2.35
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
  },
  top: {
    flex: 0.3,
    backgroundColor: 'grey',
    borderWidth: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  middle: {
    flex: 0.3,
    backgroundColor: 'beige',
    borderWidth: 5,
  },
  bottom: {
    flex: 0.3,
    backgroundColor: 'pink',
    borderWidth: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
