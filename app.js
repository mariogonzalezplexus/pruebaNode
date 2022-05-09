const express = require('express')
const cors = require('cors')
const multer = require( 'multer')
const Datastore = require('nedb')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sizeOf = require('image-size');
const jobResizer= require('./crons/cronResizer');

const app = express()
app.use(cors())
app.use(express.json())
const PORT = 3000
const md5File = require('md5-file')

// Configuracion bases de datos en memoria:
const dbTasks = new Datastore({filename: __dirname + '/db/historicoTareas.dat', autoload: true});
const dbImages = new Datastore({filename: __dirname + '/db/historicoImagenes.dat', autoload: true});

//Sentencia para arrancar el job de procesar las imagenes encoladas cada X tiempo
jobResizer.arrancarJob(dbTasks, dbImages)

// configuracion para guardar la imagen enviada a traves del formdata gracias a la libreria multer
const storage = multer.diskStorage ({
    destination:(req, file, callback)=>{
        callback(null, 'Images')
    },
    filename: (req, file, cb)=>{
        cb(null,file.originalname+ '-' + uuidv4()+ ".jpg")
    }
})

// middleware para guardar imagenes enviadas a traves de un form-data
const upload = multer({ storage})

// si no existen... creacion de los directorios donde se guardan las imagenes originales y de salida
if (!fs.existsSync("Images")){
    fs.mkdirSync("Images");
}
if (!fs.existsSync("output")){
    fs.mkdirSync("output");
}

//endpoint para solicitar el redimensionado de una imagen
app.post('/task', upload.single('file'), async (req, res) => {
    
    console.log('llamada a endpoint de encolado de tarea ->')
    const uuid800=uuidv4()
    const uuid1024=uuidv4()
    
    try{
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

        nombreSinExtension= req.file.filename.slice(0, -4)

        // creacion de directorios Output de la imagen que se va a generar
        fs.mkdirSync("output/"+nombreSinExtension);
        fs.mkdirSync("output/"+nombreSinExtension+"/800");
        fs.mkdirSync("output/"+nombreSinExtension+"/1024");


        var docs = [
            {_id: uuid800, status: "pending", path: "output/"+nombreSinExtension+"/800", imagenOriginal: req.file.path, resolucion: "800", timestamp: datenow, lastUpdate: datenow},
            {_id: uuid1024, status: "pending", path: "output/"+nombreSinExtension+"/1024", imagenOriginal: req.file.path, resolucion: "1024", timestamp: datenow, lastUpdate: datenow}
        ];

        // creacion registros de tareas encoladas en base de datos
        dbTasks.insert(docs, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
            return record
        });

        // envío de la respuesta en caso de que el encolado de tareas y la creacion de directorios haya sido satisfactoria
        res.send({ data: 'tarea de renderizado en curso, puedes comprobar su estado consultado el endpoint /task/:taskid con estos UUIDs:  ' + uuid800 +"    "+ uuid1024})
    
    }catch(err){
        console.log(err)
        res.status(500).send({error:"unknown error"})
    }
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