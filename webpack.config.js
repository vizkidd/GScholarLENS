const path = require('path');
const cluster = require('cluster');
const workerThreads = require('worker_threads');

module.exports = {
  entry: ['./content/init.js', './workers/publicationWorker.min.js', './workers/retractionWorker.min.js', './content/GScholarLENS.js' ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'content'),
  },
};
