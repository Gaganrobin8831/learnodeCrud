const fs = require('fs');



function handleClassFileError(res, err) {
    if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'File not found' }));
    } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Error reading data' }));
    }
}

function writeClassJSONToFile(filePath, data, res) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.statusCode = 500;
            res.end('Error writing to file');
            return;
        }
        console.log('File updated successfully.');
        res.statusCode = 200;
        res.end('File updated successfully');
    });
}

function updateClassJSONData(filePath, updateCallback, res) {
    fs.readFile(filePath, 'utf8', (err, existingData) => {
        let jsonArray = [];

        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            res.statusCode = 500;
            res.end('Error reading file');
            return;
        }

        if (existingData) {
            try {
                jsonArray = JSON.parse(existingData);
                if (!Array.isArray(jsonArray)) {
                    throw new Error('File content is not an array');
                }
            } catch (e) {
                console.error('Error parsing existing JSON:', e.message);
                res.statusCode = 500;
                res.end('Error parsing existing JSON');
                return;
            }
        }

        updateCallback(jsonArray);

        writeClassJSONToFile(filePath, jsonArray, res);
    });
}



module.exports = { updateClassJSONData,handleClassFileError}