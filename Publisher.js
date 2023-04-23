"use strict";
class Publisher {
  session = null;
  topicName = '';
  url = '';
  userName = '';
  password = '';
  vpnName = '';

  constructor(topicName, url, userName, password, vpnName) {
    this.topicName = topicName;
    this.url = url;
    this.userName = userName;
    this.password = password;
    this.vpnName = vpnName;
    this.log( `*** Publisher to topic "${topicName}" is ready to connect ***` );
  }

  log (line) {
    console.log(`${line} - [${Date()}]`);
  }

  connect () {
    if (this.session !== null) {
      // Already connected and ready to publish messages
      return;
    }

    // create session
    try {
      const { url, vpnName, userName, password } = this;
      this.session = solace.SolclientFactory.createSession({ url, vpnName, userName, password });
    } catch (error) {
      this.log( error.toString() );
    }

    // define session event listeners
    this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
      this.log( "=== Successfully connected and ready to publish messages. ===" );
    });

    this.session.on( solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
      this.log( `Connection failed to the message router: "${sessionEvent.infoStr}" - check correct parameter values and connectivity!` );
    });
    
    this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
      this.log("Disconnected.");
      if (this.session !== null) {
        this.session.dispose();
        this.session = null;
      }
    });

    this.session.connect();
  }

  publish (messageText) {
    if (this.session !== null) {
      let message = solace.SolclientFactory.createMessage();
      message.setDestination( solace.SolclientFactory.createTopicDestination(this.topicName) );
      message.setBinaryAttachment( messageText );
      message.setDeliveryMode( solace.MessageDeliveryModeType.DIRECT );
      this.log( `Publishing message "${messageText}" to topic "${this.topicName}"...` );
      try {
        this.session.send(message);
        this.log("Message published.");
      } catch (error) {
        this.log(error.toString());
      }
    } else {
      this.log( "Cannot publish because not connected to Solace PubSub+ Event Broker." );
    }
  }

  disconnect () {
    this.log("Disconnecting from Solace PubSub+ Event Broker...");
    if (this.session !== null) {
      try {
        this.session.disconnect();
      } catch (error) {
        this.log(error.toString());
      }
    } else {
      this.log("Not connected to Solace PubSub+ Event Broker.");
    }
  }
}
