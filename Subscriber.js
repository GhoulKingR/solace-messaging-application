"use strict";
class Subscriber {
  session = null;
  topicName = '';
  subscribed = false;
  url = '';
  vpnName = '';
  userName = '';
  password = '';

  constructor (topicName, url, userName, password, vpnName) {
    this.topicName = topicName;
    this.url = url;
    this.vpnName = vpnName;
    this.userName = userName;
    this.password = password;

    this.log( `*** Subscriber to topic "${this.topicName}" is ready to connect ***` );
  }

  log (line) {
    console.log(`${line} - [${Date()}]`);
  }

  connect () {
    if (this.session !== null) {
      // Already connected and ready to subscribe.
      return;
    }
    
    // Create session
    try {
      const { url, vpnName, userName, password } = this;
      this.session = solace.SolclientFactory.createSession({ url, vpnName, userName, password });
    } catch (error) {
      this.log(error.toString());
    }

    // define session event listeners
    this.session.on( solace.SessionEventCode.UP_NOTICE, () => {
      this.subscribe();
    });

    this.session.on( solace.SessionEventCode.CONNECT_FAILED_ERROR, () => {
      this.log( "Connection failed to the message router - check correct parameter values and connectivity!" );
    });

    this.session.on( solace.SessionEventCode.DISCONNECTED, () => {
        this.subscribed = false;
        if (this.session !== null) {
          this.session.dispose();
          this.session = null;
        }
      }
    );

    this.session.on( solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
      this.log( "Cannot subscribe to topic: " + sessionEvent.correlationKey );
    });

    this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
      this.subscribed = !this.subscribed;
    });

    this.session.connect();
  }

  subscribe () {
    if (this.session !== null) {
      if (!this.subscribed) {
        this.log("Subscribing to topic: " + this.topicName);
        try {
          this.session.subscribe(
            solace.SolclientFactory.createTopicDestination( this.topicName ),
            true, // generate confirmation when subscription is added successfully
            this.topicName, // use topic name as correlation key
            10000 // 10 seconds timeout for this operation
          );
        } catch (error) {
          this.log(error.toString());
        }
      }
    } else {
      this.log( "Cannot subscribe because not connected to Solace PubSub+ Event Broker." );
    }
  }

  unsubscribe () {
    if (this.session !== null) {
      if (this.subscribed) {
        this.log("Unsubscribing from topic: " + this.topicName);
        try {
          this.session.unsubscribe(
            solace.SolclientFactory.createTopicDestination( this.topicName ),
            true, // generate confirmation when subscription is removed successfully
            this.topicName, // use topic name as correlation key
            10000 // 10 seconds timeout for this operation
          );
        } catch (error) {
          this.log(error.toString());
        }
      } else {
        this.log( `Cannot unsubscribe because not subscribed to the topic "${this.topicName}"` );
      }
    } else {
      this.log( "Cannot unsubscribe because not connected to Solace PubSub+ Event Broker." );
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
