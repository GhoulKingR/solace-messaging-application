<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messaging application</title>
    <script src="./solclientjs-10.13.0/lib/solclient-debug.js"></script>
    <script src="./Publisher.js"></script>
    <script src="./Subscriber.js"></script>
    <script>
        let publisher = null;
        let subscriber = null;

        window.onload = () => {
            var factoryProps = new solace.SolclientFactoryProperties();
            factoryProps.profile = solace.SolclientFactoryProfiles.version10;
            solace.SolclientFactory.init(factoryProps);

            const topicName = 'messages';
            const hosturl = 'http://localhost:8008';
            const username = 'admin';
            const pass = 'admin';
            const vpn = 'default';
            const user = localStorage.getItem('username');

            if (user === null) {
                document.location.assign('/');
                return ;
            }

            publisher = new Publisher(topicName, hosturl, username, pass, vpn);
            subscriber = new Subscriber(topicName, hosturl, username, pass, vpn);
            const chat = document.getElementById('chat');

            publisher.connect();
            subscriber.connect();

            subscriber.session.on(solace.SessionEventCode.MESSAGE, function (message) {
                chat.innerHTML += display(message.getBinaryAttachment());
            });

            document.getElementById('form').onsubmit = (e) => {
                e.preventDefault();
                if (publisher !== null && subscriber !== null) {
                    const element = document.getElementById('message');
                    const obj = JSON.stringify({message: element.value, user});
                    publisher.publish(obj);
                    element.value = '';
                }
            }
        };

        function display(text) {
            const {user, message} = JSON.parse(text);
            const isUser = user === localStorage.getItem('username');
            return `
                <fieldset>
                    <legend align="${isUser ? 'right' : 'left'}">${isUser ? 'You' : user }</legend>
                    <div>${message}</div>
                </fieldset>
            `;
        }
    </script>
</head>
<body>
    <div id="chat"></div>
    <form id="form">
        <input type='text' id='message' placeholder='Enter text...'/>
        <input type='submit' value='send'/>
    </form>
</body>
</html>
