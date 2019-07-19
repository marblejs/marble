/* eslint-disable @typescript-eslint/no-var-requires */

const amqplib = require('amqplib');
const chalk = require('chalk').default;
const SECOND = 1000;

const log = msg => console.info(chalk.yellow(msg));

const waitForRabbitMq = async () => {
  try {
    await amqplib.connect('amqp://localhost:5672');
    process.exit();
  } catch(err) {
    log(' -- Waiting for RabbitMQ to be ready...');
    setTimeout(() => waitForRabbitMq(), 5 * SECOND);
  }
}

(async function() {
  await waitForRabbitMq();
})();
