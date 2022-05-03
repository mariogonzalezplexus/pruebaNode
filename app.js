const express = require('express')
const cors = require('cors')
const multer = require( 'multer')
const sharp = require('sharp')
const Datastore = require('nedb')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const app = express()
app.use(cors())
app.use(express.json())
const PORT = 3000
const md5File = require('md5-file')


const dbTasks = new Datastore({filename: __dirname + '/db/historicoTareas.dat', autoload: true});
const dbImages = new Datastore({filename: __dirname + '/db/historicoImagenes.dat', autoload: true});

// funcion para redimensionar ficheros con la dependencia sharp
const renderizador = async (uuid, filePath, fileName, size, nombreSinExtension) =>{
    // redimensionado imagen
    fileresult= await sharp (filePath)
    .resize(size)
    .toFile("output/"+nombreSinExtension+"/"+size+"/"+fileName )
    
    // calcular MD5 fichero resultante
    const hash= await md5File("output/"+nombreSinExtension+"/"+size+"/"+fileName)

    // renombrar fichero con el MD5
    const oldPath = path.join(__dirname, "output/",nombreSinExtension+"/"+size+"/"+fileName)  
    const newPath = path.join(__dirname, "output",nombreSinExtension,size.toString(),hash + ".jpg")
    
    fs.renameSync(oldPath, newPath) 
    
    var file= {path: newPath, name: hash + ".jpg", md5: hash, fileresult:fileresult};

    // cambiar estado tarea
    dbTasks.update({_id: uuid}, {$set: {
                                        nombre: file.name, 
                                        path: file.path,
                                        status: "finished",
                                        lastUpdate:new Date().toISOString(),
                                        md5: file.md5}
                                    }, 
                                {}, 
                                function(err, num) {
                                    if (err) {
                                        console.error(err);
                                        return;
                                    }
                                });
    
    console.log("Task finished: file already resized to "+ size +" " +uuid)
        // Guardar imagen final
    dbImages.insert({   timestamp: new Date().toISOString(),
        md5: file.md5,
        path: file.path,
        width: fileresult.width,
        height: fileresult.height
        }, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
        return record
    });

}

// configuracion para guardar la imagen enviada a traves del formdata gracias a la libreria multer
const storage = multer.diskStorage ({
    destination:(req, file, callback)=>{
        callback(null, 'Images')
    },
    filename: (req, file, cb)=>{
        cb(null,file.originalname+ '-' + uuidv4()+ ".jpg")
    }
})

if (!fs.existsSync("Images")){
    fs.mkdirSync("Images");
}
if (!fs.existsSync("output")){
    fs.mkdirSync("output");
}

// middleware para guardar imagenes enviadas a traves de un form-data
const upload = multer({ storage})


//endpoint para solicitar el redimensionado de una imagen
app.post('/task', upload.single('file'), async (req, res) => {
    
    console.log('llamada a endpoint de renderizado ->')
    const uuid800=uuidv4()
    const uuid1024=uuidv4()
    
    // envio de la respuesta lo primero para no bloquear la llamada
    res.send({ data: 'tarea de renderizado en curso, puedes comprobar su estado consultado el endpoint /task/:taskid con estos UUIDs:  ' + uuid800 +"    "+ uuid1024})
    
    // guardado detalles imagen original:

    var hashOriginal= await md5File(req.file.path)
    
    var dimensions = sizeOf(req.file.path);
    
    dbImages.insert({   timestamp: new Date().toISOString(),
                        md5: hashOriginal,
                        path: req.file.path,
                        width: dimensions.width,
                        height: dimensions.height
    }, function(err, record) {
        if (err) {
            console.error(err);
            return;
        }
        return record
    });

    var datenow=new Date().toISOString()
    var docs = [
        {_id: uuid800, status: "pending", imagenOriginal: req.file.filename, resolucion: "800", timestamp: datenow, lastUpdate: datenow},
        {_id: uuid1024, status: "pending", imagenOriginal: req.file.filename, resolucion: "1024", timestamp: datenow, lastUpdate: datenow}
    ];
    
    nombreSinExtension= req.file.filename.slice(0, -4)
    fs.mkdirSync("output/"+nombreSinExtension);
    fs.mkdirSync("output/"+nombreSinExtension+"/800");
    fs.mkdirSync("output/"+nombreSinExtension+"/1024");


    // creacion registros de tareas encoladas en base de datos
    dbTasks.insert(docs, function(err, record) {
        if (err) {
            console.error(err);
            return;
        }
        return record
    });

    renderizador(uuid1024, req.file.path, req.file.filename, 1024, nombreSinExtension)
    renderizador(uuid800, req.file.path, req.file.filename, 800, nombreSinExtension)
    
})


app.get('/task/:taskid', (req, res) => {
    
    console.log('consultando tarea ->'+ req.params.taskid)
    
    dbTasks.find({_id:req.params.taskid}, function(err, record) {
        if (err) {
            console.error(err);
            res.code(400).send("Hubo un error desconocido")
        }else{
            res.send({ data: record })
        }
    });
})

app.listen (PORT, () => {
    console.log('sirviendo en el puerto:' + PORT)
})