'use strict';

const argument = require('yargs').argv;
var request = require('request');

var crypto;
var valueInUsd;

var getLastestValTokenInUsd = function () {
    return new Promise( function (resolve) {
        var displayOutput = [];

        var btcOutputArray = { "token": "BTC", "amount": 0, "timestamp": 0 };
        var ethOutputArray = { "token": "ETH", "amount": 0, "timestamp": 0 };
        var xrpOutputArray = { "token": "XRP", "amount": 0, "timestamp": 0 };

        var lineView = require('readline').createInterface({
            input: require('fs').createReadStream('transactions.csv')
        });

        lineView.on('line', function (line) {

            var jsonLine = {};
            var lineSplit = line.split(',');

            jsonLine.timestamp = lineSplit[0];
            jsonLine.transaction_type = lineSplit[1];
            jsonLine.token = lineSplit[2];
            jsonLine.amount = lineSplit[3];

            if (jsonLine.token === 'ETH') {
                if (jsonLine.timestamp > ethOutputArray.timestamp) {
                    ethOutputArray.amount = jsonLine.amount;
                    ethOutputArray.timestamp = jsonLine.timestamp;
                }
            }
            else if (jsonLine.token === 'BTC') {

                if (jsonLine.timestamp > btcOutputArray.timestamp) {
                    btcOutputArray.amount = jsonLine.amount;
                    btcOutputArray.timestamp = jsonLine.timestamp

                }
            }
            else if (jsonLine.token === 'XRP') {

                if (jsonLine.timestamp > xrpOutputArray.timestamp) {
                    xrpOutputArray.amount = jsonLine.amount;
                    xrpOutputArray.timestamp = jsonLine.timestamp;
                }
            }
        }

        );
        lineView.on('close', function (line) {

            crypto = getUSDValues();

            crypto.then(function (result) {
                valueInUsd = result;
                ethOutputArray.amount = ethOutputArray.amount * valueInUsd.ETH.USD;
                btcOutputArray.amount = btcOutputArray.amount * valueInUsd.ETH.USD;
                xrpOutputArray.amount = xrpOutputArray.amount * valueInUsd.ETH.USD;

                displayOutput.push(ethOutputArray);
                displayOutput.push(btcOutputArray);
                displayOutput.push(xrpOutputArray);
                resolve(displayOutput);
            }, function (err) {
                console.log(err);
            })

        });
    })
}



var getPorfolioValue = function() {
    console.log("cyptoLatest");
    console.log("Date",argument.date);
    return new Promise(function (resolve) {
        
        var displayOutput = [];

        var btcOutputArray = [];
        var ethOutputArray = [];
        var xrpOutputArray = [];

        var lineView = require('readline').createInterface({
            input: require('fs').createReadStream('transactions.csv')
        });

        lineView.on('line', function (line) {

            var jsonLine = {};
            var lineSplit = line.split(',');

            jsonLine.timestamp = lineSplit[0];
            jsonLine.transaction_type = lineSplit[1];
            jsonLine.token = lineSplit[2];
            jsonLine.amount = lineSplit[3];

        
            var d = new Date(jsonLine.timestamp * 1000);
            var dateFromCSV = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
            
                if(jsonLine.token === 'ETH'){
                    if(argument.date === dateFromCSV){
                        ethOutputArray.push({"token":jsonLine.token,"amount":jsonLine.amount * valueInUsd.ETH.USD})
                    }
                } else if (jsonLine.token === 'BTC'){
    
                    if(argument.date === dateFromCSV){
                        btcOutputArray.push({"token":jsonLine.token,"amount":jsonLine.amount * valueInUsd.ETH.USD})
                    }
                }
                else if (jsonLine.token === 'XRP'){
    
                    if(argument.date === dateFromCSV){
                        xrpOutputArray.push({"token":jsonLine.token,"amount":jsonLine.amount * valueInUsd.ETH.USD})
                    }
                }
        }

        )
    ;
        lineView.on('close', function (line) {
                displayOutput.push(ethOutputArray);
                displayOutput.push(btcOutputArray);
                displayOutput.push(xrpOutputArray);
                resolve(displayOutput);

        });
        
    });
}




function getUSDValues() {
    
    const APIKEY = '3789ea397be622354552b3ab2a826e4379b5da952de997d3cff964ed4f0786ee';
    var cryptoURL = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,DASH&tsyms=BTC,USD,EUR&api_key=${APIKEY}`; 

    var options = {
        url: cryptoURL,
        headers: {
            'User-Agent': 'request'
        }
    };

    return new Promise(function (resolve, reject) {
        
        request.get(options, function (err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        })
    })

}


function filterByProperty(array, props, value){
    
    var filteredResults = [];

    for(var i = 0; i < array.length; i++){

        var obj = array[i];

        for(var key in obj){
            if(typeof(obj[key] == "object")){
                var item = obj[key];
                if(item[props] == value){
                    filteredResults.push(item);
                }
            }
        }

    }    

    return filteredResults;

}




if(argument.token === undefined && argument.date === undefined){
    console.log("Given no parameters, return the latest portfolio value of tokens in USD");
  getLastestValTokenInUsd().then(function (result) { console.log(result); });
}
else if (argument.token != undefined && argument.date === undefined){
    console.log("Given a token, return the latest portfolio value for that token in USD");
    getLastestValTokenInUsd().then(function (result) { 
        var resultPerToken =  result.filter(function(record) {
            return record.token === argument.token;
            })
            console.log(resultPerToken);
     });
}
else if (argument.date != undefined && argument.token === undefined){
    console.log("Given a date, return the portfolio value per token in USD on that date");
    crypto = getUSDValues();
    crypto.then(function (result) {
     valueInUsd = result;
     getPorfolioValue().then(function (result) { console.log(result); });
 }, function (err) {
     console.log(err);
 })
    
}
else if (argument.token != undefined && argument.date != undefined){
    console.log("Given a date and a token, return the portfolio value of that token in USD on that date");
    crypto = getUSDValues();
    crypto.then(function (usdValue) {
    valueInUsd = usdValue;
     getPorfolioValue().then(function (result) { 
         
        var resultPerToken =  filterByProperty(result,"token",argument.token);
            console.log(resultPerToken); 
        });
 }, function (err) {
     console.log(err);
 })
}