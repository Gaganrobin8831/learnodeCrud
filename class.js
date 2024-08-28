const http = require('http');
const fs = require('fs');
const path = require('path');
const { updateClassJSONData,handleClassFileError  } = require('./classesComponent/classHandler')
const { updateJSONData }  = require('./userComponent/handler')

const PORT = 9000;

const FILE_PATH = path.join(__dirname, 'example.json');
const CLASSES_FILE_PATH = path.join(__dirname, 'class.json');

function readUserData(filePath,readCallback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            handleClassFileError(res, err);
            return;
        }
       
        readCallback(JSON.parse(data));
    })
   
}




// let getData = userdetail.filter(classid => userdetail.classid === classId)
// console.log("This is data",getData);



const server = http.createServer((req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`); // Debugging log

    if (req.method === 'GET' && req.url === '/read') {
        fs.readFile(CLASSES_FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                handleClassFileError(res, err);
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
        });
    } else if (req.method === 'POST' && req.url === '/create') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                const { className,classId } = parsedBody;

                if (!className || classId === undefined) {
                    res.statusCode = 400;
                    res.end('Missing username or id');
                    return;
                }
                
           

                updateClassJSONData(CLASSES_FILE_PATH, (jsonArray) => {
                    const newId = jsonArray.length ? jsonArray[jsonArray.length - 1].id + 1 : 1;
                    jsonArray.push({ id:newId, className,classId });
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
                const { id,className,classId } = parsedBody;

                if (id === undefined) {
                    res.statusCode = 400;
                    res.end('Missing id');
                    return;
                }
                
              
               
                
                updateClassJSONData(CLASSES_FILE_PATH, (jsonArray) => {
                    const index = jsonArray.findIndex(item => item.id === id);
                    if (index === -1) {
                        res.statusCode = 404;
                        res.end('Record not found');
                        return;
                    }

                    jsonArray[index] = { ...jsonArray[index], className,classId};
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
        console.log(id);
        
        if (isNaN(id)) {
            res.statusCode = 400;
            res.end('Invalid ID');
            return;
        }



    updateClassJSONData(CLASSES_FILE_PATH, (jsonArray) => {
            const newArray = jsonArray.filter(item => item.id !== id);
            const next1 =  jsonArray.filter(item => item.id === id)
            console.log(next1[0].classId);

            readUserData(FILE_PATH,(data) => {
                data.map(classid => {
                    if (classid.classId === next1[0].classId) {  
                        updateJSONData(FILE_PATH, (jsonArray) => {
                            const index = jsonArray.findIndex(item => item.classId === next1[0].classId);
                            jsonArray[index] = { ...jsonArray[index],classId:null};
                            console.log(jsonArray[classid]);
                        }, res);
                       
                       
                    }
                    
                })
                
            })
    
     
          
            
            
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
