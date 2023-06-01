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
  }

  connect () {
    if (this.session === null) { // Make sure a session isn't running
      
      // Create a session
      try {
        const { url, vpnName, userName, password } = this;
        this.session = solace.SolclientFactory.createSession({ url, vpnName, userName, password });
      } catch (error) {
        console.error( error.toString() );
      }
      
      // Define an event listener to handle session disconnection
      this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
        if (this.session !== null) {
          this.session.dispose();
          this.session = null;
        }
      });
      
      this.session.connect();
    }
  }

  publish (messageText) {
    if (this.session !== null) {
      // Prepare a message object
      let message = solace.SolclientFactory.createMessage();
      message.setDestination( solace.SolclientFactory.createTopicDestination(this.topicName) );
      message.setBinaryAttachment( messageText );
      message.setDeliveryMode( solace.MessageDeliveryModeType.DIRECT );

      // Send the message object
      try {
        this.session.send(message);
      } catch (error) {
        console.log(error.toString());
      }
    }
  }
}