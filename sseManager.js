let clients = [];

const addClient = (res) => {
    console.log("🚀 ~ addClient ~ res:", res)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);

    // Remove client if connection is closed
    res.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
};
  
const sendProgressUpdate = (message) => {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
};

module.exports = { addClient, sendProgressUpdate };
