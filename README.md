# Prueba Back Node  #
## Arquitectura ##

Se ha optado por el desarrollo de la aplicación con el framework express, como base de datos, se ha optado por NeDb, una base de datos embebida en memoria, se trata de una base de datos no relacional y se ha elegido por simplicidad a la hora de desarrollar y desplegar la prueba. NeDB tiene la opción de guardar sus datos solamente en memoria o de recurrir a un fichero para su persistencia y asi no perder la información después de cada reinicio de la aplicacion, este es el caso de uso que se ha elegido, a la hora de arrancar la aplicación, si todavía no existen, serán creados automáticamente dos ficheros .dat correspondientes a sendas bases de datos, uno de ellos con la informacion de las **tareas** encoladas y su estado, y otro con la información de las **imágenes** de entrada y salida con sus detalles.

En cuanto a las imágenes, serán almacenadas también dentro del directorio del proyecto, las imágenes subidas, son almacenadas en el directorio ***Images**** y las de salida, como se solicita en las especificaciones, en el directorio ***Output/nombreOriginalImagen+UUID/xxx*** donde xxx es el ancho de resolución de la imagen redimensionada, es decir, 800 o 1024.
Añadir, que se ha implementado un uuid automático que se añade al final del nombre de las imágenes para asi poder enviar varias veces la misma imagen sin que haya conflictos de directorios y ficheros ya existentes

## API ##
se añadira una coleccion de Postman en el repositorio con ejemplos de las siguientes llamadas

POST [localhost:3000/task](URL "localhost:3000/task") creará una solicitud de procesado de imagen

Este endpoint recibirá una imagen a través de un **form-data en el body** con el nombre **file**

respuesta:
```json

{
    "data": "tarea de renderizado en curso, puedes comprobar su estado consultado el endpoint /task/:taskid con estos UUIDs:  ef884736-5ae4-40b5-99ba-7384863ac84e    74d0664c-c807-4612-b755-1d321f648ae0"
}
```

GET [localhost:3000/task/:taskid](URL "localhost:3000/task/:taskid") nos devolverá el estado del procesado

```json

{
    "data": [
        {
            "_id": "ef884736-5ae4-40b5-99ba-7384863ac84e",
            "status": "finished",
            "imagenOriginal": "Test-Product.jpg-8a434380-b6f5-43e0-89ab-4fac080ad11c.jpg",
            "resolucion": "800",
            "timestamp": "2022-05-03T16:08:03.515Z",
            "lastUpdate": "2022-05-03T16:08:03.585Z",
            "nombre": "62660bad3d8a777a87180ab34f5111f2.jpg",
            "path": "C:\\Users\\mario.gonzalezsanche\\Documents\\PRUEBAS\\redimensionar-imagenes\\output\\Test-Product.jpg-8a434380-b6f5-43e0-89ab-4fac080ad11c\\800\\62660bad3d8a777a87180ab34f5111f2.jpg",
            "md5": "62660bad3d8a777a87180ab34f5111f2"
        }
    ]
}
```

## Como ejecutar el proyecto ##

1- Instalar todas las dependencias con
```
npm install
```

2- Ejecutar el proyecto con 

```
node app.js
```

3- Ejecutar las llamadas con la coleccion adjunta en el repositorio en ***postman/redimensionar imagenes.postman_collection.json***
