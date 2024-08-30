// import the `Kafka` instance from the kafkajs library
const { Kafka } = require("kafkajs");

const checkNodeEnv = require("../../configService");

var config = checkNodeEnv();

const {
    kafka: { host, port },
} = config;

// the client ID lets kafka know who's producing the messages
const clientId = "kube-monitor-app-1";
// we can define the list of brokers in the cluster
const brokers = [host + ":" + port];

const { v4: uuidv4 } = require('uuid');

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers });
const producer = kafka.producer();

var defaultMessage = {
    workspace: "facebook",
    app: "ChatRooms",
    port: 51501,
    context: [
        "v1/users/registration",
        "v1/users/information"
    ]
};

// we define an async function that writes a new message to a specified topic
const produce = async (topic, message) => {
    console.log("topic : "+topic + " message : "+JSON.stringify(message));
    await producer.connect();
    message = {};
    console.log("Ready to send message to the topic");
    try {
        // send a message to the specified topic with
        // a unique key and the message content
        await producer.send({
            topic,
            messages: [
                {
                    key: uuidv4(),
                    value: JSON.stringify(message),
                }
            ],
        });

        console.log(`Message sent to topic ${topic}:`, message);

    } catch (err) {
        console.error("could not write message " + err);
    } finally {
        await producer.disconnect(); // ensure producer is properly disconnected
    }
};

module.exports = produce;
