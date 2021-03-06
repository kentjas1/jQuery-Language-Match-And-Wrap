/*
 * Right-to-Left Text Wrapper 2.0, jQuery plugin
 *
 * Copyright(c) 2013, Thomas Alexander
 * https://github.com/teeohhem/jQuery-Language-Match-And-Wrap
 *
 * 2.0 Rewrite by Jason Kent
 * https://github.com/kentjas1/jQuery-Language-Match-And-Wrap
 *
 * A jQuery plugin to find text from a certain language on your webpage, wrap it in a bdo[lang=''] so you 
 * can style text from different languages or assist screen readers in reading mixed content on your page.
 * Licensed under the MIT License
 */

(function($){
    "use strict";
    
    var dir = "auto",
        bdoStart = "",
        bdoEnd = "</bdo>",
        tempElem = "",
        boolReturn = "",
        correctedStr = "",
        regExTagClean = "",
        regExTagCleanSpace = "",
        regExTagCleanIE = "",
        regExTagCleanIE2 = "",
        regExUserLang = "",
        regExEnglish = "",
        regExNumber = "",
        regExSpecial = "",
        evaluatedResult = "",
        
        process = {
           /*
            * Method 'setDirection' corrects IE7-IE10 incorrect handling of direction 'auto', forcing right-to-left
            * direction
            */
            setDirection: function(){
                if($.browser.msie){
                     dir = "rtl";
                }
            },
           /*
            * Method 'init' sets the correct regular expression values to be used if they haven't been set
            * keeps the code from having to pass 'options' around to the different methods
            * 
            * @param {Object} containing user defined options
            */
            init: function(options){
                if(typeof regExTagClean !== "object"){
                    bdoStart = '<bdo dir="'+ dir +'" lang="'+ options.language +'">';
                    regExTagClean = new RegExp(/<\/bdo><bdo(.*?)>/ig);
                    regExTagCleanSpace = new RegExp(/<\/bdo>\s<bdo(.*?)>/ig);
                    regExTagCleanIE = new RegExp(/<\/span>\&nbsp\;<\/bdo><bdo(.*?)>/ig);
                    regExTagCleanIE2 = new RegExp(/<\/span>\&nbsp\;<\/bdo>\s<bdo(.*?)>/ig);
                    regExUserLang = options.languageRegExMap[options.language];
                    regExEnglish = options.languageRegExMap["en"];
                    regExNumber = options.nonAlphaRegExMap["number"];
                    regExSpecial = options.nonAlphaRegExMap["special"];
                }
            },
           /*
            * Method 'getContents' converts a String to a jQuery Object so the individual child nodes can be properly
            * evaluated
            * 
            * @param {String} containing HTML/plain text 
            * 
            * @return {jQuery Object} of element contents 
            */
            getContents: function(elem){
                return $("<div />").append(elem).contents();
            },
           /*
            * Method 'getHTML' converts a String to a HTML Object
            * 
            * @param {String} containing HTML/plain text
            * 
            * @return {HTML Object}
            */
            getHTML: function(elem){
                return $("<div />").append(elem).html();
            },
           /*
            * Method 'cleanTags' combines adjacent <bdo> tags into a single wrapper
            * 
            * @param {String} String of matched <bdo> wrapped text
            * 
            * @return {String} of combined tags
            */
            cleanTags: function(contents){
                var result = contents.replace(regExTagClean, "").replace(regExTagCleanSpace, " ");
                
                if($.browser.msie || $.browser.mozilla){
                    result = result.replace(regExTagCleanIE, "</span>&nbsp;").replace(regExTagCleanIE2, "</span>&nbsp;");
                }
                //console.log("cleanTags METHOD: *" + result);
                //alert("cleanTags METHOD: *" + result);
                return result;
            },
           /*
            * Method 'containsUserLang' checks to see if the String passed in contains user defined language 
            * 
            * @param {String} plain text
            * 
            * @return {Boolean}
            */
            containsUserLang: function(elem){
                //Because of an issue with Firefox's RegExp engine, must re-declare regex test on every call
                var userLangTest = new RegExp(regExUserLang),
                    result = userLangTest.test(elem);
                
                //console.log("containsUserLang METHOD: *" + result);
                return result;
            },
           /*
            * Method 'nonAlphaText' checks to see if the String passed in contains only integers and/or special characters
            * 
            * @param {String} plain text
            * 
            * @return {Boolean}
            */
            nonAlphaText: function(elem){
                //Because of an issue with Firefox's RegExp engine, must re-declare regex test on every call
                var specialCharTest = new RegExp(regExSpecial),
                    numberTest = new RegExp(regExNumber),
                    englishText = new RegExp(regExEnglish);
                
                boolReturn = (specialCharTest.test(elem) || numberTest.test(elem))  && !englishText.test(elem);
                
                //console.log("nonAlphaText METHOD: *" + boolReturn);
                
                return boolReturn;
            },
           /*
            * Method 'numberOverride' wraps numbers in <span dir="ltr"/> to correct IE and Firefox display issues
            * 
            * @param {String} plain text
            * 
            * @return {String}
            */
            numberOverride: function(elem){
                //Because of an issue with Firefox's RegExp engine, must re-declare regex test on every call
                var numberTest = new RegExp(regExNumber);
                
                 if(($.browser.msie || $.browser.mozilla) && numberTest.test(elem)){
                     correctedStr = "&nbsp;<span dir='ltr'>" + elem + "</span>&nbsp;";
                 } 
                 else {
                    correctedStr = elem;
                 }
                 
                 return correctedStr;
                    
            },
           /*
            * Method 'adjustValues' evaluates text between <bdo> tags for numbers and special characters to be 
            * included with the surrounding language properly
            * 
            * @param {String} of first pass of <bdo> wrapped text
            * 
            * @return {String} of sanitized unwrapped text 
            */  
            adjustValues: function(elem){
                
                var elemBlock = process.getContents(elem),
                    contentsArr = [],
                    curStr = "",
                    arrayHTML = "";
                 
                elemBlock.each(function(index){
                    //console.log("adjustValues METHOD - elemBlock index at: *" + index);
                    if(this.nodeType === 3){
                        //checking that its more than just white space
                        if($.trim(this.nodeValue).length !== 0){
                            
                            if(process.nonAlphaText(this.nodeValue)){
                                //Adjust mark-up of numbers for better cross-browser support
                                curStr = process.numberOverride(this.nodeValue);
                                
                                //console.log("adjustValues METHOD - elemBlock: contains non Alpha, contents length: *" + contentsArr.length);
                                if(contentsArr.length > 0){
                                    //console.log("adjustValues METHOD - contentsArr > 0, appending: *" + this.nodeValue + " and previous elem is  *" + contentsArr[(contentsArr.length - 1)]);
                                    arrayHTML = process.getHTML(contentsArr[(contentsArr.length - 1)]);
                                    contentsArr[(contentsArr.length - 1)] = process.getHTML($(arrayHTML).append(curStr));
                                }
                                else if(elemBlock.length > (index + 1)){
                                    //console.log("adjustValues METHOD - elemBlock: array 0, prepending");
                                    $(elemBlock[(index + 1)]).prepend(curStr);
                                }
                                else {
                                    //console.log("adjustValues METHOD: no more, just pushing: *" + elemBlock.length + "/" + index + 1);
                                    contentsArr.push(process.getHTML(this));
                                }
                            } 
                            else {
                                contentsArr.push(process.getHTML(this));
                                //console.log("adjustValues METHOD - elemBlock: no nonalpha, pushed length at: *" + contentsArr.length + "  ===  " + contentsArr);
                            }
                        }
                    }
                    else {
                        contentsArr.push(process.getHTML(this));
                        //console.log("adjustValues METHOD - elemBlock: not a text node, pushed length at: *" + contentsArr.length + "  ===  " + contentsArr);
                    }
                });
                
                return contentsArr.join(' ');
                 
            },
           /* 
            * Method 'wrapRTL' wraps rtl text with <bdo> tag then calls 'adjustValues' to evaluate data between tags
            * 
            * @param {String} containing right-to-left text
            * 
            * @return {String} of wrapped right-to-left text
            * 
            */
            wrapRTL: function(elem){
                var tmp = elem.replace(regExUserLang, bdoStart + "$1" + bdoEnd);
                
                return process.adjustValues(tmp);
            },
           /*
            * Method 'matchText' evaluates text containing mixed languages to determine if they should be evaluated 
            * separately then sends to wrapper method
            * 
            * @param {String} plain text containing mixed languages
            * 
            * @return {String} of user-defined language text wrapped in <bdo> tags
            */
            matchText: function(elem){
                var splitReg = new RegExp(/(\S*[\/]+\S*)/g),
                    splitList = "",
                    stringArr = [],
                    tmp = "",
                    m = 0,
                    splitSize = 0;
                
                if(splitReg.test(elem)){
                    //console.log("matchText METHOD - contains '/' : *" + elem);
                    splitList = elem.split("/");
                    
                    //Evaluate split to see if text on either side of '/' contain either RTL or only numbers
                    splitList.forEach(function(curListElem){
                       if(process.containsUserLang(curListElem) || process.nonAlphaText(curListElem)){
                           splitSize++;
                       } 
                    });
                    
                    //console.log("matchText METHOD - split differences : " + splitSize + "/" + splitList.length);
                    //if not all text between '/' contains RTL or only numbers, evaluate each section separately, re-adding '/'
                    if(splitSize !== splitList.length){
                        for(m; m < splitList.length; m++){
                            //console.log("matchText METHOD - loop at : *" + splitList[m]);
                            //Only send to wrapper function if text contains RTL
                            if(process.containsUserLang(splitList[m])){
                                tmp = process.wrapRTL(splitList[m]);
                            }
                            else {
                                tmp = splitList[m];
                            }
                            
                            //If not at the last element in the list, re-add '/'
                            if((m + 1) < splitList.length){
                                tmp += "/";
                            }
                            
                            stringArr.push(tmp);
                        }
                        tmp = stringArr.join('');
                    }
                    else {
                        //console.log("matchText METHOD - all items in list contain RTL or only numbers, evaluate as a whole");
                        tmp = process.wrapRTL(elem);
                    }
                } 
                else {
                    //console.log("matchText METHOD - text doesn't contain '/'");
                    tmp = process.wrapRTL(elem);
                }
                
                return process.cleanTags(tmp);
            },
           /*
            * Method 'runMatch' separates out the plain text from HTML elements, evaluates the plain text, recursive
            * call if HTML element
            * 
            * @param {Object} jQuery Object to be evaluated
            * @param {Object} user defined options
            * 
            * @return {String} of completed text to be sent back to the DOM
            */
            runMatch: function(elem, options){
                elem = elem instanceof jQuery ? elem : $(elem);
                var curElem = elem.contents(),
                    elemArr = [];
                
                curElem.each(function(){
                    //if the element is text, evaluate language
                    if(this.nodeType === 3){
                        //only send to wrapper function if text contains rtl language
                        if(process.containsUserLang(this.nodeValue)){ 
                            tempElem = process.matchText($.trim(this.nodeValue));
                        }
                        else {
                            tempElem = this.nodeValue;
                        }
                    }
                    //if its HTML then recursive call on the HTML element
                    else if(this.nodeType !== 8 && this.nodeName !== "BR"){
                        tempElem = process.getHTML($(this).languageMatchAndWrap(options));
                    }
                    else {
                        tempElem = process.getHTML(this);
                    }
                    elemArr.push(tempElem);
                });
                
                return elemArr.join(''); 
            }
        };
        
        //Set direction onLoad
        process.setDirection();
        
    $.fn.languageMatchAndWrap = function(options) {
        options = $.extend(true,defaultOptions,options);
        
        //Initialize the RegExp values
        process.init(options);
        
        this.each(function() {
            evaluatedResult = process.runMatch(this, options);
            $(this).empty().html(evaluatedResult); //for IE7&8 support, must call .empty()
        });
        return this;
    };
     
    var defaultOptions = {
            language : 'en',
            languageRegExMap : {
                en: /(\S*[\u0041-\u005A\u0061-\u007A]+\S*)/g,
                he: /(\S*[\u0590-\u05FF]+\S*)/g
            },
            nonAlphaRegExMap : {
                number: /(\S*[0-9]+\S*)/g,
                special: /(\S*[;.,\?\/!\-\u2014]+\S*)/g
            }
    };
    
})(jQuery);