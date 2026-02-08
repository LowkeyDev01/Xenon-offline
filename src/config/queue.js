import Queue from 'bull'

const downloadQueue = new Queue('downloads', {
    redis: { host: '127.0.0.1', port: 6379 }
});

export default downloadQueue;