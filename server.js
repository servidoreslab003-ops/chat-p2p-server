const express = require('express');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();

// Configurar CORS para permitir conexiones desde cualquier lugar
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir archivos estáticos (tu cliente)
app.use(express.static('public'));

// Crear servidor HTTP
const server = require('http').createServer(app);

// Configurar PeerServer
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs',
    allow_discovery: true,
    proxied: true,  // Importante para Render
});

app.use('/peerjs', peerServer);

// Endpoint para verificar estado del servidor
app.get('/status', (req, res) => {
    const peers = peerServer._clients ? Object.keys(peerServer._clients).length : 0;
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        peers: peers,
        server: 'Render',
        version: '1.0.0'
    });
});

// Endpoint para obtener peers activos
app.get('/peers', (req, res) => {
    if (peerServer._clients) {
        const peers = Object.keys(peerServer._clients);
        res.json({ peers, count: peers.length });
    } else {
        res.json({ peers: [], count: 0 });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Puerto - Render asigna automáticamente
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor PeerJS corriendo en puerto ${PORT}`);
    console.log(`📡 PeerJS endpoint: /peerjs`);
    console.log(`📊 Estado: /status`);
    console.log(`👥 Peers activos: /peers`);
});

// Manejo de errores
peerServer.on('error', (error) => {
    console.error('❌ Error en PeerServer:', error);
});

peerServer.on('connection', (client) => {
    console.log(`🔗 Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`🔴 Cliente desconectado: ${client.getId()}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Apagando servidor...');
    server.close(() => {
        console.log('✅ Servidor apagado correctamente');
        process.exit(0);
    });
});