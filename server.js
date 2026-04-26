const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'movie', 'movie.json');

function readMovies(callback) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            callback(err, null);
            return;
        }
        try {
            const movies = JSON.parse(data);
            callback(null, movies);
        } catch (parseErr) {
            callback(parseErr, null);
        }
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Welcome to Movie Review API!' }));
        return;
    }

    if (req.url === '/movies' && req.method === 'GET') {
        readMovies((err, movies) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to read movies data' }));
                return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(movies));
        });
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
    console.log(`🎬 Movie Review API running at http://localhost:${PORT}`);
    console.log(`📽️  Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/         - Welcome message`);
    console.log(`   GET  http://localhost:${PORT}/movies   - List all movies`);
});
