const renderizador = require('../services/renderizadorService')
var assert = require('assert');
var request = require('supertest')
var request = request("http://localhost:3000")
var path = require('path')
const fs = require('fs');

var app = require('../app.js')

const Datastore = require('nedb')
const dbTasksTest = new Datastore({filename: __dirname + '/db/historicoTareas.dat', autoload: true});
const dbImagesTest = new Datastore({filename: __dirname + '/db/historicoImagenes.dat', autoload: true});


// ********** Con jest: **********

// describe('test hola mundo', () => {
//     test('1+2 is 3', () => {
//         expect(1+2).toBe(3)
//     })
// })

// ********** Con mocha: **********

// describe('test hola mundo', () => {
//     it('1+2 is 3', () => {
//         assert.equal(1+2,3)
//     })
// })


describe('test endpoint obtener detalles tarea', function() {
    before(function () {
        // Creamos una tarea "dummy" con id conocido para poder consultarla en el test
        var datenow=new Date().toISOString()
        var docs = [
            {_id: "testuuid800", status: "pending", path: "pathtest/800", imagenOriginal: "pathtest/800", resolucion: "800", timestamp: datenow, lastUpdate: datenow}
        ];

        // creacion registros de tareas encoladas en base de datos
        dbTasksTest.insert(docs, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
            return record
        });
      })
    
    describe('POST', function(){
        it('Should return json as default data format', function(done){
            request.get('/task/testuuid800')
                 .expect(200, done);
        })
    })

    after(function () {
        // borrando la tarea creada de test para evitar conflictos la proxima vez que se realicen tests
        dbTasksTest.remove({_id: "testuuid800"}, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
        })
      })
})

describe('test endpoint crear tareas', function() {
    describe('POST', function(){
        it('Should return 200 status code and 2 Ids', function(done){

            request.post('/task')
                .attach('file', path.resolve(__dirname, './testResources/Test-img.jpg'))
                .expect(200)
                .expect(function(res) {
                    assert.notEqual(res.body.uuid1024, null)
                    assert.notEqual(res.body.uuid800, null)
                    assert.equal(res.body.data, "tarea de renderizado en curso, puedes comprobar el estado de la tarea consultando el endpoint /task/:taskid")
                })
                .end(done) // call done callback
        })
    })
})


describe('test servicio renderizado de imagenes', function() {
    before(function () {
        // Creamos una tarea "dummy" con id conocido para poder procesarla en el test
        var datenow=new Date().toISOString()

        // creando el path destino de la imagen generada para el test
        fs.mkdirSync("output/test");
        fs.mkdirSync("output/test/800");
        var docs = [
            {_id: "testuuid800", status: "pending", path: "output/test/800", imagenOriginal: "test/testResources/Test-img.jpg", resolucion: "800", timestamp: datenow, lastUpdate: datenow}
        ];

        // creacion registros de tareas encoladas en base de datos
        dbTasksTest.insert(docs, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
            return record
        });
      })
    
    describe('test servicio', function(){
        it('Should generate an img on the test path', async function(){
            await renderizador.resizer(dbTasksTest, dbImagesTest, "testuuid800", "test/testResources/Test-img.jpg", "testName", 800, "output/test/800")
            
        })
    })

    after(function (done) {
        // borrando la tarea encolada y la imagen generada para evitar conflictos en futuros tests
        dbTasksTest.remove({_id: "testuuid800"}, function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
        })
        console.log(__dirname + '/output/test')
        
        fs.rmSync(__dirname + '/../output/test', { recursive: true, force: true })
        done()
        
      })
})