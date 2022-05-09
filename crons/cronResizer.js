const CronJob = require("node-cron");

exports.arrancarJob = () => {
  const scheduledJobFunction = CronJob.schedule("* * * * *", () => {
    var datenow=new Date().toISOString()
    console.log( datenow + " ejecutando este job cada minuto :)");
  });

  scheduledJobFunction.start();
}