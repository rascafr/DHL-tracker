const request = require("request");
const alert = require("alert-node");
const clc = require("cli-color");
const red = clc.red.bold;
const yellow = clc.yellow;

const AWB_CODE = 'XX-YY-ZZ'; // 10 digit number from DHL
let stepId = -1, newStepId = -1;

// -------------------- functions -------------------- //

/**
 * Get the tracking JSON result object
 * @param {string} awb the DHL AWB tracking number 
 * @param {*} cb callback with the result JSON (or null if an error occurred)
 */
function getDeliveryResult(awb, cb) {
    request({uri: `https://www.dhl.fr/shipmentTracking?AWB=${AWB_CODE}&countryCode=fr&languageCode=fr&_=1542895666503`}, function(error, response, body) {
        let deliveryResult = JSON.parse(body);
        let deliverySteps = deliveryResult.results ? deliveryResult.results[0].checkpoints : null;
        cb(deliverySteps);
    });
}

/**
 * Get the last delivery step, as its name indicates
 * @param {JSON} deliveryData the result JSON object from DHL's API
 */
function getLastDeliveryStep(deliveryData) {
    let amount = deliveryData.length;
    let lastStep = deliveryData.find((s) => {
        return s.counter === amount;
    });
    return lastStep;
}

/**
 * Main process loop
 */
function mainLoop() {
    setTimeout(() => {
        console.log('====> asking DHL about updates...');

        // get data
        getDeliveryResult(AWB_CODE, (deliverySteps) => {

            // check if code is valid / has data
            if (!deliverySteps) {
                console.log(red('Error: given DHL AWB code is not valid, or DHL API returned some data I cannot use...'));
                process.exit();
            }

            // get the last one
            let lastStep = getLastDeliveryStep(deliverySteps);

            // get step id
            newStepId = lastStep.counter;

            // different?
            if (newStepId !== stepId) {
                stepId = newStepId;
                let descScript = '====> DHL update available!\n====> New status: ' + lastStep.description;
                console.log(red(descScript));
                alert(descScript); // show a system alert when a new step is available
            } else {
                console.log(yellow('====> No update available...'));
            }

            console.log('====> done!');
            mainLoop();
        });
    }, 60*1000); // each minute
}

// -------------------- main code entry -------------------- //

// yeah mate, some ASCII art
console.log(`
                                 |                                             
                                 |                                             
                                 |                                             
                                _|_                                            
                               /___\\                                           
                              /_____\\                                          
                             /oo   oo\\                                         
 \\___________________________\\       /___________________________/             
  '-----------|------|--------\\_____/--------|------|-----------'              
             ( )    ( )     O|OOo|oOO|O     ( )    ( )   

                             ____  __  ____ 
                            / __ \\/ / / / / 
                           / / / / /_/ / /  
                          / /_/ / __  / /___
                         /_____/_/ /_/_____/
                                                
`
)

console.log(' === DHL tracker will start...soon! === ');
mainLoop();