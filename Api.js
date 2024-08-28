const fs = require('fs')
const http = require('http')
const path = require('path');
const url = require('url');

const { updateJSONData,handleFileError}  = require('./userComponent/handler')

const PORT = 4000

const FILE_PATH = path.join(__dirname, 'example.json');



function handleRquest(req,res){
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;

    // console.log(parsedUrl);
    
    if (req.method === 'GET' && req.url === '/read') {

        
        
        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                handleFileError(res, err);
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
        });
    } else if(req.method === 'GET' && parsedUrl.pathname === '/read'){
        // console.log(id);

        fs.readFile(FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                handleFileError(res, err);
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            let mydata = JSON.parse(data)
          let dataById = mydata.filter(e => e.id == id )

      
           res.end(JSON.stringify(dataById))
        });  
    } else if (req.method === 'PUT' && req.url.startsWith('/update')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                const { id, username, age,classId } = parsedBody;

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

                    jsonArray[index] = { ...jsonArray[index], username, age ,classId};
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

    
}

const server = http.createServer(handleRquest)

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})