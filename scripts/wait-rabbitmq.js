/* eslint-disable @typescript-eslint/no-var-requires */

const amqplib = require('amqplib');
const chalk = require('chalk');
const SECOND = 1000;

const log = msg => console.info(chalk.yellow(msg));

const wait = async () => {
  try {
    const conn = await amqplib.connect('amqp://localhost:5672');
    const channel = await conn.createChannel();
    process.exit();
  } catch {
    log(' -- Waiting for RabbitMQ to be ready...');
    setTimeout(() => wait(), 5 * SECOND);
  }
}

(async function() {
  await wait();
})();
