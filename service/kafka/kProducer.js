// import the `Kafka` instance from the kafkajs library
const { Kafka } = require("kafkajs")

const checkNodeEnv = require("../../configService");

var config = checkNodeEnv();

const {
    kafka: { host, port },
} = config;

// the client ID lets kafka know who's producing the messages
const clientId = "kube-monitor-app-1"
// we can define the list of brokers in the cluster
const brokers = [host + ":" + port]
// this is the topic to which we want to write messages
const topic = "ifa-logs"

const { v4: uuidv4 } = require('uuid');

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers })
const producer = kafka.producer()

var message = {
    workspace: "facebook",
    app: "ChatRooms",
    port: 51501,
    context: [
        "v1/users/registration",
        "v1/users/information"
    ]
};

// we define an async function that writes a new message each second
const produce = async (message) => {
    await producer.connect()

    try {
        // send a message to the configured topic with
        // the key and value formed from the current value of `i`
        await producer.send({
            topic,
            messages: [
                {
                    key: uuidv4(),
                    value: JSON.stringify(message),
                }
            ],
        })

    } catch (err) {
        console.error("could not write message " + err)
    } finally {
        producer.disconnect();
    }


}

module.exports = produce