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
  }

  connect () {
    if (this.session === null) { // Make sure a session isn't running
      
      // Create a session
      try {
        const { url, vpnName, userName, password } = this;
        this.session = solace.SolclientFactory.createSession({ url, vpnName, userName, password });
      } catch (error) {
        console.error(error.toString());
      }
      
      // Define session event listeners
      this.session.on( solace.SessionEventCode.UP_NOTICE, () => {
        this.subscribe();  // Subscribe to topic immediately the session is active
      });

      this.session.on( solace.SessionEventCode.DISCONNECTED, () => {
        this.subscribed = false;
          if (this.session !== null) {
            this.session.dispose();
            this.session = null;
          }
        }
      );
      
      this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function () {
        this.subscribed = !this.subscribed;   // Toggle `this.subscribed` when subscribtion changes
      });
      
      this.session.connect();
    }
  }
    
  subscribe () {
    if (this.session !== null) {
      if (!this.subscribed) {

        try {
          const topicDestination = solace.SolclientFactory.createTopicDestination( this.topicName );
          const timeout = 10000; // 10 seconds timeout for this operation

          this.session.subscribe( topicDestination, true, this.topicName, timeout );
        } catch (error) {
          console.error( error.toString() );
        }
      }

    }
  }
}
