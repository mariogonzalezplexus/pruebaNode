const CronJob = require("node-cron");
const renderizadorService = require("../services/renderizadorService");

exports.arrancarJob = (dbTasks, dbImages) => {
  const scheduledJobFunction = CronJob.schedule("* * * * *", async () => {
    var datenow=new Date().toISOString()
    console.log( datenow + ": job triggered to check for new images to resize");
    
    // obteniendo tareas con el estado "pending" para redimensionarlas
    await dbTasks.find({status:"pending"}, async function(err, record) {
      if (err) {
          console.error(err);
      }else{
        for (element of record) {
          console.log("** Se ha encontrado este elemento encolado: "+element._id)
          await renderizadorService.resizer(dbTasks ,dbImages ,element._id,element.imagenOriginal,element._id, element.resolucion, element.path)
        }
      }
    });
});

  scheduledJobFunction.start();
}