const http = require('http');
const fs = require('fs');
const path = require('path');
const { updateJSONData, handleFileError, readFile } = require('./userComponent/handler')
const { updateClassJSONData } = require('./classesComponent/classHandler')
const PORT = 8000;

const FILE_PATH = path.join(__dirname, 'example.json');
const CLASSES_FILE_PATH = path.join(__dirname, 'class.json');

const server = http.createServer((req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`); // Debugging log

    if (req.method === 'GET' && req.url === '/read') {
        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                handleFileError(res, err);
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            // res.end(data);

            let newdata = JSON.parse(data)
            // console.log();
            function loadData(data) {
                console.log(data);
               res.end(JSON.stringify(data))
            }

            readFile(CLASSES_FILE_PATH, (jsonArray) => {

                const classMap = new Map(jsonArray.map(cls => [cls.classId, cls]));

                const updatedData = newdata.map(user => {
                    const classDetails = classMap.get(user.classId);


                    return {
                        ...user,
                        classId: classDetails ? classDetails : user.classId
                    };
                });

                loadData(updatedData)

            })

        });
    } else if (req.method === 'POST' && req.url === '/create') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                const { username, age, classId } = parsedBody;

                if (!username) {
                    res.statusCode = 400;
                    res.end('Missing username or id');
                    return;
                }


                updateJSONData(FILE_PATH, (jsonArray) => {
                    const newId = jsonArray.length ? jsonArray[jsonArray.length - 1].id + 1 : 1;
                    jsonArray.push({ username, id: newId, age, classId : null });
                }, res);


            } catch (e) {
                console.error('Error parsing JSON:', e.message);
                res.statusCode = 400;
                res.end('Invalid JSON');
            }
        });

    } else if (req.method === 'PUT' && req.url.startsWith('/update')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                const { id, username, age, classId } = parsedBody;

                if (id === undefined) {
                    res.statusCode = 400;
                    res.end('Missing id');
                    return;
                }

                updateJSONData(FILE_PATH, (jsonArray) => {
                    const index = jsonArray.findIndex(item => item.id === id);
                    if (index === -1) {
                        res.statusCode = 404;
                        res.end('Record not found');
                        return;
                    }

                    jsonArray[index] = { ...jsonArray[index], username, age, classId };
                }, res);
            } catch (e) {
                console.error('Error parsing JSON:', e.message);
                res.statusCode = 400;
                res.end('Invalid JSON');
            }
        });

    } else if (req.method === 'DELETE' && req.url.startsWith('/delete')) {
        const urlParts = req.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 1], 10);

        if (isNaN(id)) {
            res.statusCode = 400;
            res.end('Invalid ID');
            return;
        }

        updateJSONData(FILE_PATH, (jsonArray) => {
            const newArray = jsonArray.filter(item => item.id !== id);
            if (newArray.length === jsonArray.length) {
                res.statusCode = 404;
                res.end('Record not found');
                return;
            }
            jsonArray.length = 0;
            jsonArray.push(...newArray);
        }, res);

    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
