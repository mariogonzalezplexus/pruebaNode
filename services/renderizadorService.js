const sharp = require('sharp')
const path = require('path');
const md5File = require('md5-file')
const fs = require('fs');

// funcion para redimensionar ficheros con la dependencia sharp

exports.resizer = async (dbTasks, dbImages, uuid, filePath, fileName, size, pathDestino) => {
    // redimensionado imagen
    fileresult= await sharp (filePath)
    .resize(parseInt(size))
    .toFile(pathDestino+fileName+".jpg" )
    
    // calcular MD5 fichero resultante
    const hash= await md5File(pathDestino+fileName+".jpg")

    // renombrar fichero con el MD5
    const oldPath = path.join(pathDestino+fileName +".jpg")  
    const newPath = path.join(pathDestino,hash +".jpg")
    
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