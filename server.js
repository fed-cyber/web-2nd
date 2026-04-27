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

function writeMovies(movies, callback) {
    fs.writeFile(DATA_FILE, JSON.stringify(movies, null, 2), 'utf8', (err) => {
        callback(err);
    });
}

function getIdFromUrl(url) {
    const parts = url.split('/');
    return parseInt(parts[2], 10);
}

function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            callback(null, data);
        } catch (err) {
            callback(err, null);
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

    if (req.url.startsWith('/movies/') && req.method === 'GET') {
        const id = getIdFromUrl(req.url);
        
        readMovies((err, movies) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to read movies data' }));
                return;
            }

            const movie = movies.find(m => m.id === id);

            if (!movie) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: `Movie with id ${id} not found` }));
                return;
            }

            res.writeHead(200);
            res.end(JSON.stringify(movie));
        });
        return;
    }

    if (req.url === '/movies' && req.method === 'POST') {
        parseBody(req, (err, newMovie) => {
            if (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                return;
            }

            readMovies((err, movies) => {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Failed to read movies data' }));
                    return;
                }

                const maxId = movies.reduce((max, m) => m.id > max ? m.id : max, 0);
                newMovie.id = maxId + 1;

                movies.push(newMovie);

                writeMovies(movies, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: 'Failed to save movie' }));
                        return;
                    }

                    res.writeHead(201);
                    res.end(JSON.stringify(newMovie));
                });
            });
        });
        return;
    }

    if (req.url.startsWith('/movies/') && req.method === 'PUT') {
        const id = getIdFromUrl(req.url);

        parseBody(req, (err, updatedData) => {
            if (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                return;
            }

            readMovies((err, movies) => {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Failed to read movies data' }));
                    return;
                }

                const index = movies.findIndex(m => m.id === id);

                if (index === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: `Movie with id ${id} not found` }));
                    return;
                }

                movies[index] = { ...movies[index], ...updatedData, id: id };

                writeMovies(movies, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: 'Failed to save movie' }));
                        return;
                    }

                    res.writeHead(200);
                    res.end(JSON.stringify(movies[index]));
                });
            });
        });
        return;
    }

    if (req.url.startsWith('/movies/') && req.method === 'DELETE') {
        const id = getIdFromUrl(req.url);

        readMovies((err, movies) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to read movies data' }));
                return;
            }

            const index = movies.findIndex(m => m.id === id);

            if (index === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: `Movie with id ${id} not found` }));
                return;
            }

            // Remove movie from array
            const deletedMovie = movies.splice(index, 1)[0];

            writeMovies(movies, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Failed to delete movie' }));
                    return;
                }

                res.writeHead(200);
                res.end(JSON.stringify({ message: `Movie '${deletedMovie.title}' deleted successfully` }));
            });
        });
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
    console.log(`🎬 Movie Review API running at http://localhost:${PORT}`);
    console.log(`📽️  Available endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/           - Welcome message`);
    console.log(`   GET    http://localhost:${PORT}/movies     - List all movies`);
    console.log(`   GET    http://localhost:${PORT}/movies/:id - Get single movie`);
    console.log(`   POST   http://localhost:${PORT}/movies     - Create new movie`);
    console.log(`   PUT    http://localhost:${PORT}/movies/:id - Update movie`);
    console.log(`   DELETE http://localhost:${PORT}/movies/:id - Delete movie`);
});
