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
// this is the topic to which we want to write messages
const topic = "kube-out";

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers });

const consumer = kafka.consumer({ groupId: clientId });

const consume = async (callback) => {
  // first, we wait for the client to connect and subscribe to the given topic
  await consumer.connect();
  await consumer.subscribe({ topic });
  await consumer.run({
    // this function is called every time the consumer gets a new message
    eachMessage: async ({ message }) => {
      // here, we just log the message to the standard output
      consumer.pause();
      console.log("Waiting.....................................");
      if (callback) {
        //callback(JSON.stringify(message.value));
        //console.log(JSON.parse(message.value));
        await delay(15000);
        callback(JSON.parse(message.value));
        console.log(`received message: ${message.value}`);
      } else {
        consumer.resume();
      }
    },
  });
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = consume;
