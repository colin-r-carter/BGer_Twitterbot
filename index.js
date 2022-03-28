const axios = require('axios').default;
const cheerio = require('cheerio');
const LanguageDetect = require('languagedetect');
require('dotenv').config();

const lngDetector = new LanguageDetect();


const regexBGer = /(\d+)([A-Z])_(\d+\/\d+)/g
const regexDate = /\d{2}.\d{2}.\d{4}/g
const apikey = process.env.API_KEY 
const env = "BGE-Update-Test" //Todo: Change to production 
const ifttt = "https://maker.ifttt.com/trigger/" + env + "/json/with/key/" + apikey;

//TODO: Remove String from date to get actual date. 
// Date with italian match: February 24, 2022 18:00:00
// Date with frencht match: March 22, 2022 18:00:00
    let d = new Date('March 22, 2022 18:00:00'),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear(),
        dayOfWeek = d.getDay();
        if (month.length < 2){ 
            month = '0' + month;
            };
        if (day.length < 2){ 
            day = '0' + day;
        };

    if(!(dayOfWeek === 6) && !(dayOfWeek  === 0)){
  
        let url = "https://www.bger.ch/ext/eurospider/live/de/php/aza/http/index_aza.php?date="+year+ month+ day+"&lang=de&mode=news";
        
        axios.get(url)
        .then((response) => {
            let $ = cheerio.load(response.data);
            // console.log($("tr"));
            let allElements = []; //convert cheerio object to normal array
            $("tr").each((index, element) => {
                let txt = $(element).text();
                txt = txt.replace(/\s\s+/g, ' ');
                allElements.push(txt);
            });
            console.log(allElements);
            for (let i = 0; i < allElements.length; i++) {
                // Runs 5 times, with values of step 0 through 4.
                let text = allElements[i];
                if(text.match(/\*/g)){
                    console.log(lngDetector.detect(text, 3));
                    let date = text.match(regexDate);
                    text = text.replace(regexDate, " ");
                    let BGer = text. match(regexBGer);
                    text = text.replace(regexBGer, " ");
                    text = text.replace(/\*/g, '');
                    next = allElements[i+1];
                    next = next.replace(/\*/g, '');
                    text = text.replace(/\n/g, "");
                    next = next.replace(/\n/g, "");
                    let output;
                    //Language detector performs very bad. We neet more text to classify. Todo: Read full decision.
                    if(lngDetector.detect(text, 1)[0][0] == 'french'){
                        output = "Le "+day +"." +month+"."+year+" le Tribunal féderal a proposé la décision " + BGer + " du "+ date + " pour la publication. Il traite: "+text+" -" +next +" Link: " + url; 
                    } else if(lngDetector.detect(text, 1)[0][0] == 'italian'){
                        output = "Il "+day +"." +month+"."+year+", il Tribunale federale ha destinato alla pubblicazione la decisione " + BGer + " del "+ date + ". Si tratta di: "+text+" -" +next +" Link: " + url; 
                    } else {
                        output = "Das Bundesgericht hat am "+day +"." +month+"."+year+" den Entscheid " + BGer + " vom "+ date + " zur Publikation vorgesehen. Er behandelt: "+text+" -" +next +" Link: " + url; 
                    }
                    
                    if(output){
                        output = output.replace(/\s+/g,' ').trim();
                        console.log(output);
                        console.log(output);
                        axios.post(ifttt, { "update" : output })
                          .then(function (response) {
                            console.log(response);
                          })
                          .catch(function (error) {
                            console.log(error);
                          });
                          console.log("Posted to IFTTT")
                    }
                }
              }              
        }).catch(function (e) {
        console.log(e);
    });    
    };

    