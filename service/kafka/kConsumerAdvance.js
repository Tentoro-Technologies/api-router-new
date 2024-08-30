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
// this is the primary topic to which we want to write messages
const primaryTopic = "kube-out";
// this is the additional topic we want to consume messages from
const secondaryTopic = "iot-topic";

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers });

const consumer = kafka.consumer({ groupId: clientId });

const consume = async (primaryCallback, secondaryCallback) => {
  // first, we wait for the client to connect and subscribe to the given topics
  await consumer.connect();
  await consumer.subscribe({ topic: primaryTopic });
  await consumer.subscribe({ topic: secondaryTopic });

  await consumer.run({
    // this function is called every time the consumer gets a new message
    eachMessage: async ({ topic, message }) => {
      consumer.pause();
      console.log("Waiting.....................................");
      if (topic === primaryTopic && primaryCallback) {
        await delay(15000);
        primaryCallback(JSON.parse(message.value));
        console.log(`Received message from ${primaryTopic}: ${message.value}`);
      } else if (topic === secondaryTopic && secondaryCallback) {
        await delay(15000);
        secondaryCallback(JSON.parse(message.value));
        console.log(`Received message from ${secondaryTopic}: ${message.value}`);
      } else {
        consumer.resume();
      }
    },
  });
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = consume
/** 
module.exports = consume;

// =============================
// In another file, you can do:
// =============================

const consume = require('./path/to/modified/consume');

// Callback function for primary topic messages
const handlePrimaryTopicMessage = (primaryMessage) => {
  console.log("Processing primary topic message:", primaryMessage);
  // Add your processing logic here
};

// Callback function for secondary topic messages
const handleSecondaryTopicMessage = (secondaryMessage) => {
  console.log("Processing secondary topic message:", secondaryMessage);
  // Add your processing logic here
};

// Pass the callbacks to the consume function
consume(handlePrimaryTopicMessage, handleSecondaryTopicMessage);
*/
