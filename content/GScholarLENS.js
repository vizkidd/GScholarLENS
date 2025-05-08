// // Load the font using JavaScript
const fontPath = chrome.runtime.getURL("fonts/SchibstedGrotesk.ttf");
const schibsted_grotesk = new FontFace('schibsted-grotesk', `url(${fontPath})`);
// let csp_hash_map;
let excelData = false;
let retractionWatchDB = false;
let profileScraped = false;

// Create TSV content
let tsvContent = "Index\tTitle\tAuthors\tTotal_Authors\tYear\tCitations\tAdjusted_Citations\tAdjusment_Weight\tJournal\tQ*\tImpactFactor_5years\tPublication_Considered\tFirst_Author\tSecond_Author\tCo_Author\tCorresponding_Author\n"; // Header row

// Add the font to the document once it's loaded
schibsted_grotesk.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
    document.body.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
}).catch((error) => {
    console.error('Font failed to load:', error);
});

// Function to load scripts dynamically and insert them into the page with a callback
async function loadScript(url, callback, id) {
    // Adding the script tag to the head as suggested before
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.id = id;
    // script.integrity = csp_hash_map.get(full_filename);
    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
    return (true);
}

// async function loadScriptURL(url, callback, id) {
//     // Adding the script tag to the head as suggested before
//     const scriptResponse = await fetch(url);

//     if (!scriptResponse.ok) {
//         throw new Error(`loadScriptURL() Error: ${scriptResponse.status}`);
//     }

//     const scriptText = await scriptResponse.text();

//     var head = document.head;
//     var script = document.createElement('script');
//     script.type = 'text/javascript';
//     // script.src = url;
//     script.id = id;
//     script.textContent = scriptText;
//     console.log("Script loaded: " + url);
//     // script.integrity = csp_hash_map.get(full_filename);
//     // Then bind the event to the callback function.
//     // There are several events for cross browser compatibility.
//     script.onreadystatechange = callback;
//     script.onload = callback;

//     // Fire the loading
//     head.appendChild(script);
//     return (true);
// }

// async function loadScriptURL(url, callback, id) {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
//     const code = await res.text();
  
//     // Create a blob + object URL
//     const blob = new Blob([code], { type: 'text/javascript' });
//     const blobUrl = URL.createObjectURL(blob);
  
//     const script = document.createElement('script');
//     script.id = id;
//     script.src = blobUrl;
//     script.onload = () => {
//       URL.revokeObjectURL(blobUrl);  // clean up
//       callback && callback();
//     };
//     script.onerror = e => {
//       URL.revokeObjectURL(blobUrl);
//       console.error('Error loading script:', e);
//     };
//     document.head.appendChild(script);
//     return true;
//   }
  

// function debounce(func, timeout = 300) {
//   let timer;
//   return (...args) => {
//     clearTimeout(timer);
//     timer = setTimeout(() => func.apply(this, args), timeout);
//   };
// }


//MOVED to init.js
function releaseSemaphoreAndReload() {
    chrome.runtime.sendMessage({ type: 'release_semaphore' }, resp => {
      console.log(resp.status);
      window.location.reload();
    });
  }
  window.addEventListener('error', event => {
    console.error('Uncaught error:', event);
    // releaseSemaphoreAndReload();
    chrome.runtime.sendMessage({ type: 'release_semaphore' }, resp => {
        console.log(resp.status);
      });
  }, true);  // useCapture=true to catch as early as possible
  
  // 3) Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled rejection:', event);
    // releaseSemaphoreAndReload();
    chrome.runtime.sendMessage({ type: 'release_semaphore' }, resp => {
        console.log(resp.status);
      });
  }, true);
  window.addEventListener('onbeforeunload', () => { //unload
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            console.log(response.status);  // Should log "Semaphore released"
        });
    }, true); // useCapture=true to catch as early as possible



//MOVED to init.js
// This async function is like "main()" for each tab/content script.
// It runs automatically to load the excel data from local storage and create the button.
// It does a preliminary test for the presence of a CAPTCHA page.
createButton();
chrome.runtime.sendMessage({ type: 'wait_for_initialization' }, (response) => {
    console.log(response.status);
    (async function () {
        const currentTabURL = window.location.href.toString();
        const captchaTest = await fetchWithSessionCache(currentTabURL, currentTabURL, refetch = true);
        if (captchaTest.status != 200) {
            // chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
            //     console.log(release_response.status);  // Should log "Semaphore released" 
            //     window.location.reload();
            // });
            releaseSemaphoreAndReload();
        }
        // csp_hash_map = await chrome.storage.local.get('csp_hash_map');
        excelData = await getJCRExcel();
        retractionWatchDB = await getRetractionWatchDB();
        // await new Promise(resolve => setTimeout(resolve, 2000));  // 2-second delay
        enableButton();
    })();
});
function enableButton() {
    const button = document.getElementById("inject-content-button");
    button.textContent = "Run GScholarLENS";
    button.disabled = false;
    button.textContent.color = "white";
    button.style.width = "fit-content";
    button.style.display = "flex"; // Flexbox for proper alignment
    button.style.alignItems = "center"; // Vertically center text and icon
    button.style.gap = "5px"; // Space between icon and text
    // button.style.padding = "12px 20px"; // Increase padding for a larger button
    button.style.fontSize = "16px"; // Larger font size
    // button.style.fontWeight = "bold"; // Bold text
    button.style.color = "white"; // White text
    // button.style.fontStyle = "italic"; // Italicized text
    button.style.marginTop = "20px";
    button.style.marginBottom = "10px";
    button.style.zIndex = "1000";
    button.style.borderRadius = "7px";
    button.style.cursor = "pointer";
    button.style.boxShadow = "3px 3px 5px rgba(0,0,0,0.6)";
    button.style.fontFamily = "schibsted-grotesk, sans-serif"; // Apply the font
    button.style.backgroundColor = "rgba(0,0,0,0.8)"; // Black background
    // Add an icon to the button
    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("icons/icon128.png"); // Path to the icon
    icon.alt = "GScholarLENS";
    icon.style.height = "20px"; // Adjust icon size
    icon.style.width = "20px";
    icon.style.objectFit = "contain";
    // Add the icon and text to the button
    button.prepend(icon);
}

//MOVED to init.js
// Credit : https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// MOVED to init.js
async function fetchWithSessionCache(key, url, refetch = false) {

    if (!key || key.length === 0) {
        // console.warn("Empty Cache key");
        return null;
    }

    const hash_key = cyrb53(key);
    const cachedData = await sessionStorage.getItem(hash_key);
    if (cachedData && !refetch) {
        // console.log("Cache hit:", key);
        // return JSON.parse(cachedData);
        return cachedData;
    }

    // console.warn("Cache miss ("+ hash_key +") :", key);
    try {
        const response = await fetch(url);
        // const data = await response.json();
        // sessionStorage.setItem(key, JSON.stringify(data)); // Save to sessionStorage
        // return data;
        if (response && response.status == 200) {
            await sessionStorage.setItem(hash_key, response); // Save to sessionStorage
        }
        return response;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
    return true;
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createInlineWorker(pathInExtension) {
    // 1) fetch the worker script text
    const res  = await fetch(pathInExtension);
    const code = await res.text();
  
    // 2) make a Blob URL for it
    const blob = new Blob([code], { type: 'application/javascript' });
    const url  = URL.createObjectURL(blob);
  
    // 3) construct the Worker
    const worker = new Worker(url);
    // 4) clean up the blob URL when the worker loads
    worker.addEventListener('online', () => URL.revokeObjectURL(url));
    worker.addEventListener('offline', () => {
        URL.revokeObjectURL(url)
        blob.dispose(); // Clean up the blob
    });
    return worker;
  }

//MOVED to pub worker thread
// const replaceSpecialChars = (str) => {
//     const charMap = {
//         'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ā': 'a',
//         'ç': 'c', 'ć': 'c', 'ĉ': 'c', 'č': 'c', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
//         'ē': 'e', 'ė': 'e', 'ę': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i',
//         'į': 'i', 'ı': 'i', 'ñ': 'n', 'ń': 'n', 'ň': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
//         'ö': 'o', 'ø': 'o', 'ō': 'o', 'ó': 'o', 'œ': 'oe', 'ù': 'u', 'ú': 'u', 'û': 'u',
//         'ü': 'u', 'ū': 'u', 'ý': 'y', 'ÿ': 'y', 'ž': 'z', 'ź': 'z', 'ż': 'z',
//         'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE', 'Ā': 'A',
//         'Ç': 'C', 'Ć': 'C', 'Ĉ': 'C', 'Č': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
//         'Ē': 'E', 'Ė': 'E', 'Ę': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I', 'Ī': 'I',
//         'Į': 'I', 'İ': 'I', 'Ñ': 'N', 'Ń': 'N', 'Ň': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
//         'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ō': 'O', 'Œ': 'OE', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
//         'Ü': 'U', 'Ū': 'U', 'Ý': 'Y', 'Ÿ': 'Y', 'Ž': 'Z', 'Ź': 'Z', 'Ż': 'Z', 'œ': 'oe',
//         'ř': 'r', 'š': 's', 'ţ': 't', 'ū': 'u', 'ý': 'y'
//     };
//     return str.split('').map(char => charMap[char] || char).join('').replace(/[\u2010-\u2015\u2212\uFE58\u2043]/g, '-');
// };
// const normalizeString = (str) => {
//     // Normalize the string to decomposed form (NFD), where characters with accents are split into their base character and combining mark.
//     return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
// };
// const matchStrings = (str1, str2) => {
//     // Normalize both strings and compare
//     return normalizeString(str1) === normalizeString(str2);
// };
// function uniq(a) {
//     return Array.from(new Set(a));
// }



//MOVED to init.js
async function getJCRExcel() {
    // await new Promise(resolve => setTimeout(resolve, 1000));  // 1-second delay
    try {
        // chrome.runtime.sendMessage({ type: 'get_semaphore' }, (response) => {
        //     console.log(response.status);  // Should log "Semaphore released"
        //     chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
        //         console.log(response.status);  // Should log "Semaphore released"
        //     });
        return new Promise(resolve => {
            chrome.storage.local.get("jcrJSON", (result) => {
                resolve(result.jcrJSON || false);
            });
        });
        // });
    }
    catch (error) {
        console.error("Error: Could not fetch JCR excel data. " + error);
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            console.log(response.status);  // Should log "Semaphore released"
        });
    }
}
async function getRetractionWatchDB() {
    try {
        return new Promise(resolve => {
            chrome.storage.local.get("retractionwatchdb", (result) => {
                resolve(result.retractionwatchdb || false);
            });
        });
        //     return new Promise((resolve) => {
        //     chrome.storage.local.get("retractionwatchdb", (result) => {
        //         const base64Data = result.retractionwatchdb;
        //         if (!base64Data) {
        //             resolve(false); // No data found
        //             return;
        //         }
        //         // Convert Base64 string back to Blob
        //         const byteString = atob(base64Data.split(",")[1]);
        //         const mimeString = base64Data.split(",")[0].split(":")[1].split(";")[0];
        //         const ab = new ArrayBuffer(byteString.length);
        //         const ia = new Uint8Array(ab);
        //         for (let i = 0; i < byteString.length; i++) {
        //             ia[i] = byteString.charCodeAt(i);
        //         }
        //         resolve(new Blob([ab], { type: mimeString }));
        //     });
        // });
    }
    catch (error) {
        console.error("Error: Could not RetractionWatchDB blob data. " + error);
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            console.log(response.status);  // Should log "Semaphore released"
        });
    }
}

//MOVED to init.js
function createButton() {
    // Check if button already exists to avoid duplicates
    if (document.getElementById("inject-content-button")) {
        const button = document.getElementById("inject-content-button");
        button.style.display = "none";

        // button.style.display = "flex";

        return;
    }

    // Create a new button element
    const button = document.createElement("button");
    // button.id = "inject-content-button";
    // button.textContent = "Run GScholarLENS";
    // // button.textContent.color = "white";
    // // button.style.position = "fixed";
    // button.style.marginTop = "5px";
    // button.style.marginBottom = "5px";
    // button.style.top = "20px";
    // // button.style.left = "20px";
    // button.style.bottom = "20px";
    // // button.style.right = "20px";
    // // button.style.padding = "10px";
    // button.style.zIndex = "1000";
    // // button.style.background = "url(" + chrome.runtime.getURL("images/banner.png") + ") no-repeat";
    // // button.style.backgroundSize = "100% 75%"; 
    // // button.style.backgroundColor = "#4CAF50";
    // // button.style.color = "white";
    // // button.style.border = "none";
    // button.style.borderRadius = "7px";
    // button.style.cursor = "pointer";
    // button.style.boxShadow = "0px 0px 1px 1px rgb(0,0,0)"
    // // button.style.marginTop = "20px";
    // // button.style.marginBottom = "20px";
    // button.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font

    // const icon = document.createElement("img");
    // icon.src = chrome.runtime.getURL("icons/icon128.png"); // Path to the icon
    // icon.alt = "GScholarLENS";
    // icon.style.height = "16px"; // Adjust icon size
    // icon.style.width = "16px";
    // icon.style.objectFit = "contain";

    // // Add the icon and text to the button
    // button.prepend(icon);

    button.id = "inject-content-button";
    button.textContent = "Initializing GScholarLENS...";
    // button.textContent.color = "white";
    button.disabled = true;
    button.style.width = "fit-content";
    button.style.display = "flex"; // Flexbox for proper alignment
    button.style.alignItems = "center"; // Vertically center text and icon
    button.style.gap = "5px"; // Space between icon and text
    // button.style.padding = "12px 20px"; // Increase padding for a larger button
    button.style.fontSize = "16px"; // Larger font size
    // button.style.fontWeight = "bold"; // Bold text
    // button.style.color = "white"; // White text
    // button.style.fontStyle = "italic"; // Italicized text
    button.style.marginTop = "20px";
    button.style.marginBottom = "10px";
    button.style.zIndex = "1000";
    button.style.borderRadius = "7px";
    button.style.cursor = "not-allowed";
    button.style.boxShadow = "3px 3px 5px rgba(0,0,0,0.6)";
    button.style.fontFamily = "schibsted-grotesk, sans-serif"; // Apply the font
    // button.style.backgroundColor = "rgba(0,0,0,0.8)"; // Black background

    // Add an icon to the button
    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("icons/icon128.png"); // Path to the icon
    icon.alt = "GScholarLENS";
    icon.style.height = "20px"; // Adjust icon size
    icon.style.width = "20px";
    icon.style.objectFit = "contain";

    // Add the icon and text to the button
    button.prepend(icon);

    // Add the button to the page
    // const profileSection = document.querySelector('#gsc_prf_w');
    const profileSection = document.querySelector('#gsc_prf');
    profileSection.append(button);

    // Add an event listener to the button to execute GScholarLENS.js when clicked
    button.addEventListener("click", () => {
        // const currentTabURL = window.location.href.toString();
        // fetch(currentTabURL).then((captchaTest) => { 
        //     if (captchaTest.status != 200) { 
        //     window.location.reload();
        // }
        // });
        try {
            //     chrome.runtime.sendMessage({ type: 'get_semaphore' }, (response) => {
            //         console.log(response.status);  // Should log "Semaphore released" 
            startScraping();
            button.style.display = "none";
            //         chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            //             console.log(response.status);  // Should log "Semaphore released" 
            //         });
            //     });
        }
        catch (error) {
            console.error("Error at startScraping() event: " + error);  // Should log "Semaphore released" 
            button.style.display = "none";
            chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
                console.log(response.status);  // Should log "Semaphore released" 
            });
        } 
        // finally{
        //     chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
        //         console.log(response.status);  // Should log "Semaphore released" 
        //     });
        // }

    }, { passive: true });
}

// function simpleBLAST(query, target, wordSize = 3) {
//     const queryLength = query.length;
//     const targetLength = target.length;
//     let bestMatch = { position: -1, score: 0, alignment: '' };

//     // Iterate over the target in windows of the query length
//     for (let i = 0; i <= targetLength - wordSize; i++) {
//         let matchScore = 0;
//         let alignment = '';

//         // Compare substrings in windows of 'wordSize'
//         for (let j = 0; j < wordSize; j++) {
//             if (query[j] === target[i + j]) {
//                 matchScore++;
//                 alignment += query[j];
//             } else {
//                 alignment += '-';
//             }
//         }

//         // Update best match if current score is higher
//         if (matchScore > bestMatch.score) {
//             bestMatch = { position: i, score: matchScore, alignment: alignment };
//         }
//     }

//     return bestMatch;
// }

/**
 * Deep-merges workerYearData into globalYearData.
 * Both are Maps with:
 *   key = year
 *   value = Map of:
 *     "total_publications"            → Number
 *     "author_pos_contrib"            → Map<pos, Number>
 *     "author_pos_cite_contrib"       → Map<pos, Number>
 *     "author_pos_cite_map"           → Map<pos, Array>
 *     "author_pos_cite_qscore"        → Map<pos, Map<quartile, Number>>
 */
function mergeYearwiseData(globalYearData, workerYearData) {
    for (const [year, workerYearMap] of workerYearData.entries()) {
      // If the year isn’t present in global, clone whole map
      if (!globalYearData.has(year)) {
        // Deep clone Maps and Arrays
        const cloneYearMap = new Map();
        for (const [key, val] of workerYearMap.entries()) {
          if (val instanceof Map) {
            cloneYearMap.set(key, new Map(val));       // shallow-map clone
          } else if (Array.isArray(val)) {
            cloneYearMap.set(key, [...val]);           // array clone
          } else {
            cloneYearMap.set(key, val);                // number or primitive
          }
        }
        globalYearData.set(year, cloneYearMap);
        continue;
      }
  
      // Otherwise merge into existing global map
      const globalYearMap = globalYearData.get(year);
  
      // 1) total_publications
      if (workerYearMap.has("total_publications")) {
        const globalTotal = globalYearMap.get("total_publications") || 0;
        const workerTotal = workerYearMap.get("total_publications");
        globalYearMap.set("total_publications", globalTotal + workerTotal);
      }
  
      // 2) author_pos_contrib & author_pos_cite_contrib
      for (const contribKey of ["author_pos_contrib", "author_pos_cite_contrib"]) {
        const globalContrib = globalYearMap.get(contribKey);
        const workerContrib = workerYearMap.get(contribKey);
        if (globalContrib instanceof Map && workerContrib instanceof Map) {
          for (const [pos, count] of workerContrib.entries()) {
            globalContrib.set(pos, (globalContrib.get(pos) || 0) + count);
          }
        }
      }
  
      // 3) author_pos_cite_map (arrays)
      const globalMap = globalYearMap.get("author_pos_cite_map");
      const workerMap = workerYearMap.get("author_pos_cite_map");
      if (globalMap instanceof Map && workerMap instanceof Map) {
        for (const [pos, arr] of workerMap.entries()) {
          const existing = globalMap.get(pos) || [];
          globalMap.set(pos, existing.concat(arr));
        }
      }
  
      // 4) author_pos_cite_qscore (nested maps)
      const globalQ = globalYearMap.get("author_pos_cite_qscore");
      const workerQ = workerYearMap.get("author_pos_cite_qscore");
      if (globalQ instanceof Map && workerQ instanceof Map) {
        for (const [pos, workerQuartMap] of workerQ.entries()) {
          const globalQuartMap = globalQ.get(pos);
          if (globalQuartMap instanceof Map) {
            for (const [quart, val] of workerQuartMap.entries()) {
              globalQuartMap.set(quart, (globalQuartMap.get(quart) || 0) + val);
            }
          }
        }
      }
    }
  }  

function startScraping() {
    try {
        // Listen for visibility change events
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && profileScraped === true) {
                // draw10yearsChart();
                updateAuthorChart();
            }
        });

        // Additionally, listen for window focus events
        window.addEventListener('focus', () => {
            if (profileScraped === true) {
                // draw10yearsChart();
                updateAuthorChart();
            }
        });

        document.getElementsByTagName('body')[0].style.overflow = 'hidden'; // Lock scroll

        // Initializing variables
        // let progress = 0;
        let minYear = 0;
        let maxYear = 0;
        const minRangeValueGap = 1;
        const pubMachineThreshold = 48;
        const MAX_RETRIES = 5;
        const MAX_WORKERS = Math.max(1, navigator.hardwareConcurrency - 1);

        let selectedPeryearCheck = false;
        let selectedCumulativeCheck = false;
        let wasCumulativeEnabled = false;
        let selectedMinYear = 0;
        let selectedMaxYear = 0;
        let selectedSingleYear = 0;

        let publicationProgress = 0;
        let totalPublications = 0; //document.querySelectorAll(".gsc_a_at").length;
        let pub_author_no_match = 0;
        let pub_no_year = 0;

        let hFirst = 0;
        let hSecond = 0;
        let hOther = 0;
        let hCO = 0;
        let shIndex = 0;
        let shIndexPubCount = 0;

        let medianCitationsRaw = 0;
        let medianCitationsAdj = 0;
        let zeroCitationPubs = 0;
        let retractedPubsCount = 0;
        let preprintCount = 0;

        const hCiteProp = [0.9, 0.5, 0.1, 1.0];
        // const hFirstProp = 0.9;
        // const hSecondProp = 0.5;
        // const hOtherProp = 0.1;
        // const hCoProp = 1.0;
        const hIndexArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
        // const hIndexMinCiteArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
        const subsetItersArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
        // const subsetRowCountsArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]

        const journalCountMap = new Map();

        /*     
        
        ^ : Start of the string.

        (.*?) : Non-greedy capture group for any characters (.), as few as possible (*?).

        (?=\s+\d|,|\s\() : Positive lookahead to ensure the match stops before:

        \s+\d : One or more whitespace characters followed by a digit (e.g., " 18").

        , : A comma.

        \s\( : A whitespace followed by a parenthesis (e.g., " ("). */
        const journalNameRegex = /^(.*?)(?=\s+\d|,|\s\()/; //Thanks DeepSeek R1!


        // let firstAuthorCount = 0;
        // let secondAuthorCount = 0;
        // let correspondingAuthorCount = 0;
        // let coAuthorCount = 0;
        // let firstAuthorCitationsTotal = 0;
        // let secondAuthorCitationsTotal = 0;
        // let correspondingAuthorCitationsTotal = 0;
        // let coAuthorCitationsTotal = 0;

        // let firstAuthorPercentage = 0;
        // let secondAuthorPercentage = 0;
        // let correspondingAuthorPercentage = 0;
        // let coAuthorPercentage = 0;

        // Define reusable colors
        const backgroundColor = [
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(54, 162, 235, 0.2)'
        ];
        const borderColor = [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(54, 162, 235, 1)'
        ];

        const QbackgroundColor = [
            ['rgba(166, 54, 3, 0.4)', 'rgba(84, 39, 143, 0.4)', 'rgba(0, 109, 44, 0.4)', 'rgba(8, 81, 156, 0.4)'],
            ['rgba(230, 85, 13, 0.4)', 'rgba(117, 107, 177, 0.4)', 'rgba(49, 163, 84, 0.4)', 'rgba(49, 130, 189,0.4)'],
            ['rgba(253, 141, 60, 0.4)', 'rgba(158, 154, 200, 0.4)', 'rgba(116, 196, 118, 0.4)', 'rgba(107, 174, 214, 0.4)'],
            ['rgba(253, 190, 133, 0.4)', 'rgba(203, 201, 226, 0.4)', 'rgba(186, 228, 179, 0.4)', 'rgba(189, 215, 231, 0.4)'],
            ['rgba(254, 237, 222, 0.4)', 'rgba(242, 240, 247, 0.4)', 'rgba(237, 248, 233, 0.4)', 'rgba(239, 243, 255, 0.4)']
        ];

        // const QbackgroundColor = [
        //     ['rgb(166, 54, 3)', 'rgb(84, 39, 143)', 'rgb(0, 109, 44)', 'rgb(8, 81, 156)'],
        //     ['rgb(230, 85, 13)', 'rgb(117, 107, 177)', 'rgb(49, 163, 84)', 'rgb(49, 130, 189)'],
        //     ['rgb(253, 141, 60)', 'rgb(158, 154, 200)', 'rgb(116, 196, 118)', 'rgb(107, 174, 214)'],
        //     ['rgb(253, 190, 133)', 'rgb(203, 201, 226)', 'rgb(186, 228, 179)', 'rgb(189, 215, 231)'],
        //     ['rgb(254, 237, 222)', 'rgb(242, 240, 247)', 'rgb(237, 248, 233)', 'rgb(239, 243, 255)']
        // ];

        const QborderColor = [
            ['rgb(127, 44, 2)', 'rgb(58, 27, 107)', 'rgb(0, 75, 28)', 'rgb(5, 52, 105)'], // Group 1
            ['rgb(179, 63, 11)', 'rgb(89, 79, 137)', 'rgb(38, 122, 62)', 'rgb(35, 97, 138)'], // Group 2
            ['rgb(184, 94, 42)', 'rgb(108, 106, 148)', 'rgb(78, 139, 82)', 'rgb(73, 115, 155)'], // Group 3
            ['rgb(194, 151, 99)', 'rgb(157, 156, 186)', 'rgb(145, 161, 135)', 'rgb(148, 173, 197)'], // Group 4
            // ['rgb(254, 237, 222)', 'rgb(242, 240, 247)', 'rgb(237, 248, 233)', 'rgb(239, 243, 255)'] // Group NA
            ['rgb(205, 141, 108)', 'rgb(180, 168, 207)', 'rgb(157, 208, 150)', 'rgb(150, 180, 230)'],// Group NA
        ];

        // const QbackgroundColor = [
        //     ['rgba(166, 54, 3, 0.2)', 'rgba(230, 85, 13, 0.2)', 'rgba(253, 141, 60, 0.2)', 'rgba(253, 190, 133, 0.2)'],
        //     ['rgba(84, 39, 143, 0.2)', 'rgba(117, 107, 177, 0.2)', 'rgba(158, 154, 200, 0.2)', 'rgba(203, 201, 226, 0.2)'],
        //     ['rgba(0, 109, 44, 0.2)', 'rgba(49, 163, 84, 0.2)', 'rgba(116, 196, 118, 0.2)', 'rgba(186, 228, 179, 0.2)'],
        //     ['rgba(8, 81, 156, 0.2)', 'rgba(49, 130, 189,0.2)', 'rgba(107, 174, 214, 0.2)', 'rgba(189, 215, 231, 0.2)']
        // ];

        // const QborderColor = [
        //     ['rgb(127, 44, 2)', 'rgb(179, 63, 11)', 'rgb(184, 94, 42)', 'rgb(194, 151, 99)'],
        //     ['rgb(58, 27, 107)', 'rgb(89, 79, 137)', 'rgb(108, 106, 148)', 'rgb(157, 156, 186)'],
        //     ['rgb(0, 75, 28)', 'rgb(38, 122, 62)', 'rgb(78, 139, 82)', 'rgb(145, 161, 135)'],
        //     ['rgb(5, 52, 105)', 'rgb(35, 97, 138)', 'rgb(73, 115, 155)', 'rgb(148, 173, 197)']
        // ];

        const chartPath = chrome.runtime.getURL('libs/chart.umd.js');
        const papaparsePath = chrome.runtime.getURL('libs/papaparse.min.js');
        // const jandasPath = chrome.runtime.getURL('libs/jandas.min.js');
        // const allURLs = [];
        const publicationData = [];
        let authorNamesConsidered = [];

        const yearwiseData = new Map();
        const yearList = [];

        // const author_pos_contrib = new Map();
        // author_pos_contrib.set("first_author", 0);
        // author_pos_contrib.set("second_author", 0);
        // author_pos_contrib.set("co_author", 0);
        // author_pos_contrib.set("corresponding_author", 0);

        // const author_pos_cite_contrib = new Map();
        // author_pos_cite_contrib.set("first_author", 0);
        // author_pos_cite_contrib.set("second_author", 0);
        // author_pos_cite_contrib.set("co_author", 0);
        // author_pos_cite_contrib.set("corresponding_author", 0);

        // const author_pos_cite_qscore = new Map();
        // author_pos_cite_qscore.set("first_author", new Map());
        // author_pos_cite_qscore.set("second_author", new Map());
        // author_pos_cite_qscore.set("co_author", new Map());
        // author_pos_cite_qscore.set("corresponding_author", new Map());
        // author_pos_cite_qscore.get("first_author").set("Q1", 0);
        // author_pos_cite_qscore.get("first_author").set("Q2", 0);
        // author_pos_cite_qscore.get("first_author").set("Q3", 0);
        // author_pos_cite_qscore.get("first_author").set("Q4", 0);
        // author_pos_cite_qscore.get("first_author").set("NA", 0);
        // author_pos_cite_qscore.get("second_author").set("Q1", 0);
        // author_pos_cite_qscore.get("second_author").set("Q2", 0);
        // author_pos_cite_qscore.get("second_author").set("Q3", 0);
        // author_pos_cite_qscore.get("second_author").set("Q4", 0);
        // author_pos_cite_qscore.get("second_author").set("NA", 0);
        // author_pos_cite_qscore.get("co_author").set("Q1", 0);
        // author_pos_cite_qscore.get("co_author").set("Q2", 0);
        // author_pos_cite_qscore.get("co_author").set("Q3", 0);
        // author_pos_cite_qscore.get("co_author").set("Q4", 0);
        // author_pos_cite_qscore.get("co_author").set("NA", 0);
        // author_pos_cite_qscore.get("corresponding_author").set("Q1", 0);
        // author_pos_cite_qscore.get("corresponding_author").set("Q2", 0);
        // author_pos_cite_qscore.get("corresponding_author").set("Q3", 0);
        // author_pos_cite_qscore.get("corresponding_author").set("Q4", 0);
        // author_pos_cite_qscore.get("corresponding_author").set("NA", 0);

        // const author_pos_cite_map = new Map();
        // author_pos_cite_map.set("first_author", []);
        // author_pos_cite_map.set("second_author", []);
        // author_pos_cite_map.set("co_author", []);
        // author_pos_cite_map.set("corresponding_author", []);

        // let qTotal = new Map();
        // qTotal.set("Q1", 0);
        // qTotal.set("Q2", 0);
        // qTotal.set("Q3", 0);
        // qTotal.set("Q4", 0);
        // qTotal.set("NA", 0);

        // let qPosCount = new Map();
        // qPosCount.set("first_author", new Map());
        // qPosCount.get("first_author").set("Q1",0);
        // qPosCount.get("first_author").set("Q2",0);
        // qPosCount.get("first_author").set("Q3",0);
        // qPosCount.get("first_author").set("Q4",0);
        // qPosCount.get("first_author").set("NA",0);
        // qPosCount.set("second_author", new Map());
        // qPosCount.get("second_author").set("Q1",0);
        // qPosCount.get("second_author").set("Q2",0);
        // qPosCount.get("second_author").set("Q3",0);
        // qPosCount.get("second_author").set("Q4",0);
        // qPosCount.get("second_author").set("NA",0);
        // qPosCount.set("co_author", new Map());
        // qPosCount.get("co_author").set("Q1",0);
        // qPosCount.get("co_author").set("Q2",0);
        // qPosCount.get("co_author").set("Q3",0);
        // qPosCount.get("co_author").set("Q4",0);
        // qPosCount.get("co_author").set("NA",0);
        // qPosCount.set("corresponding_author", new Map());
        // qPosCount.get("corresponding_author").set("Q1",0);
        // qPosCount.get("corresponding_author").set("Q2",0);
        // qPosCount.get("corresponding_author").set("Q3",0);
        // qPosCount.get("corresponding_author").set("Q4",0);
        // qPosCount.get("corresponding_author").set("NA", 0);

        // Loading Bar
        // Create the loading bar container
        const loadingBarContainer = document.createElement("div");
        loadingBarContainer.style.marginTop = "50px";
        loadingBarContainer.style.width = "100%";
        loadingBarContainer.style.backgroundColor = "#ddd";
        loadingBarContainer.style.borderRadius = "5px";
        loadingBarContainer.style.overflow = "hidden";
        loadingBarContainer.style.position = "relative";  // Needed for centering text overlay

        // Create the loading bar itself
        const loadingBar = document.createElement("div");
        loadingBar.style.width = "0%";  // Start at 0%
        loadingBar.style.height = "20px";
        loadingBar.style.backgroundColor = "#4caf50";
        loadingBar.style.transition = "width 0.3s ease";  // Smooth transition effect
        // loadingBar.style.zIndex = "1";  // Ensure the loading bar is behind the text

        // Create a text element to show progress inside the loading bar
        const loadingText = document.createElement("span");
        loadingText.style.position = "absolute";
        loadingText.style.width = "100%";
        loadingText.style.textAlign = "center";
        loadingText.style.marginTop = "2px";
        loadingText.style.fontSize = "calc(0.3em + 0.55vw)";
        loadingText.style.color = "#000";  // Ensure text is visible
        loadingText.style.whiteSpace = "nowrap";  // Prevents text from wrapping
        loadingText.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
        // loadingText.style.zIndex = "2";  // Ensure the loading bar is behind the text

        loadingBarContainer.appendChild(loadingText);  // Append the text overlay to the container        
        // Append the loading bar to the container
        loadingBarContainer.appendChild(loadingBar);


        async function updateLoadingBar(progress, loadingBarText = "Progress: ", force = false, timeout = 20, step = 5) {
            if (progress <= 0 || progress >= 100 || progress % step || force) {
                setTimeout(updateLoadingBarCall, timeout, progress, loadingBarText);
                // await new Promise((updateLoadingBarCall, timeout, progress, loadingBarText) => setTimeout(updateLoadingBarCall, timeout, progress, loadingBarText));
                await Promise.resolve();
            }
            // loadingBar.style.width = progress.toFixed(2) + "%";
            // loadingText.textContent = loadingBarText + `${progress.toFixed(2)}%`;
            // console.log("Progress: " + progress + "%"); //DEBUG
            // console.log("Progress Bar: " + loadingBar.style.width + "%"); //DEBUG

        }

        async function updateLoadingBarCall(progress, loadingBarText = "Progress: ") {
            // if (progress % totalPublications) {
            //     setTimeout(updateLoadingBar, 20, progress, loadingBarText);
            // }
            loadingBar.style.width = progress.toFixed(2) + "%";
            loadingText.textContent = loadingBarText + `${progress.toFixed(2)}%`;
            // console.log("Progress: " + progress + "%"); //DEBUG
            // console.log("Progress Bar: " + loadingBar.style.width + "%"); //DEBUG
        }

        // Get the profile section to append the chart and progress bars
        const profileSection = document.querySelector('#gsc_prf_w');
        // Append the loading bar container to the body or a specific container
        profileSection.appendChild(loadingBarContainer);

        // Creating chart containers first to update them later
        const chartMainContainer = document.createElement("div");
        chartMainContainer.setAttribute("id", 'chart-viz');
        chartMainContainer.style.display = "none";
        // Append the chart container to the profile section
        profileSection.appendChild(chartMainContainer);

        function updateDoubleRangeMin(value = -1) {
            const doubleRangeInputs = document.querySelectorAll(".double_range_slider_box input");
            const doubleRangeTrack = document.getElementById("double_range_track");
            const doubleMinLabel = document.querySelector(".minvalue");
            const doubleMaxLabel = document.querySelector(".maxvalue");
            const minRange = value > 0 ? value : parseInt(doubleRangeInputs[0].value);
            const maxRange = parseInt(doubleRangeInputs[1].value);

            // console.log(" (min) minRange : " + minRange); //DEBUG
            // console.log(" (min) maxRange : " + maxRange); //DEBUG

            // Adjust min/max values if they are too close (ensuring a gap between sliders)
            if (maxRange - minRange < minRangeValueGap) {
                // if (event.target.className.includes("min")) {
                doubleRangeInputs[0].value = maxRange - minRangeValueGap;
                // } else {
                // doubleRangeInputs[1].value = minRange + minRangeValueGap;
                // }
            }

            // console.log(" (min) doubleRangeInputs[0].value : " + doubleRangeInputs[0].value); //DEBUG
            // console.log(" (min) doubleRangeInputs[1].value : " + doubleRangeInputs[1].value); //DEBUG

            const adjustedMinRange = parseInt(doubleRangeInputs[0].value);
            const adjustedMaxRange = parseInt(doubleRangeInputs[1].value);

            // Update the range track and labels dynamically
            doubleRangeTrack.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            doubleRangeTrack.style.right = 100 - ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            doubleMinLabel.textContent = adjustedMinRange;
            doubleMaxLabel.textContent = adjustedMaxRange;

            doubleMinLabel.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            doubleMaxLabel.style.left = ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            selectedMinYear = parseInt(doubleRangeInputs[0].value); //adjustedMinRange;
            // selectedMaxYear = adjustedMaxRange;
            // selectedMaxYear = parseInt(doubleRangeInputs[1].value);
            // console.log("after update : min year");
            // console.log(selectedMinYear, selectedMaxYear); //DEBUG
        }

        function updateDoubleRangeMax(value = -1) {
            const doubleRangeInputs = document.querySelectorAll(".double_range_slider_box input");
            const doubleRangeTrack = document.getElementById("double_range_track");
            const doubleMinLabel = document.querySelector(".minvalue");
            const doubleMaxLabel = document.querySelector(".maxvalue");
            const minRange = parseInt(doubleRangeInputs[0].value);
            const maxRange = value > 0 ? value : parseInt(doubleRangeInputs[1].value);

            // console.log(" (max) minRange : " + minRange); //DEBUG
            // console.log(" (max) maxRange : " + maxRange); //DEBUG

            // Adjust min/max values if they are too close (ensuring a gap between sliders)
            if (maxRange - minRange < minRangeValueGap) {
                // if (event.target.className.includes("min")) {
                // doubleRangeInputs[0].value = maxRange - minRangeValueGap;
                // } else {
                doubleRangeInputs[1].value = minRange + minRangeValueGap;
                // }
            }

            // console.log(" (max) doubleRangeInputs[0].value : " + doubleRangeInputs[0].value); //DEBUG
            // console.log(" (max) doubleRangeInputs[1].value : " + doubleRangeInputs[1].value); //DEBUG

            const adjustedMinRange = parseInt(doubleRangeInputs[0].value);
            const adjustedMaxRange = parseInt(doubleRangeInputs[1].value);

            // Update the range track and labels dynamically
            doubleRangeTrack.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            doubleRangeTrack.style.right = 100 - ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            doubleMinLabel.textContent = adjustedMinRange;
            doubleMaxLabel.textContent = adjustedMaxRange;

            doubleMinLabel.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            doubleMaxLabel.style.left = ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            // selectedMinYear = parseInt(doubleRangeInputs[0].value);
            // selectedMinYear = adjustedMinRange;
            selectedMaxYear = parseInt(doubleRangeInputs[1].value); //adjustedMaxRange;
            // console.log("after update : max year");
            // console.log(selectedMinYear, selectedMaxYear); //DEBUG
        }

        function updateSingleRange(val = -1) {
            const singleRangeTrack = document.getElementById("single_range_track");
            const singleRangeInput = document.getElementById("single_range");
            const singleLabel = document.querySelector(".singlevalue");
            const value = val > 0 ? val : parseInt(singleRangeInput.value);

            // Update the range track and label dynamically
            singleRangeTrack.style.right = 100 - ((value - minYear) / (maxYear - minYear)) * 100 + "%";
            singleRangeTrack.style.left = "0%";
            singleLabel.textContent = value;
            singleLabel.style.left = ((value - minYear) / (maxYear - minYear)) * 100 + "%";

            selectedSingleYear = value;
            // console.log("after update : single year");
            // console.log(selectedSingleYear); //DEBUG
        }
        function cumulativeChecker() {
            const cumulativeCheckbox = document.getElementById("cumulative_checkbox");
            const singleRangeTrack = document.getElementById("single_range_track");
            const peryearCheckbox = document.getElementById("peryear_checkbox");
            if (cumulativeCheckbox.checked) {
                singleRangeTrack.style.display = "flex";
                // peryearCheckbox.checked = true;
                wasCumulativeEnabled = true;
            } else {
                singleRangeTrack.style.display = "none";
                wasCumulativeEnabled = false;
            }
            selectedPeryearCheck = peryearCheckbox.checked;
            selectedCumulativeCheck = cumulativeCheckbox.checked;
            // console.log(selectedPeryearCheck); //DEBUG
        }

        function peryearChecker() {
            const cumulativeCheckbox = document.getElementById("cumulative_checkbox");
            const cumulativeCheckboxLabel = document.querySelector('label[for="cumulative_checkbox"]');
            const peryearCheckbox = document.getElementById("peryear_checkbox");
            const doubleRangeSlider = document.getElementById("double_range_slider");
            const singleRangeSlider = document.getElementById("single_range_slider");
            if (peryearCheckbox.checked) {
                doubleRangeSlider.style.display = "none";
                singleRangeSlider.style.display = "flex";
                cumulativeCheckbox.style.display = "inline-block";
                cumulativeCheckboxLabel.style.display = "inline-block";
                if (wasCumulativeEnabled) {
                    cumulativeCheckbox.checked = true;
                    // selectedCumulativeCheck = true;
                    cumulativeChecker();
                } else {
                    cumulativeCheckbox.checked = false;
                }
            } else {
                doubleRangeSlider.style.display = "flex";
                singleRangeSlider.style.display = "none";
                cumulativeCheckbox.style.display = "none";
                cumulativeCheckboxLabel.style.display = "none";
                // cumulativeCheckbox.checked = false;
                // selectedCumulativeCheck = false;
            }
            selectedPeryearCheck = peryearCheckbox.checked;
            selectedCumulativeCheck = cumulativeCheckbox.checked;
            // console.log(selectedPeryearCheck); //DEBUG
        }

        function initializeScholarLens() {
            //DEBUG - adding range slider for v1.0 of scholar lens
            // Create styles dynamically
            const style = document.createElement("style");
            style.textContent = `
            .range_slider_wrapper {
    display: flex;
    justify-content: center;  /* Center the content */
    align-items: center;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    background-color: #f5f5f5;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);  /* Shadow effect */
    border-radius: 15px;  /* Rounded border */
}

.range_slider_container {
    width: 400px; /* Decrease the overall width of the container */
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.toggle_container {
    margin-bottom: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    transform: translate(0, 20%);
}

#peryear_checkbox {
    display: inline-block;
    width: 15px; /* Adjust size as needed */
    height: 15px;
    position: relative;
    margin: 15px 0 0 0;
    padding: 0;
    pointer-events: auto;
    cursor: pointer;
    background-color: white; /* Default background */
    border: 2px solid black;
    border-radius: 4px; /* For rounded corners */
}

#peryear_checkbox:checked {
    background-color: black;
    border-color: black;
}

#peryear_checkbox:checked::after {
    content: '✓';
    color: white;
    font-size: 16px; /* Adjust size as needed */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

#cumulative_checkbox {
    display: inline-block;
    width: 15px; /* Adjust size as needed */
    height: 15px;
    position: relative;
    margin: 15px 15px 0 0;
    padding: 0;
    pointer-events: auto;
    cursor: pointer;
    background-color: white; /* Default background */
    border: 2px solid black;
    border-radius: 4px; /* For rounded corners */
}

#cumulative_checkbox:checked {
    background-color: black;
    border-color: black;
}

#cumulative_checkbox:checked::after {
    content: '✓';
    color: white;
    font-size: 16px; /* Adjust size as needed */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.double_range_slider_box, .single_range_slider_box {
    position: relative;
    width: 100%; /* Adjust width */
    max-width: 250px; /* Decrease max-width */
    height: 80px; /* Decrease height */
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    overflow: visible;
}

.range_slider {
    width: 100%;
    height: 8px; /* Decrease slider height */
    position: relative;
    background-color: #dddddd;
    border-radius: 20px;
}

.range_track {
    height: 100%;
    position: absolute;
    border-radius: 20px;
    background-color: #000000; /* Light grey */
    z-index: 1;
    transition: width 0.3s ease-in-out;  /* Smooth transition */
    left: 0;  /* Ensure it starts from the left */
    top: 0;
}

.minvalue, .maxvalue, .singlevalue {
    position: absolute;
    padding: 3px 8px; /* Decrease padding */
    background: #0e5f59;
    border-radius: 1rem;
    color: white;
    font-size: 0.8rem; /* Reduce font size */
    z-index: 10;
    white-space: nowrap;
    max-width: fit-content;
}

/* Position adjustments */
.minvalue {
    left: 0;
    width: fit-content;
    transform: translate(-50%, 80%);
    transition: left 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.maxvalue {
    right: 0;
    width: fit-content;
    transform: translate(-50%, -120%);
    transition: right 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.singlevalue {
    width: fit-content;
    transform: translate(-50%, -120%);
    transition: right 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

/* General range slider input settings */
input {
    position: absolute;
    width: 100%;
    height: 5px;
    background: none;
    pointer-events: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    top: 50%;
    transform: translate(-0.75%,-75%);
    z-index: 3;
}

/* Thumb style for Webkit (Chrome, Safari) */
input::-webkit-slider-thumb {
    height: 20px; /* Decrease thumb size */
    width: 20px;
    border-radius: 50%;
    border: 3px solid #696969; /* Light grey for border */
    background-color: #d3d3d3; /* Dark grey for thumb */
    pointer-events: auto;
    -webkit-appearance: none;
    cursor: pointer;
    margin-bottom: 0;
    z-index: 4;
}

/* Thumb style for Mozilla (Firefox) */
input::-moz-range-thumb {
    height: 20px; /* Decrease thumb size */
    width: 20px;
    border-radius: 50%;
    border: 3px solid #696969; /* Light grey for border */
    background-color: #d3d3d3; /* Dark grey for thumb */
    pointer-events: auto;
    -moz-appearance: none;
    cursor: pointer;
    margin-top: 0;
    z-index: 4;
}
/* CSS styles for sharma_index_container and sh_table */
.sharma_index_container {
    font-size: 1.0rem;
    font-weight: 500;
    margin-bottom: 10px;
    justify-content: center;
    display: inline-block;
}

/* .sh_table_container {
    width: 80%;
    border: black;
    border-style: solid;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
    display: block;
    margin: 0 auto;
}

.sh_table_container table td, 
.sh_table_container table th {
  border: 1px solid black;
} */

  .sh_table_container-outer {
  border: 2px solid #2c3e50;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 600px;
  margin: 1rem 0;
  margin-left: auto;
  margin-right: auto;
}

.sh_table_container-inner {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.sh_table_container-inner th,
.sh_table_container-inner td {
  padding: 14px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
  border-right: 1px solid #ecf0f1;
}

.sh_table_container-inner th {
  background-color: #34495e;
  color: white;
  border-right: 1px solid #2c3e50;
}

.sh_table_container-inner tr:last-child td {
  border-bottom: none;
}

.sh_table_container-inner td:last-child,
.sh_table_container-inner th:last-child {
  border-right: none;
}

/* Thanks DeepSeek R1 */
.journalTableStyle {
  border: 2px solid #333;
  border-radius: 10px;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0px;
  /*border-collapse: collapse;*/
  width: 100%;
  max-width: 600px;
  margin: 1rem 0;
}

.journalTableStyle th,
.journalTableStyle td {
  padding: 12px;
  text-align: left;
  border: none;
}

.journalTableStyle thead {
  background-color: #f8f8f8;
}

.plotmetrics_table {
    table-layout: fixed;
    width: auto;
}

.plotmetrics_table_container {
    display: flex;
    justify-content: center;
}

.yearplot_table_container {
  width: 70%;
  height: 100%;
  position: relative;
}

#tenyearPubCountChart {
  width: 80% !important; /*ONLY CHANGE THIS to modify width of decade plot*/
  height: 100% !important;
} 

.position-circles {
    transition: all 0.2s ease-in-out;
    position: relative;
}

.circles-container {
    transition: all 0.2s ease-in-out;
    position: relative;
}

.position-circles:hover .circles-container{
    transform: scale(1.10);
    z-index: 1000;
    opacity: 1;
}

.position-circles:hover .q-badge {
    opacity: 1;
    transform: scale(1.10) ;/*translateX(50%);  Combine transforms */;
    z-index: 1000;
}

.position-circles:hover .if-badge {
    opacity: 1;
    transform: scale(1.10) ;/*translateX(55%);  Combine transforms */;
    z-index: 1000;
}

/* Optional: Add tooltip for circle meanings */
.position-circles span {
    position: relative;
    /*cursor: help;*/
}

.position-circles span[data-role]:hover::after {
    content: attr(data-role);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%); 
    background: #333;
    color: white;
    padding: 4px 8px;
    margin-bottom: 5px;
    z-index: 10;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    transform: translateX(-50%) scale(1/1.15); /* Counteract parent scale */
}
            `;
            document.head.appendChild(style);
            //SLIDER style - END

            // const currentCumulativeAttr = selectedPeryearCheck ? "checked" : "";
            // const currentDRDisplay = selectedPeryearCheck ? "" : "display: none;";
            // const currentSRDisplay = selectedPeryearCheck ? "display: none;" : "";

            // {"borderCollapse": "separate", "cellStyles": [{ "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }, { "borderTopLeftRadius": "10px", "borderTopRightRadius": "10px", "borderBottomLeftRadius": "10px", "borderBottomRightRadius": "10px", "borderColor": "rgba(0, 0, 0, 0.3)" }]}

            // {"firstRowCellsStyles":[{"borderTopLeftRadius":"10px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"10px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"}],"lastRowCellsStyles":[{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"10px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px"},{"borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderBottomLeftRadius":"0px","borderBottomRightRadius":"10px"}]}

            //                                <h4 id="sh_index_info">(${hCiteProp[0] * 100}% H<sub>First</sub> + ${hCiteProp[1] * 100}% H<sub>Second</sub> + ${hCiteProp[2] * 100}% H<sub>Other</sub> + ${hCiteProp[3] * 100}% H<sub>Co</sub>) - from ${shIndexPubCount} publications</h4> 

            const chartContainer = document.querySelector('#chart-viz');
            chartContainer.style.marginTop = "50px";
            chartContainer.innerHTML = DOMPurify.sanitize(`
                    <div id="GScholarLENS">
                        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
                        <div style="font-family = 'schibsted-grotesk, sans-serif'; padding: 20px; marginTop: 10px; margin: 35px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.05); background-color: #fff;">
                            <div style="text-align: center;">
                                <div class="sharma_index_container">
                                    <h2 id="sh_index">Sh-Index : ${shIndex}</h2>
                                </div>
                            </div>
                            <br>
                            <div class="sh_table_container-outer">
                                <table class="sh_table_container-inner" /*style="width: 100%;"*/>
                                    <tr>
                                        <th style="text-align: center; padding: 8px 0;">H<sub>First</sub> - First Author</th>
                                        
                                        <th style="text-align: center; padding: 8px 0;">H<sub>Second</sub>- Second Author</th>
                                        
                                        <th style="text-align: center;">H<sub>Other</sub> - Co Author</th>
                                        
                                        <th style="text-align: center; padding: 8px 0;">H<sub>Co</sub> - Corresponding Author</th>
                                        
                                    </tr>
                                    <tr>
                                        <td id="h_first" style="text-align: center;">${hFirst}</td>
                                        <td id="h_second" style="text-align: center;">${hSecond}</td>
                                        <td id="h_other" style="text-align: center;">${hOther}</td>
                                        <td id="h_co" style="text-align: center;">${hCO}</td>
                                    </tr>
                                </table>
                            </div>
                            <br>
                            <div class="plotmetrics_table_container">
                                <table class="plotmetrics_table" >
                                    <tbody class="plotmetrics_table_container">
                                    <tr>
                                        <td id="table_metrics" style="border-right: 1px solid black; padding-right: 15px; text-align: center; padding-left: 15px;">
                                        <div class="metrics_table_container">
                                        <table >
                                            <tr>
                                                <th style="text-align: left;"><b>Total Publications:</b></th>
                                                <td id="total_pubs" style="text-align: center;">${totalPublications}</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Publications Considered:</b></th>
                                                <td id="considered_pubs" style="text-align: center;">${totalPublications - (pub_author_no_match )}</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Publications Not Counted:</b></th>
                                                <td id="ignored_pubs" style="text-align: center;">${pub_author_no_match }</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Median - Raw Citations:</b></th>
                                                <td id="medianCitationsRaw" style="text-align: center;">${medianCitationsRaw}</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Median - Adjusted Citations:</b></th>
                                                <td id="medianCitationsAdj" style="text-align: center;">${medianCitationsAdj}</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Zero Citations:</b></th>
                                                <td id="zeroCitationPubs" style="text-align: center;">${zeroCitationPubs}</td>
                                            </tr>
                                            <tr>
                                                <th class="blink_text" style="color: red; text-align: left;"><b>Total Retractions:</b></th>
                                                <td id="retractedPubsCount" style="text-align: center;">${retractedPubsCount}</td>
                                            </tr>
                                            <tr>
                                                <th style="text-align: left;"><b>Total Preprints:</b></th>
                                                <td id="preprintCount" style="text-align: center;">${preprintCount}</td>
                                            </tr>
                                        </table>
                                        </div>
                                        </td>
                                        <td id="year_plot" style="width: 100%;">
                                            <div class="plotmetrics_table_container"><canvas id="tenyearPubCountChart" class="yearplot_table_container"></canvas></div>
                                        </td>                                        
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <br>
                            <center><span id="pubmachine_banner" style="color: blue; font-weight: bold;"></span></center>
                            <br>
                            <div class="range_slider_container">
                                <div class="toggle_container">
                                    <label for="peryear_checkbox" style="transform: translateY(-3px);">Per-Year</label>
                                    <input type="checkbox" id="peryear_checkbox"/>
                                    <label for="cumulative_checkbox" style="transform: translateY(-3px);">Cumulative</label>
                                    <input type="checkbox" id="cumulative_checkbox"/>
                                </div>

                                <!-- Double Range Slider -->
                                <div class="double_range_slider_box" id="double_range_slider">
                                    <div class="range_slider">
                                        <span class="range_track" id="double_range_track"></span>
                                        <input class="double_range" type="range" class="min" min="${minYear}" max="${maxYear}" value="${selectedMinYear}" step="1" />
                                        <input class="double_range" type="range" class="max" min="${minYear}" max="${maxYear}" value="${selectedMaxYear}" step="1" />
                                        <div class="minvalue"></div>
                                        <div class="maxvalue"></div>
                                    </div>
                                </div>

                                <!-- Single Range Slider -->
                                <div class="single_range_slider_box" id="single_range_slider">
                                    <div class="range_slider">
                                        <span class="range_track" id="single_range_track"></span>
                                        <input id="single_range" type="range" class="single" min="${minYear}" max="${maxYear}" value="${selectedMaxYear}" step="1" />
                                        <div class="singlevalue"></div>
                                    </div>
                                </div>
                            </div>
                            <canvas id="qScorePosStackedChart"></canvas>
                            <canvas id="authorCitationsChart"></canvas>
                            <canvas id="authorCitationsDistChart"></canvas>                            
                            <div id="authorStackedChartDiv" style="width: 100%; height: 10%;">
                                <canvas id="authorStackedChart"></canvas>
                            </div>
                            <div id="citationsStackedChartDiv" style="width: 100%; height: 10%;">
                                <canvas id="citationsStackedChart"></canvas>
                            </div>

                                <br>
                                <b>Author Names Considered: </b><span id="using_author_names">${authorNamesConsidered.toString()}</span>
                                <br>
                            <b>Top 3 Journals: </b>
                            <div id="journalTable" style="display: flex; justify-content: center;"></div>
                        </div>
                    </div>
                    `);

            // <br>
            //                     <span id="total_pubs">Total Publications: ${totalPublications}</span>
            //                     <br>
            //                     <span id="considered_pubs">Publications Considered: ${totalPublications - pub_author_no_match}</span>
            //                     <br>
            //                     <span id="ignored_pubs">Publications Not Counted: ${pub_author_no_match}</span>

            // Toggle functionality for showing/hiding double and single sliders
            const cumulativeCheckbox = document.getElementById("cumulative_checkbox");
            // const cumulativeCheckboxLabel = document.querySelector('label[for="cumulative_checkbox"]');
            // const singleRangeTrack = document.getElementById("single_range_track");
            const peryearCheckbox = document.getElementById("peryear_checkbox");
            // const doubleRangeSlider = document.getElementById("double_range_slider");
            // const singleRangeSlider = document.getElementById("single_range_slider");

            peryearCheckbox.addEventListener("change", peryearChecker);

            cumulativeCheckbox.addEventListener("change", cumulativeChecker);

            // let minRangeValueGap = 1;
            // const doubleRangeTrack = document.getElementById("double_range_track");
            // const singleRangeTrack = document.getElementById("single_range_track");
            const doubleRangeInputs = document.querySelectorAll(".double_range_slider_box input");
            const singleRangeInput = document.getElementById("single_range");
            // const doubleMinLabel = document.querySelector(".minvalue");
            // const doubleMaxLabel = document.querySelector(".maxvalue");
            // const singleLabel = document.querySelector(".singlevalue");

            // Functions for Double Range Slider
            // const updateDoubleRangeMin = () => {
            //     const minRange = parseInt(doubleRangeInputs[0].value);
            //     const maxRange = parseInt(doubleRangeInputs[1].value);

            //     // Adjust min/max values if they are too close (ensuring a gap between sliders)
            //     if (maxRange - minRange < minRangeValueGap) {
            //         // if (event.target.className.includes("min")) {
            //             doubleRangeInputs[0].value = maxRange - minRangeValueGap;
            //         // } else {
            //             // doubleRangeInputs[1].value = minRange + minRangeValueGap;
            //         // }
            //     }

            //     const adjustedMinRange = parseInt(doubleRangeInputs[0].value);
            //     const adjustedMaxRange = parseInt(doubleRangeInputs[1].value);

            //     // Update the range track and labels dynamically
            //     doubleRangeTrack.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            //     doubleRangeTrack.style.right = 100 - ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            //     doubleMinLabel.textContent = adjustedMinRange;
            //     doubleMaxLabel.textContent = adjustedMaxRange;

            //     doubleMinLabel.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            //     doubleMaxLabel.style.left = ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            //     selectedMinYear = adjustedMinRange;
            //     selectedMaxYear = adjustedMaxRange;

            //     console.log(selectedMinYear, selectedMaxYear); //DEBUG
            // };

            // const updateDoubleRangeMax = () => {
            //     const minRange = parseInt(doubleRangeInputs[0].value);
            //     const maxRange = parseInt(doubleRangeInputs[1].value);

            //     // Adjust min/max values if they are too close (ensuring a gap between sliders)
            //     if (maxRange - minRange < minRangeValueGap) {
            //         // if (event.target.className.includes("min")) {
            //             // doubleRangeInputs[0].value = maxRange - minRangeValueGap;
            //         // } else {
            //             doubleRangeInputs[1].value = minRange + minRangeValueGap;
            //         // }
            //     }

            //     const adjustedMinRange = parseInt(doubleRangeInputs[0].value);
            //     const adjustedMaxRange = parseInt(doubleRangeInputs[1].value);

            //     // Update the range track and labels dynamically
            //     doubleRangeTrack.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            //     doubleRangeTrack.style.right = 100 - ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            //     doubleMinLabel.textContent = adjustedMinRange;
            //     doubleMaxLabel.textContent = adjustedMaxRange;

            //     doubleMinLabel.style.left = ((adjustedMinRange - minYear) / (maxYear - minYear)) * 100 + "%";
            //     doubleMaxLabel.style.left = ((adjustedMaxRange - minYear) / (maxYear - minYear)) * 100 + "%";

            //     selectedMinYear = adjustedMinRange;
            //     selectedMaxYear = adjustedMaxRange;

            //     console.log(selectedMinYear, selectedMaxYear); //DEBUG
            // };

            // Event listeners for Double Range Slider
            // doubleRangeInputs.forEach((input) => {
            //     input.addEventListener("input", updateDoubleRange);
            // });
            doubleRangeInputs[0].addEventListener("input", updateDoubleRangeMin);
            doubleRangeInputs[1].addEventListener("input", updateDoubleRangeMax);

            // Initialize Double Range Slider
            // updateDoubleRangeMin();
            // updateDoubleRangeMax();

            // Functions for Single Range Slider
            // const updateSingleRange = () => {
            //     const value = parseInt(singleRangeInput.value);

            //     // Update the range track and label dynamically
            //     singleRangeTrack.style.right = 100 - ((value - minYear) / (maxYear - minYear)) * 100 + "%";
            //     singleRangeTrack.style.left = "0%";
            //     singleLabel.textContent = value;
            //     singleLabel.style.left = ((value - minYear) / (maxYear - minYear)) * 100 + "%";

            //     selectedMinYear = minYear;
            //     selectedMaxYear = value;

            //     console.log(selectedMinYear, selectedMaxYear); //DEBUG
            // };

            // Event listener for Single Range Slider
            singleRangeInput.addEventListener("input", updateSingleRange);

            // Initialize Single Range Slider
            // updateSingleRange();

            // To update charts upon any input - when slide is moved
            peryearCheckbox.addEventListener("change", updateAuthorChart);
            cumulativeCheckbox.addEventListener("change", updateAuthorChart);
            singleRangeInput.addEventListener("change", updateAuthorChart);
            doubleRangeInputs.forEach((input) => {
                input.addEventListener("change", updateAuthorChart);
            });
        }

        initializeScholarLens();

        //Make 'Help' button
        const helpButton = document.createElement("button")
        helpButton.id = "helpButton";
        helpButton.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
        helpButton.style.marginTop = "10px";
        helpButton.style.marginRight = "10px";
        helpButton.textContent = "GScholarLENS Help";
        helpButton.addEventListener("click", function () {
            // Open link
            window.open("https://project.iith.ac.in/sharmaglab/gscholarlens/", "_blank");
        });

        // Append the help button to the profile section
        profileSection.appendChild(helpButton);

        //Make download button
        const downloadDetailsButton = document.createElement("button")
        downloadDetailsButton.id = "downloadDetailsButton";
        downloadDetailsButton.disabled = true;
        downloadDetailsButton.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
        downloadDetailsButton.style.marginTop = "10px";
        downloadDetailsButton.style.marginRight = "10px";
        downloadDetailsButton.textContent = "Download Details";

        // Append the download button to the profile section
        profileSection.appendChild(downloadDetailsButton);

        downloadDetailsButton.addEventListener("click", function () {
            // Trigger download of the TSV file
            const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${authorName.replace(/\s+/g, '_')}_publications.tsv`; // Filename includes the author's name
            // document.body.appendChild(link);
            link.click();
            // document.body.removeChild(link);
            // window.saveAs(blob, `${authorName.replace(/\s+/g, '_')}_publications.tsv`);
        });

        const downloadPlotsButton = document.createElement("button")
        downloadPlotsButton.id = "downloadPlotsButton";
        downloadPlotsButton.disabled = true;
        downloadPlotsButton.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
        downloadPlotsButton.style.marginTop = "10px";
        downloadPlotsButton.style.marginRight = "10px";
        downloadPlotsButton.textContent = "Download Plots";

        // Append the download button to the profile section
        profileSection.appendChild(downloadPlotsButton);

        downloadPlotsButton.addEventListener("click", function () {
            // Trigger download of the TSV file
            function capturePlots() {

                var canvas = document.getElementById("GScholarLENS");
                domtoimage.toJpeg(canvas)
                    .then(function (dataUrl) {
                        // window.saveAs(blob, `${authorName.replace(/\s+/g, '_')}_plots.png`);
                        var link = document.createElement('a');
                        link.download = `${authorName.replace(/\s+/g, '_')}_plots.jpeg`;
                        link.href = dataUrl;
                        link.click();
                        // const blob = new Blob([imgBlob], { type: 'image/png' });
                        // const url = URL.createObjectURL(blob);
                        // const link = document.createElement('a');
                        // link.href = url;
                        // link.download = `${authorName.replace(/\s+/g, '_')}_plots.png`; // Filename includes the author's name
                        // link.click();
                    })
                    .catch(function (error) {
                        console.error('Error: Could not capture the plots!', error);
                    });
            }

            const dom2imagePath = chrome.runtime.getURL("libs/dom-to-image-more.min.js");
            loadScript(dom2imagePath, capturePlots, "dom2image_script");
        });




        const authorNameElement = document.querySelector('#gsc_prf_in');
        const authorName = authorNameElement ? authorNameElement.textContent.trim() : "Not found";

        function cleanNameTitles(name) {
            // Define a regular expression to match common titles and honorifics
            const honorifics = /\b(dr|mr|mrs|ms|miss|prof|phd|ph\.?d|md|m\.?d|jr|sr)\b/gi;
            // Remove titles and honorifics
            let cleanedName = name.replace(honorifics, '');

            // Remove punctuation
            cleanedName = cleanedName.replace(/[.,\/#!$%\^&\*;:}=\_`~)]/g, ''); //without -, (, [, {, <

            // Remove extra spaces caused by removals and trim
            cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

            cleanedName = cleanedName.split(/[,\.\(\;\:\[\{\*)]/)[0].trim(); //without - but with (,[,<,{
            return cleanedName;
        }

        function getSurname(authorName) {
            // Split the trimmed name into parts
            const nameParts = authorName.split(' ');
            // Extract the last name (assumed to be the last part)
            const lastName = nameParts[nameParts.length - 1];
            return lastName;
        }

        function escapeRegex(string) {
            return string.replace('/[.*+?^${}()|[\]\\]/g', '\\$&');
        }

        function getNameRegex(authorName) {
            // console.log(authorName); //DEBUG
            // Trim the author name to avoid issues with leading/trailing spaces
            const nameParts = authorName.trim().split(/\s+/);

            // Extract the last name (assumed to be the last part) and escape special characters
            const lastName = escapeRegex(nameParts[nameParts.length - 1]);

            // Extract the first initial from the first part and escape it
            const firstInitial = escapeRegex(nameParts[0].charAt(0));
            if (nameParts[0].length > 1 && lastName.length > 1) {
                // Construct the regex
                return new RegExp(`^${firstInitial}.*\\s${lastName}[\\*^]?$`, 'i');
            } else {
                return new RegExp(`^${nameParts[0]}.*\\s${lastName}[\\*^]?$`, 'i');
            }
        }

        function getNameRegexExtended(authorName) {
            // Trim the author name to avoid issues with leading/trailing spaces
            const nameParts = authorName.trim().split(/\s+/);

            // Extract the first name
            const firstName = escapeRegex(nameParts[0]);

            // Extract the last name (assumed to be the last part) and escape special characters
            const lastName = escapeRegex(nameParts[nameParts.length - 1]);

            // Construct the regex
            return new RegExp(`^${firstName}.*\\s${lastName}[\\*^]?$`, 'i');
        }

        // /**
        //  * Step 1: Fetch DOI from the article link using CrossRef Event Data API
        //  */
        // async function fetchDOIFromLink(articleUrl) {
        //     const apiUrl = `https://api.crossref.org/links?url=${encodeURIComponent(articleUrl)}`;
        //     try {
        //         // const response = await fetch(apiUrl);
        //         const response = await fetchWithSessionCache(articleUrl, apiUrl);
        //         if (!response && !response.ok) {
        //             console.error("Error fetching DOI from CrossRef Event Data:", response.statusText);
        //             return null;
        //         }

        //         const data = await response.json();
        //         if (data.message && data.message.DOIs && data.message.DOIs.length > 0) {
        //             return data.message.DOIs[0]; // Return the first DOI found
        //         }

        //         return null;
        //     } catch (error) {
        //         console.error("Error fetching DOI:", error);
        //         return null;
        //     }
        // }

        // /**
        //  * Step 2: Fetch Metadata for the DOI using CrossRef Metadata API
        //  */
        // async function fetchMetadataFromDOI(doi) {
        //     if(!doi || doi.length === 0){
        //         console.warn("Empty doi");
        //         return null;
        //     }
        //     const apiUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        //     console.log(apiUrl);

        //     try {
        //         // const response = await fetch(apiUrl);
        //         const response = await fetchWithSessionCache(doi, apiUrl);
        //         if (!response && !response.ok) {
        //             console.error("Error fetching metadata from CrossRef:", response.statusText);
        //             return null;
        //         }

        //         const data = await response.json();
        //         return data.message; // Return the metadata object
        //     } catch (error) {
        //         console.error("Error fetching metadata:", error);
        //         return null;
        //     }
        // }

        // /**
        //  * Step 3: Determine Article Category
        //  */
        // function determineArticleCategory(metadata) {
        //     if (!metadata || !metadata.type) return "Unknown";

        //     const type = metadata.type.toLowerCase();
        //     const title = metadata.title ? metadata.title[0] : "Unknown Title";

        //     if (type.includes("review")) {
        //         return "Review Article";
        //     }
        //     if (type.includes("journal-article") && title.toLowerCase().includes("review")) {
        //         return "Likely a Review Article";
        //     }
        //     return "Journal Article";
        // }

        // /**
        //  * Full Workflow: From Article Link to Category
        //  */
        // async function classifyArticleFromLink(articleUrl) {
        //     console.log(`Processing article URL: ${articleUrl}`);

        //     // // Step 1: Fetch the DOI from the link
        //     // const doi = await fetchDOIFromLink(articleUrl);
        //     // if (!doi) {
        //     //     console.log("DOI not found for this article.");
        //     //     return "DOI not found";
        //     // }

        //     // console.log(`DOI found: ${doi}`);

        //     // Step 2: Fetch metadata using the DOI
        //     // const metadata = await fetchMetadataFromDOI(doi);
        //     const metadata = await fetchMetadataFromDOI(articleUrl);
        //     if (!metadata) {
        //         console.log("Metadata not found for this DOI.");
        //         return "Metadata not found";
        //     }

        //     console.log("Metadata fetched:", metadata);

        //     // Step 3: Determine the category of the article
        //     const category = determineArticleCategory(metadata);
        //     console.log(`Article Category: ${category}`);
        //     return category;
        // }

        // // // Example Usage
        // // classifyArticleFromLink("https://www.nature.com/articles/s41576-022-00483-8")
        // //     .then(category => console.log(`Final Classification: ${category}`))
        // //     .catch(error => console.error("Error:", error));

        //Get author element from webpage DOM
        const authorNameDiv = document.querySelector('#gsc_prf_in').textContent.trim();
        const otherNamesDiv = document.querySelector('#gs_prf_ion_txt');
        let othreNamesStr = "";
        if (otherNamesDiv != undefined) {
            othreNamesStr = otherNamesDiv.textContent.trim();
        }

        let namesList = [];
        let otherNamesList = [];
        //Processing Other-Names tag
        if (othreNamesStr.length > 0) {
            // Split by both `;` and `,` and trim
            let parts = othreNamesStr.split(/;|,|:/).map(part => part.trim()).filter(Boolean);

            // Combine parts that only have one element with the next part
            let i = 0;
            while (i < parts.length) {
                // If there's only one part (initial or incomplete name)
                if (i + 1 < parts.length && parts[i].split(" ").length === 1) {
                    // Combine with the next part if the next part has only one part
                    parts[i] = `${parts[i]}, ${parts[i + 1]}`;
                    parts.splice(i + 1, 1); // Remove the next part after combining
                } else {
                    i++; // Otherwise just move to the next part
                }
            }

            // Now add only elements that have two parts (no single parts left)
            otherNamesList = parts.filter(name => name.split(" ").length === 2);
            otherNamesList = otherNamesList.map(name => {
                // Remove all punctuations except '-'
                let cleanedName = name.replace(/[^\w\s-]|_/g, "")
                    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
                    .trim(); // Remove any leading/trailing spaces

                // Normalize non-Unicode characters like different types of dash (–, —)
                cleanedName = cleanedName.replace(/[–—]/g, '-');

                // Return the cleaned and normalized name
                return cleanNameTitles(replaceSpecialChars(normalizeString(cleanedName)));
            });
            otherNamesList = otherNamesList.filter(name => name.trim() !== "");

            // Reverse each name and add it to the list
            const reversedNames = otherNamesList.map(name => {
                const parts = name.split(" ").map(part => part.trim());
                return parts.reverse().join(" ");
            });

            // Combine the original and reversed lists, ensuring unique names
            otherNamesList = [...otherNamesList, ...reversedNames];

            otherNamesList = otherNamesList.map(name => {
                return name.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();
            });

            // Remove duplicates
            otherNamesList = Array.from(new Set(otherNamesList));
            // console.log(namesList); //DEBUG
        }

        // console.log(otherNamesDiv.toString()); //DEBUG
        // console.log(othreNamesStr.toString()); //DEBUG

        // Remove honorific titles, punctuations and normalize localization characters
        const authorNameLong = cleanNameTitles(replaceSpecialChars(normalizeString(authorNameDiv)));

        // Get surname for short/quick name matching
        const authorNameShort = getSurname(authorNameLong);

        // console.log(namesList); //DEBUG
        // console.log(otherNamesList); //DEBUG

        //Make different combinations of author name
        function getAuthorNameCombinations(name) {
            const nameParts = name.split(" ");
            if (nameParts.length === 1) {
                return [name];
            }
            else {
                const firstInitial = nameParts[0].charAt(0);
                const lastName = nameParts[nameParts.length - 1];
                const firstInitialLastName = `${firstInitial} ${lastName}`;
                const firstNameLastInitial = `${nameParts[0]} ${nameParts[1].charAt(0)}`;
                const lastNamefirstName = `${lastName} ${nameParts[0]}`;
                const lastNamefirstInitial = `${lastName} ${firstInitial}`;
                const lastInitialFirstName = `${lastName.charAt(0)} ${nameParts[0]}`;
                return [firstInitialLastName, firstNameLastInitial, lastNamefirstName, lastNamefirstInitial, lastInitialFirstName];
            }

            return [name];
        }

        // Manickam Natesan
        // Natesan Manickam - lastNamefirstName
        // M Natesan - firstInitialLastName
        // Natesan M - lastNamefirstInitial
        // Manickam N - firstNameLastInitial
        // N Manickam - lastInitialFirstName
        // M N
        // N M

        const nameComboList = getAuthorNameCombinations(authorNameLong);

        namesList.push(authorNameLong);
        namesList = [...namesList, ...nameComboList];
        namesList = [...namesList, ...otherNamesList];

        //Remove duplicates from namesList
        namesList = Array.from(new Set(namesList));

        // console.log(namesList); //DEBUG

        let authorRegexes = []; // [first initial<wildcard *.>surname]
        let authorRegexesEx = []; // [first name<wildcard *.>surname]
        namesList.forEach((name) => {
            authorRegexes.push(getNameRegex(name));
            authorRegexesEx.push(getNameRegexExtended(name));
        })

        // console.log(authorRegexes); //DEBUG
        // console.log(authorRegexesEx); //DEBUG

        // Create regex for author name matching - short and long
        // const authorRegexes = getNameRegex(authorNameLong); // [first initial<wildcard *.>surname]
        // const authorRegexesEx = getNameRegexExtended(authorNameLong); // [first name<wildcard *.>surname]

        // Helper functions to fetch scores dynamically
        // function getQScoreCitations(scoreType) {
        //     return [
        //         author_pos_cite_qscore.get("first_author").get(scoreType),
        //         author_pos_cite_qscore.get("second_author").get(scoreType),
        //         author_pos_cite_qscore.get("co_author").get(scoreType),
        //         author_pos_cite_qscore.get("corresponding_author").get(scoreType)
        //     ];
        // }

        // function getPosCitations(author_pos) {
        //     return [
        //         author_pos_cite_qscore.get(author_pos).get("Q1"),
        //         author_pos_cite_qscore.get(author_pos).get("Q2"),
        //         author_pos_cite_qscore.get(author_pos).get("Q3"),
        //         author_pos_cite_qscore.get(author_pos).get("Q4"),
        //         author_pos_cite_qscore.get(author_pos).get("NA"),
        //     ];
        // }

        // function getPosTotalCitations(author_pos) {
        //     return ( author_pos_cite_qscore.get(author_pos).get("Q1") +
        //         author_pos_cite_qscore.get(author_pos).get("Q2") +
        //         author_pos_cite_qscore.get(author_pos).get("Q3") +
        //         author_pos_cite_qscore.get(author_pos).get("Q4") +
        //         author_pos_cite_qscore.get(author_pos).get("NA") );
        // }

        // function getPosQScores(scoreType) {
        //     return [
        //         qPosCount.get("first_author").get(scoreType),
        //         qPosCount.get("second_author").get(scoreType),
        //         qPosCount.get("co_author").get(scoreType),
        //         qPosCount.get("corresponding_author").get(scoreType)
        //     ];
        // }

        // function getPosQScorePercentages(scoreType) {
        //     return [(qPosCount.get("first_author").get(scoreType) / getQScores("first_author").reduce((a, b) => a + b, 0)) * 100,
        //     (qPosCount.get("second_author").get(scoreType) / getQScores("second_author").reduce((a, b) => a + b, 0)) * 100,
        //     (qPosCount.get("co_author").get(scoreType) / getQScores("co_author").reduce((a, b) => a + b, 0)) * 100,
        //     (qPosCount.get("corresponding_author").get(scoreType) / getQScores("corresponding_author").reduce((a, b) => a + b, 0)) * 100];
        // }

        // function getQScores(authorType) {
        //     return [
        //         qPosCount.get(authorType).get("Q1"),
        //         qPosCount.get(authorType).get("Q2"),
        //         qPosCount.get(authorType).get("Q3"),
        //         qPosCount.get(authorType).get("Q4"),
        //         qPosCount.get(authorType).get("NA")
        //     ];
        // }

        // function getTotalQScores(authorType) {
        //     return (qPosCount.get(authorType).get("Q1") +
        //         qPosCount.get(authorType).get("Q2") +
        //         qPosCount.get(authorType).get("Q3") +
        //         qPosCount.get(authorType).get("Q4") +
        //         qPosCount.get(authorType).get("NA") );
        // }

        // function getQScorePercentages(authorType) {
        //     return [(qPosCount.get(authorType).get("Q1") / qTotal.get("Q1")) * 100,
        //         (qPosCount.get(authorType).get("Q2") / qTotal.get("Q2")) * 100,
        //         (qPosCount.get(authorType).get("Q3") / qTotal.get("Q3")) * 100,
        //         (qPosCount.get(authorType).get("Q4") / qTotal.get("Q4")) * 100,
        //         (qPosCount.get(authorType).get("NA") / qTotal.get("NA")) * 100];
        //     }

        function getQScoreCitationsByYear(scoreType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("author_pos_cite_qscore")) {
                return [0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").get(scoreType),
                yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").get(scoreType),
                yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").get(scoreType),
                yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").get(scoreType)
            ];
        }

        function getPosCitationsByYear(author_pos, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("author_pos_cite_qscore")) {
                return [0, 0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q1"),
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q2"),
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q3"),
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q4"),
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("NA"),
            ];
        }

        function getPosTotalCitationsByYear(author_pos, year) {
            if (yearwiseData.get(year).size <= 0) {
                return (0);
            }

            // console.log(author_pos, year.toString()); //DEBUG
            // console.log(yearwiseData); //DEBUG
            // console.log(yearwiseData.get(year.toString())); //DEBUG
            // console.log(yearwiseData.get(year.toString()).get("author_pos_cite_qscore")); //DEBUG
            // console.log(yearwiseData.get(year.toString()).get("author_pos_cite_qscore").get(author_pos)); //DEBUG
            // console.log(yearwiseData.get(year.toString()).get("author_pos_cite_qscore").get(author_pos).get("Q1")); //DEBUG
            if (!yearwiseData.get(year).has("author_pos_cite_qscore")) {
                return (0);
            }

            return (yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q1") +
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q2") +
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q3") +
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("Q4") +
                yearwiseData.get(year).get("author_pos_cite_qscore").get(author_pos).get("NA"));
        }

        function getPosQScoresByYear(scoreType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("qPosCount")) {
                return [0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("qPosCount").get("first_author").get(scoreType),
                yearwiseData.get(year).get("qPosCount").get("second_author").get(scoreType),
                yearwiseData.get(year).get("qPosCount").get("co_author").get(scoreType),
                yearwiseData.get(year).get("qPosCount").get("corresponding_author").get(scoreType)
            ];
        }

        function getPosQScorePercentagesByYear(scoreType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("qPosCount")) {
                return [0, 0, 0, 0];
            }

            return [(yearwiseData.get(year).get("qPosCount").get("first_author").get(scoreType) / getQScoresByYear("first_author", year).reduce((a, b) => a + b, 0)) * 100,
            (yearwiseData.get(year).get("qPosCount").get("second_author").get(scoreType) / getQScoresByYear("second_author", year).reduce((a, b) => a + b, 0)) * 100,
            (yearwiseData.get(year).get("qPosCount").get("co_author").get(scoreType) / getQScoresByYear("co_author", year).reduce((a, b) => a + b, 0)) * 100,
            (yearwiseData.get(year).get("qPosCount").get("corresponding_author").get(scoreType) / getQScoresByYear("corresponding_author", year).reduce((a, b) => a + b, 0)) * 100];
        }

        function getQScoresByYear(authorType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("qPosCount")) {
                return [0, 0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q1"),
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q2"),
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q3"),
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q4"),
                yearwiseData.get(year).get("qPosCount").get(authorType).get("NA")
            ];
        }

        function getTotalQScoresByYear(authorType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return (0);
            }

            if (!yearwiseData.get(year).has("qPosCount")) {
                return (0);
            }

            return (yearwiseData.get(year).get("qPosCount").get(authorType).get("Q1") +
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q2") +
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q3") +
                yearwiseData.get(year).get("qPosCount").get(authorType).get("Q4") +
                yearwiseData.get(year).get("qPosCount").get(authorType).get("NA"));
        }

        function getQScorePercentagesByYear(authorType, year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("qPosCount")) {
                return [0, 0, 0, 0, 0];
            }

            return [(yearwiseData.get(year).get("qPosCount").get(authorType).get("Q1") / yearwiseData.get(year).get("qTotal").get("Q1")) * 100,
            (yearwiseData.get(year).get("qPosCount").get(authorType).get("Q2") / yearwiseData.get(year).get("qTotal").get("Q2")) * 100,
            (yearwiseData.get(year).get("qPosCount").get(authorType).get("Q3") / yearwiseData.get(year).get("qTotal").get("Q3")) * 100,
            (yearwiseData.get(year).get("qPosCount").get(authorType).get("Q4") / yearwiseData.get(year).get("qTotal").get("Q4")) * 100,
            (yearwiseData.get(year).get("qPosCount").get(authorType).get("NA") / yearwiseData.get(year).get("qTotal").get("NA")) * 100];
        }

        function getTotalPublicationsByYear(year) {
            if (yearwiseData.get(year).size <= 0) {
                return (0);
            }

            if (!yearwiseData.get(year).has("total_publications")) {
                return (0);
            }

            return yearwiseData.get(year).get("total_publications");
        }

        function getPosTotalByYear(year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("author_pos_contrib")) {
                return [0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("author_pos_contrib").get("first_author"),
                yearwiseData.get(year).get("author_pos_contrib").get("second_author"),
                yearwiseData.get(year).get("author_pos_contrib").get("co_author"),
                yearwiseData.get(year).get("author_pos_contrib").get("corresponding_author")
            ];
        }

        function getCitationsTotalByYear(year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("author_pos_cite_contrib")) {
                return [0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("author_pos_cite_contrib").get("first_author"),
                yearwiseData.get(year).get("author_pos_cite_contrib").get("second_author"),
                yearwiseData.get(year).get("author_pos_cite_contrib").get("co_author"),
                yearwiseData.get(year).get("author_pos_cite_contrib").get("corresponding_author")
            ];
        }

        function getCitationDistributionByYear(year) {
            if (yearwiseData.get(year).size <= 0) {
                return [0, 0, 0, 0];
            }

            if (!yearwiseData.get(year).has("author_pos_cite_map")) {
                return [0, 0, 0, 0];
            }

            return [
                yearwiseData.get(year).get("author_pos_cite_map").get("first_author"),
                yearwiseData.get(year).get("author_pos_cite_map").get("second_author"),
                yearwiseData.get(year).get("author_pos_cite_map").get("co_author"),
                yearwiseData.get(year).get("author_pos_cite_map").get("corresponding_author")
            ];
        }

        // CUMULATIVE SCORES FOR YEAR

        function getQScoreCitationsCumulative(scoreType, lower_year, upper_year) {
            let total = [0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let qScores = getQScoreCitationsByYear(scoreType, year.toString());
                for (let i = 0; i < 4; i++) {
                    total[i] += qScores[i];
                }
            }
            return total;
        }

        function getPosCitationsCumulative(author_pos, lower_year, upper_year) {
            let total = [0, 0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let posCitations = getPosCitationsByYear(author_pos, year.toString());
                for (let i = 0; i < 5; i++) {
                    total[i] += posCitations[i];
                }
            }
            return total;
        }

        function getPosTotalCitationsCumulative(author_pos, lower_year, upper_year) {
            let total = 0;
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                total += getPosTotalCitationsByYear(author_pos, year.toString());
            }
            return total;
        }

        function getPosQScoresCumulative(scoreType, lower_year, upper_year) {
            let total = [0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let posQScores = getPosQScoresByYear(scoreType, year.toString());
                for (let i = 0; i < 4; i++) {
                    total[i] += posQScores[i];
                }
            }
            return total;
        }

        function getPosQScorePercentagesCumulative(scoreType, lower_year, upper_year) {
            let total = [0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let posQScorePercentages = getPosQScorePercentagesByYear(scoreType, year.toString());
                for (let i = 0; i < 4; i++) {
                    total[i] += posQScorePercentages[i];
                }
            }
            const year_diff = Math.abs(upper_year - lower_year);
            for (let i = 0; i < 4; i++) {
                total[i] = (total[i] / year_diff) * 100;
            }
            return total;
        }

        function getQScoresCumulative(authorType, lower_year, upper_year) {
            let total = [0, 0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let qScores = getQScoresByYear(authorType, year.toString());
                for (let i = 0; i < 5; i++) {
                    total[i] += qScores[i];
                }
            }
            return total;
        }

        function getTotalQScoresCumulative(authorType, lower_year, upper_year) {
            let total = 0;
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                total += getTotalQScoresByYear(authorType, year.toString());
            }
            return total;
        }

        function getQScorePercentagesCumulative(authorType, lower_year, upper_year) {
            let total = [0, 0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let qScorePercentages = getQScorePercentagesByYear(authorType, year.toString());
                for (let i = 0; i < 5; i++) {
                    total[i] += qScorePercentages[i];
                }
            }
            const year_diff = Math.abs(upper_year - lower_year);
            for (let i = 0; i < 5; i++) {
                total[i] = (total[i] / year_diff) * 100;
            }
            return total;
        }

        function getTotalPublicationsCumulative(lower_year, upper_year) {
            let total = 0;
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                total += getTotalPublicationsByYear(year.toString());
            }
            return total;
        }

        function getPosTotalCumulative(lower_year, upper_year) {
            let total = [0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let posTotal = getPosTotalByYear(year.toString());
                for (let i = 0; i < 4; i++) {
                    total[i] += posTotal[i];
                }
            }
            return total;
        }

        function getCitationsTotalCumulative(lower_year, upper_year) {
            let total = [0, 0, 0, 0];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let citationsTotal = getCitationsTotalByYear(year.toString());
                for (let i = 0; i < 4; i++) {
                    total[i] += citationsTotal[i];
                }
            }
            return total;
        }

        function getCitationDistributionCumulative(lower_year, upper_year) {
            let total = [[], [], [], []];
            for (let year = lower_year; year <= upper_year; year++) {
                if (!yearList.includes(year.toString())) {
                    continue;
                }
                let citationDistribution = getCitationDistributionByYear(year.toString());
                for (let i = 0; i < 4; i++) {
                    // console.log("citationDistribution[" + i+"] : " + citationDistribution[i]); //DEBUG
                    total[i].push(citationDistribution[i]);
                    total[i] = total[i].toString().split(',').filter(element => element !== "").map(Number);
                    // total[i] = total[i].filter(Boolean);
                    // console.log("total[" + i+"] : " + total[i]); //DEBUG
                }
            }
            return total;
        }

        // Function to create and display the chart and progress bars
        function updateAuthorChart() {

            // console.log(selectedMinYear, selectedPeryearCheck ? selectedSingleYear : selectedMaxYear); //DEBUG
            // console.log(yearwiseData); //DEBUG
            // console.log(yearList); //DEBUG
            // console.log(selectedPeryearCheck, selectedCumulativeCheck, selectedSingleYear, selectedMinYear, selectedMaxYear); //DEBUG
            // const plottingMinYear = selectedPeryearCheck ?  selectedCumulativeCheck ? selectedMinYear : selectedSingleYear : selectedMinYear;
            const plottingMinYear = selectedPeryearCheck ? selectedCumulativeCheck ? minYear : selectedSingleYear : selectedMinYear;
            const plottingMaxYear = selectedPeryearCheck ? selectedSingleYear : selectedMaxYear;

            // hFirst = hIndexArr[0];
            // hSecond = hIndexArr[1];
            // hOther = hIndexArr[2];
            // hCO = hIndexArr[3];

            // // Calculate shIndex as 90% of hFirst, 50% of hSecond, 10% of hOther, and 100% of hCO
            // shIndex = 0.9 * hFirst + 0.5 * hSecond + 0.1 * hOther + 1.0 * hCO;

            // document.getElementById("sh_index").textContent = `Sh-Index:${shIndex}`
            // document.getElementById("h_first").textContent = hFirst.toString();
            // document.getElementById("h_second").textContent = hSecond.toString();
            // document.getElementById("h_other").textContent = hOther.toString();
            // document.getElementById("h_co").textContent = hCO.toString();

            // console.log(selectedPeryearCheck, selectedCumulativeCheck, plottingMinYear, plottingMaxYear); //DEBUG


            // firstAuthorCount = author_pos_contrib.get("first_author");
            // secondAuthorCount = author_pos_contrib.get("second_author");
            // correspondingAuthorCount = author_pos_contrib.get("corresponding_author");
            // coAuthorCount = author_pos_contrib.get("co_author");

            // firstAuthorCitationsTotal = author_pos_cite_contrib.get("first_author");
            // secondAuthorCitationsTotal = author_pos_cite_contrib.get("second_author");
            // correspondingAuthorCitationsTotal = author_pos_cite_contrib.get("corresponding_author");
            // coAuthorCitationsTotal = author_pos_cite_contrib.get("co_author");
            // const totalAuthorCitations = firstAuthorCitationsTotal + secondAuthorCitationsTotal + correspondingAuthorCitationsTotal + coAuthorCitationsTotal;


            // const firstAuthorCitationsPercentage = ((firstAuthorCitationsTotal / totalAuthorCitations) * 100).toFixed(2);
            // const secondAuthorCitationsPercentage = ((secondAuthorCitationsTotal / totalAuthorCitations) * 100).toFixed(2);
            // const correspondingAuthorCitationsPercentage = ((correspondingAuthorCitationsTotal / totalAuthorCitations) * 100).toFixed(2);
            // const coAuthorCitationsPercentage = ((coAuthorCitationsTotal / totalAuthorCitations) * 100).toFixed(2);

            // //If you want it to add upto 100 then use this
            // const totalAuthorContributions = firstAuthorCount + secondAuthorCount + correspondingAuthorCount + coAuthorCount;

            // // firstAuthorPercentage = ((firstAuthorCount / totalPublications) * 100).toFixed(2);
            // // secondAuthorPercentage = ((secondAuthorCount / totalPublications) * 100).toFixed(2);
            // // correspondingAuthorPercentage = ((correspondingAuthorCount / totalPublications) * 100).toFixed(2);
            // // coAuthorPercentage = ((coAuthorCount / totalPublications) * 100).toFixed(2);

            // firstAuthorPercentage = ((firstAuthorCount / totalAuthorContributions) * 100).toFixed(2);
            // secondAuthorPercentage = ((secondAuthorCount / totalAuthorContributions) * 100).toFixed(2);
            // correspondingAuthorPercentage = ((correspondingAuthorCount / totalAuthorContributions) * 100).toFixed(2);
            // coAuthorPercentage = ((coAuthorCount / totalAuthorContributions) * 100).toFixed(2);

            // Initialize the Chart.js bar chart
            // const ctx = document.getElementById('authorChart').getContext('2d');
            // new Chart(ctx, {
            //     type: 'bar',
            //     data: {
            //         labels: ['First Author', 'Second Author', 'Co-Author', 'Corresponding Author'],
            //         datasets: [{
            //             label: 'Author Contributions',
            //             data: [firstAuthorCount, secondAuthorCount, coAuthorCount, correspondingAuthorCount],
            //             backgroundColor: backgroundColor,
            //             borderColor: borderColor,
            //             borderWidth: 1
            //         }]
            //     },
            //     options: {
            //         responsive: true,
            //         plugins: {
            //             legend: {
            //                 display: false  // Completely hide the legend
            //             }
            //         },
            //         scales: {
            //             x: {
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
            //                 }
            //             },
            //             y: {
            //                 beginAtZero: true,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
            //                 }
            //             }
            //         }
            //     }
            // });

            const posTotalCitations = [
                getPosTotalCitationsCumulative("first_author", plottingMinYear, plottingMaxYear),
                getPosTotalCitationsCumulative("second_author", plottingMinYear, plottingMaxYear),
                getPosTotalCitationsCumulative("co_author", plottingMinYear, plottingMaxYear),
                getPosTotalCitationsCumulative("corresponding_author", plottingMinYear, plottingMaxYear)
            ];

            const qScoreCitations = [
                getQScoreCitationsCumulative("Q1", plottingMinYear, plottingMaxYear),
                getQScoreCitationsCumulative("Q2", plottingMinYear, plottingMaxYear),
                getQScoreCitationsCumulative("Q3", plottingMinYear, plottingMaxYear),
                getQScoreCitationsCumulative("Q4", plottingMinYear, plottingMaxYear),
                getQScoreCitationsCumulative("NA", plottingMinYear, plottingMaxYear)
            ];

            const authorCitationsChartData = {
                // labels: ['First Author Citations\nTotal:' + getPosTotalCitations("first_author"), 'Second Author Citations\nTotal:' + getPosTotalCitations("second_author"), 'Co-Author Citations\nTotal:' + getPosTotalCitations("co_author"), 'Corresponding Author Citations\nTotal:' + getPosTotalCitations("corresponding_author")],
                labels: ['First Author Citations\nTotal:' + posTotalCitations[0], 'Second Author Citations\nTotal:' + posTotalCitations[1], 'Co-Author Citations\nTotal:' + posTotalCitations[2], 'Corresponding Author Citations\nTotal:' + posTotalCitations[3]],
                datasets: [
                    // { label: 'Q1 Citations', data: getQScoreCitations("Q1"), backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
                    // { label: 'Q2 Citations', data: getQScoreCitations("Q2"), backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
                    // { label: 'Q3 Citations', data: getQScoreCitations("Q3"), backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
                    // { label: 'Q4 Citations', data: getQScoreCitations("Q4"), backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
                    // { label: 'NA Citations', data: getQScoreCitations("NA"), backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 }
                    { label: 'Q1 Citations', data: qScoreCitations[0], backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
                    { label: 'Q2 Citations', data: qScoreCitations[1], backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
                    { label: 'Q3 Citations', data: qScoreCitations[2], backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
                    { label: 'Q4 Citations', data: qScoreCitations[3], backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
                    { label: 'NA Citations', data: qScoreCitations[4], backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 }
                ]
            };

            let chartStatus = Chart.getChart("authorCitationsChart"); // <canvas> id
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                chartStatus.data = authorCitationsChartData;
                chartStatus.update();
            } else {
                const ctxCitations = document.getElementById('authorCitationsChart').getContext('2d');
                new Chart(ctxCitations, {
                    type: 'bar',
                    data: authorCitationsChartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false  // Completely hide the legend
                            },
                            title: {
                                display: true,
                                text: 'Citation Count based on Authorship with Journal Rank Categorization'
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            }
                        }
                    }
                });
            }

            const citationDistributions = getCitationDistributionCumulative(plottingMinYear, plottingMaxYear);

            const authorCitationsDistChartData = {
                labels: ['First Author Citations', 'Second Author Citations', 'Co-Author Citations', 'Corresponding Author Citations'],
                datasets: [{
                    label: 'Citation Distribution',
                    // data: [author_pos_cite_map.get("first_author"), author_pos_cite_map.get("second_author"), author_pos_cite_map.get("co_author"), author_pos_cite_map.get("corresponding_author")],
                    data: [citationDistributions[0], citationDistributions[1], citationDistributions[2], citationDistributions[3]],
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1
                }]
            };

            chartStatus = Chart.getChart("authorCitationsDistChart"); // <canvas> id
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                chartStatus.data = authorCitationsDistChartData;
                chartStatus.update();
            } else {
                const ctxRatio = document.getElementById('authorCitationsDistChart').getContext('2d');
                new Chart(ctxRatio, {
                    // type: 'boxplot',
                    type: 'violin',
                    data: authorCitationsDistChartData,
                    options: {
                        responsive: true,
                        whiskersMode: 'exact',
                        coef: 0,
                        plugins: {
                            legend: {
                                display: false  // Completely hide the legend
                            },
                            title: {
                                display: true,
                                text: 'Citation Distribution based on Authorship (Log Scale)'
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            },
                            y: {
                                type: 'logarithmic',
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            }
                        }
                    }
                });
            }

            const posTotals = getPosTotalCumulative(plottingMinYear, plottingMaxYear);

            //If you want it to add upto 100 then use this
            const totalAuthorContributions = posTotals[0] + posTotals[1] + posTotals[2] + posTotals[3];

            // firstAuthorPercentage = ((firstAuthorCount / totalPublications) * 100).toFixed(2);
            // secondAuthorPercentage = ((secondAuthorCount / totalPublications) * 100).toFixed(2);
            // correspondingAuthorPercentage = ((correspondingAuthorCount / totalPublications) * 100).toFixed(2);
            // coAuthorPercentage = ((coAuthorCount / totalPublications) * 100).toFixed(2);

            const firstAuthorPercentage = ((posTotals[0] / totalAuthorContributions) * 100).toFixed(2);
            const secondAuthorPercentage = ((posTotals[1] / totalAuthorContributions) * 100).toFixed(2);
            const correspondingAuthorPercentage = ((posTotals[3] / totalAuthorContributions) * 100).toFixed(2);
            const coAuthorPercentage = ((posTotals[2] / totalAuthorContributions) * 100).toFixed(2);

            const authorStackedChartData = {
                // labels: ['Author Contribution %'],
                labels: [''],
                datasets: [{
                    label: 'First Author Contribution %',
                    data: [firstAuthorPercentage], // Make sure it's one value per dataset
                    backgroundColor: backgroundColor[0], //'rgba(75, 192, 192, 0.2)',
                    borderColor: borderColor[0], //'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Second Author Contribution %',
                    data: [secondAuthorPercentage], // One value per dataset
                    backgroundColor: backgroundColor[1], //'rgba(153, 102, 255, 0.2)',
                    borderColor: borderColor[1], //'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }, {
                    label: 'Co-Author Contribution %',
                    data: [coAuthorPercentage], // One value per dataset
                    backgroundColor: backgroundColor[2], //'rgba(255, 159, 64, 0.2)',
                    borderColor: borderColor[2], //'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }, {
                    label: 'Corresponding Author Contribution %',
                    data: [correspondingAuthorPercentage], // One value per dataset
                    backgroundColor: backgroundColor[3], //'rgba(54, 162, 235, 0.2)',
                    borderColor: borderColor[3], //'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            };

            chartStatus = Chart.getChart("authorStackedChart"); // <canvas> id
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                // const ctxStackedChart = document.getElementById('authorStackedChart');
                // ctxStackedChart.height = 150;
                const ctxStackedChart = document.getElementById('authorStackedChartDiv');
                ctxStackedChart.style.height = "150px";
                chartStatus.data = authorStackedChartData;
                chartStatus.update();
            } else {
                // const ctxStackedChart = document.getElementById('authorStackedChart');
                // ctxStackedChart.height = 150;
                const ctxStackedChart = document.getElementById('authorStackedChartDiv');
                ctxStackedChart.style.height = "150px";
                const ctxStacked = document.getElementById('authorStackedChart').getContext('2d');
                new Chart(ctxStacked, {
                    type: 'bar',
                    data: authorStackedChartData,
                    options: {
                        indexAxis: 'y',
                        responsive: true,  // Make the chart responsive to container size
                        maintainAspectRatio: false,  // Allow the chart to change size freely
                        plugins: {
                            legend: {
                                display: false  // Completely hide the legend
                            },
                            title: {
                                display: true,
                                text: 'Author Contribution in % based on Authorship'
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            }
                        }
                    }
                });
            }

            const citationsTotals = getCitationsTotalCumulative(plottingMinYear, plottingMaxYear);

            const totalAuthorCitations = citationsTotals[0] + citationsTotals[1] + citationsTotals[2] + citationsTotals[3];


            const firstAuthorCitationsPercentage = ((citationsTotals[0] / totalAuthorCitations) * 100).toFixed(2);
            const secondAuthorCitationsPercentage = ((citationsTotals[1] / totalAuthorCitations) * 100).toFixed(2);
            const correspondingAuthorCitationsPercentage = ((citationsTotals[3] / totalAuthorCitations) * 100).toFixed(2);
            const coAuthorCitationsPercentage = ((citationsTotals[2] / totalAuthorCitations) * 100).toFixed(2);

            const citationsStackedChartData = {
                // labels: ['Citation Contribution %'],
                labels: [''],
                datasets: [{
                    label: 'First Author Citations %',
                    data: [firstAuthorCitationsPercentage], // Make sure it's one value per dataset
                    backgroundColor: backgroundColor[0], //'rgba(75, 192, 192, 0.2)',
                    borderColor: borderColor[0], //'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Second Author Citations %',
                    data: [secondAuthorCitationsPercentage], // One value per dataset
                    backgroundColor: backgroundColor[1], //'rgba(153, 102, 255, 0.2)',
                    borderColor: borderColor[1], //'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }, {
                    label: 'Co-Author Citations %',
                    data: [coAuthorCitationsPercentage], // One value per dataset
                    backgroundColor: backgroundColor[2], //'rgba(255, 159, 64, 0.2)',
                    borderColor: borderColor[2], //'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }, {
                    label: 'Corresponding Author Citations %',
                    data: [correspondingAuthorCitationsPercentage], // One value per dataset
                    backgroundColor: backgroundColor[3], //'rgba(54, 162, 235, 0.2)',
                    borderColor: borderColor[3], //'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            };

            chartStatus = Chart.getChart("citationsStackedChart"); // <canvas> id
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                // const ctxCitationsStackedChart = document.getElementById('citationsStackedChart');
                // ctxCitationsStackedChart.height = 150;
                const ctxCitationsStackedChart = document.getElementById('citationsStackedChartDiv');
                ctxCitationsStackedChart.style.height = "150px";
                chartStatus.data = citationsStackedChartData;
                chartStatus.update();
            } else {
                // const ctxCitationsStackedChart = document.getElementById('citationsStackedChart');
                // ctxCitationsStackedChart.height = 150;
                const ctxCitationsStackedChart = document.getElementById('citationsStackedChartDiv');
                ctxCitationsStackedChart.style.height = "150px";
                const ctxCitationsStacked = document.getElementById('citationsStackedChart').getContext('2d');
                new Chart(ctxCitationsStacked, {
                    type: 'bar',
                    data: citationsStackedChartData,
                    options: {
                        indexAxis: 'y',
                        responsive: true,  // Make the chart responsive to container size
                        maintainAspectRatio: false,  // Allow the chart to change size freely
                        plugins: {
                            legend: {
                                display: false  // Completely hide the legend
                            },
                            title: {
                                display: true,
                                text: 'Citation Contribution in % based on Authorship'
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            }
                        }
                    }
                });
            }

            // const ctxQScorePos = document.getElementById('qScorePosChart').getContext('2d');
            // new Chart(ctxQScorePos, {
            //     type: 'bar',
            //     data: {
            //         labels: ['First Author Q*', 'Second Author Q*', 'Co-Author Q*', 'Corresponding Author Q*'],
            //         // labels: ["Q1", "Q2", "Q3", "Q4", "NA"],
            //         datasets: [
            //             { label: 'Q1 Score By Position', data: getPosQScores("Q1"), backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            //             { label: 'Q2 Score By Position', data: getPosQScores("Q2"), backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            //             { label: 'Q3 Score By Position', data: getPosQScores("Q3"), backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            //             { label: 'Q4 Score By Position', data: getPosQScores("Q4"), backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 },
            //             { label: 'NA Score By Position', data: getPosQScores("NA"), backgroundColor: "rgba(0,0,0,0.4)", borderColor: "rgba(0,0,0,1)", borderWidth: 1 }
            //         ]
            //     },
            //     options: {
            //         responsive: true,
            //         plugins: {
            //             legend: {
            //                 display: true
            //             }
            //         },
            //         scales: {
            //             x: {
            //                 stacked: false,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             },
            //             y: {
            //                 beginAtZero: true,
            //                 stacked: false,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             }
            //         }
            //     }
            // });

            // const ctxQScore = document.getElementById('qScoreChart').getContext('2d');
            // new Chart(ctxQScore, {
            //     type: 'bar',
            //     data: {
            //         labels: ["Q1", "Q2", "Q3", "Q4", "NA"],
            //         datasets: [
            //             { label: 'First Author Q*', data: getQScores("first_author"), backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            //             { label: 'Second Author Q*', data: getQScores("second_author"), backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            //             { label: 'Co-Author Q*', data: getQScores("co_author"), backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            //             { label: 'Corresponding-Author Q*', data: getQScores("corresponding_author"), backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 }
            //         ]
            //     },
            //     options: {
            //         responsive: true,
            //         plugins: {
            //             legend: {
            //                 display: true
            //             }
            //         },
            //         scales: {
            //             x: {
            //                 stacked: false,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             },
            //             y: {
            //                 beginAtZero: true,
            //                 stacked: false,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             }
            //         }
            //     }
            // });

            const posQScoresTotals = [
                getTotalQScoresCumulative("first_author", plottingMinYear, plottingMaxYear),
                getTotalQScoresCumulative("second_author", plottingMinYear, plottingMaxYear),
                getTotalQScoresCumulative("co_author", plottingMinYear, plottingMaxYear),
                getTotalQScoresCumulative("corresponding_author", plottingMinYear, plottingMaxYear)
            ];

            const posQScores = [
                getPosQScoresCumulative("Q1", plottingMinYear, plottingMaxYear),
                getPosQScoresCumulative("Q2", plottingMinYear, plottingMaxYear),
                getPosQScoresCumulative("Q3", plottingMinYear, plottingMaxYear),
                getPosQScoresCumulative("Q4", plottingMinYear, plottingMaxYear),
                getPosQScoresCumulative("NA", plottingMinYear, plottingMaxYear)
            ];

            const qScorePosStackedChartData = {
                // labels: ['First Author Q*\nTotal:' + getTotalQScores("first_author"), 'Second Author Q*\nTotal:' + getTotalQScores("second_author"), 'Co-Author Q*\nTotal:' + getTotalQScores("co_author"), 'Corresponding Author Q*\nTotal:' + getTotalQScores("corresponding_author")],
                labels: ['First Author Q*\nTotal:' + posQScoresTotals[0], 'Second Author Q*\nTotal:' + posQScoresTotals[1], 'Co-Author Q*\nTotal:' + posQScoresTotals[2], 'Corresponding Author Q*\nTotal:' + posQScoresTotals[3]],
                datasets: [
                    // { label: "Q1", data: getPosQScores("Q1"), backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
                    // { label: "Q2", data: getPosQScores("Q2"), backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
                    // { label: "Q3", data: getPosQScores("Q3"), backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
                    // { label: "Q4", data: getPosQScores("Q4"), backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
                    // { label: "NA", data: getPosQScores("NA"), backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 }
                    { label: "Q1", data: posQScores[0], backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
                    { label: "Q2", data: posQScores[1], backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
                    { label: "Q3", data: posQScores[2], backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
                    { label: "Q4", data: posQScores[3], backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
                    { label: "NA", data: posQScores[4], backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 }
                ]
            };

            chartStatus = Chart.getChart("qScorePosStackedChart"); // <canvas> id
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                chartStatus.data = qScorePosStackedChartData;
                chartStatus.update();
            } else {
                const ctxQScorePosStacked = document.getElementById('qScorePosStackedChart').getContext('2d');
                new Chart(ctxQScorePosStacked, {
                    type: 'bar',
                    data: qScorePosStackedChartData,
                    options: {
                        indexAxis: 'x',
                        // responsive: true,  // Make the chart responsive to container size
                        // maintainAspectRatio: false,  // Allow the chart to change size freely
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Publication Count based on Authorship with Journal Rank Categorization'
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
                                }
                            },
                            y: {
                                beginAtZero: true,
                                stacked: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
                                }
                            }
                        }
                    }
                });
            }

            //OLD PLOT but keep it for now
            // const ctxQScorePosStacked = document.getElementById('qScorePosStackedChart').getContext('2d');
            // new Chart(ctxQScorePosStacked, {
            //     type: 'bar',
            //     data: {
            //         labels: ['First Author Q* %', 'Second Author Q* %', 'Co-Author Q* %', 'Corresponding Author Q* %'],
            //         datasets: [
            //             { label: 'Q1 % By Position', data: getPosQScorePercentages("Q1"), backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            //             { label: 'Q2 % By Position', data: getPosQScorePercentages("Q2"), backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            //             { label: 'Q3 % By Position', data: getPosQScorePercentages("Q3"), backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            //             { label: 'Q4 % By Position', data: getPosQScorePercentages("Q4"), backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 },
            //             { label: 'NA % By Position', data: getPosQScorePercentages("NA"), backgroundColor: "rgba(0,0,0,0.4)", borderColor: "rgba(0,0,0,1)", borderWidth: 1 }
            //         ]
            //     },
            //     options: {
            //         indexAxis: 'y',
            //         responsive: true,  // Make the chart responsive to container size
            //         maintainAspectRatio: false,  // Allow the chart to change size freely
            //         plugins: {
            //             legend: {
            //                 display: false
            //             }
            //         },
            //         scales: {
            //             x: {
            //                 stacked: true,
            //                 max: 100,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             },
            //             y: {
            //                 beginAtZero: true,
            //                 stacked: true,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             }
            //         }
            //     }
            // });

            // const ctxQScoreStacked = document.getElementById('qScoreStackedChart').getContext('2d');
            // new Chart(ctxQScoreStacked, {
            //     type: 'bar',
            //     data: {
            //         labels: ['Q1 %', 'Q2 %', 'Q3 %', 'Q4 %', 'NA %'],
            //         datasets: [
            //             { label: 'First Author Q* %', data: getQScorePercentages("first_author"), backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            //             { label: 'Second Author Q* %', data: getQScorePercentages("second_author"), backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            //             { label: 'Co-Author Q* %', data: getQScorePercentages("co_author"), backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            //             { label: 'Corresponding-Author Q* %', data: getQScorePercentages("corresponding_author"), backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 }
            //         ]
            //     },
            //     options: {
            //         plugins: {
            //             legend: {
            //                 display: false
            //             }
            //         },
            //         indexAxis: 'y',
            //         responsive: true,  // Make the chart responsive to container size
            //         maintainAspectRatio: false,  // Allow the chart to change size freely
            //         scales: {
            //             x: {
            //                 stacked: true,
            //                 max: 100,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             },
            //             y: {
            //                 beginAtZero: true,
            //                 stacked: true,
            //                 grid: {
            //                     color: 'rgba(0, 0, 0, 0.05)' // Transparent gridlines
            //                 }
            //             }
            //         }
            //     }
            // });

            // const cumulativeCheck = document.getElementById("cumulative_checkbox");
            // const cumulativeCheckLabel = document.querySelector('label[for="cumulative_checkbox"]');
            // const singleRangeTrack = document.getElementById("single_range_track");
            // const peryearCheck = document.getElementById("peryear_checkbox");
            // const singleSlider = document.getElementById("single_range_slider");
            // const doubleSlider = document.getElementById("double_range_slider");

            const doubleRangeInputs = document.querySelectorAll(".double_range_slider_box input");
            const singleRangeInput = document.getElementById("single_range");
            // singleRangeInput.min = minYear;
            // singleRangeInput.max = maxYear;
            singleRangeInput.value = selectedSingleYear.toString();

            // doubleRangeInputs[0].min = minYear;
            // doubleRangeInputs[0].max = maxYear;
            doubleRangeInputs[0].value = selectedMinYear.toString();
            // doubleRangeInputs[1].min = minYear;
            // doubleRangeInputs[1].max = maxYear;
            doubleRangeInputs[1].value = selectedMaxYear.toString();

            // console.log("before update: ", selectedMinYear , selectedMaxYear);

            updateSingleRange(selectedSingleYear);
            updateDoubleRangeMin(selectedMinYear);
            updateDoubleRangeMax(selectedMaxYear);

            peryearChecker();
            cumulativeChecker();

            selectedMinYear = parseInt(doubleRangeInputs[0].value);
            selectedMaxYear = parseInt(doubleRangeInputs[1].value);
            selectedSingleYear = parseInt(singleRangeInput.value);

            // if (peryearCheck.checked) {
            //     singleSlider.style.display = "flex";
            //     doubleSlider.style.display = "none";
            //     cumulativeCheckbox.style.display = "inline-block";
            //     cumulativeCheckboxLabel.style.display = "inline-block";
            // } else {
            //     singleSlider.style.display = "none";
            //     doubleSlider.style.display = "flex";
            //     cumulativeCheckbox.style.display = "none";
            //     cumulativeCheckboxLabel.style.display = "none";
            // }

            // if(cumulativeCheck.checked){
            //     singleRangeTrack.style.display = "flex";
            // }

            const totalPubsElement = document.getElementById("total_pubs");
            const ignoredPubsElement = document.getElementById("ignored_pubs");
            const consideredPubsElement = document.getElementById("considered_pubs");
            const consideredAuthorNamesElement = document.getElementById("using_author_names");

            totalPubsElement.textContent = DOMPurify.sanitize(`${totalPublications.toString()}`);
            consideredPubsElement.textContent = DOMPurify.sanitize(`${totalPublications - (pub_author_no_match )}`);
            ignoredPubsElement.textContent = DOMPurify.sanitize(`${pub_author_no_match }`);
            consideredAuthorNamesElement.textContent = DOMPurify.sanitize(`${authorNamesConsidered.toString()}`);

            // Enable the download button and display the chart container
            downloadDetailsButton.disabled = false;
            downloadPlotsButton.disabled = false;
            chartMainContainer.style.display = "block";
        }

        function draw10yearsChart() {
            const decadeCounts = [];
            const decadeYear = [];
            // const publicationDropOff = [];
            const pubMachineYearList = [];
            let isPubMachine = false;
            let curr_year = maxYear - 10;
            while (curr_year <= maxYear) {
                decadeYear.push(curr_year);
                if (yearwiseData.has(curr_year.toString())) {
                    const pubs_for_year = yearwiseData.get(curr_year.toString()).get("total_publications");
                    decadeCounts.push(pubs_for_year);
                    if(pubs_for_year > pubMachineThreshold) { //publication machine threshold
                        isPubMachine = true;
                        pubMachineYearList.push(curr_year);
                    }
                } else {
                    decadeCounts.push(0);
                }
                // publicationDropOff.push(60); //publication drop-off is 60
                curr_year += 1;
            }

            if(isPubMachine){
                document.getElementById("pubmachine_banner").textContent = `>${pubMachineThreshold} Papers/Year (${pubMachineYearList.join(", ")})`;
            }

            // console.log(maxYear); //DEBUG
            // console.log(decadeCounts); //DEBUG
            // console.log(decadeYear); //DEBUG
            const decadeCountsChartData = {
                labels: decadeYear,//['Decade at a glance'],
                datasets: [
                    {
                        // type: 'bar',
                        label: ['Publication Count'],
                        data: decadeCounts, backgroundColor: QbackgroundColor[0][0], borderColor: QborderColor[0][0], borderWidth: 1
                    }
                    // {
                    //     label: 'Publication Drop-Off',
                    //     data: publicationDropOff,
                    //     fill: false,
                    //     // backgroundColor: ['#000000', '#000000', '#000000', '#000000'],
                    //     // Changes this dataset to become a line
                    //     type: 'line'
                    // }
                ]
            };

            // Chart.register(Chart.Annotation);

            const dropOffPlugin = {
                id: 'dropOffLine',
                afterDraw(chart, args, options) {
                  const { ctx, scales } = chart;
                  const yScale = scales.y;
                  const xScale = scales.x;
              
                  // Compute pixel at y = options.value
                  const yValue = options.value;
                  const yPixel = yScale.getPixelForValue(yValue);
              
                  ctx.save();
                  ctx.beginPath();
                  ctx.strokeStyle = options.borderColor;
                  ctx.lineWidth   = options.borderWidth;
                  ctx.moveTo(xScale.left,  yPixel);
                  ctx.lineTo(xScale.right, yPixel);
                  ctx.stroke();
              
                  if (options.label && options.label.enabled) {
                    ctx.fillStyle = options.label.color || options.borderColor;
                    ctx.textAlign  = options.label.position === 'start' ? 'left' : 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(
                      options.label.content,
                      (xScale.left + xScale.right) / 2,
                      yPixel - 4
                    );
                  }
                  ctx.restore();
                }
              };
              
              // Register the plugin globally
              Chart.register(dropOffPlugin);

            let chartStatus = Chart.getChart("tenyearPubCountChart");
            if (chartStatus != undefined) {
                // chartStatus.clear();
                // chartStatus.destroy();
                chartStatus.data = decadeCountsChartData;
                chartStatus.update();
            } else {
                const decadeCountsChart = document.getElementById('tenyearPubCountChart').getContext('2d');
                new Chart(decadeCountsChart, {
                    type: 'bar',
                    // type: 'scatter',
                    data: decadeCountsChartData,
                    options: {
                        responsive: false,
                        // maxBarThickness: 2,
                        plugins: {
                            legend: {
                                display: false  // Completely hide the legend
                            },
                            title: {
                                display: true,
                                text: 'Publication Counts of last 10 years'
                            },
                            dropOffLine: {
                                value: pubMachineThreshold,
                                borderColor: 'rgba(6, 40, 233, 0.7)',
                                borderWidth: 2,
                                z:-1,
                                label: {
                                  enabled: true,
                                  content: 'Publication Machine',
                                  position: 'start',    // 'start'|'center'|'end'
                                  color: 'rgba(6, 40, 233, 0.7)',
                                  z:-2
                                }
                            }
                    },
                        scales: {
                            x: {
                                stacked: false,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                                }
                            },
                            y: {
                                stacked: false,
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the y-axis gridlines
                                }
                            }
                        }
                    }
                });
            }

        }

        // Main scraping function for publications, citations, year, and authors
        const scrapePublications = async () => {
            // Get all publication elements
            const publicationElements = document.querySelectorAll('.gsc_a_tr');
            // let urls = [];
            // // const publicationAuthorPositions = [];
            // const publicationAuthorPositions = new Map();

            const journalAttributesCache = new Map();
            function getExcelColumns(journalTitle, jsonData, cols = [5, 7]) {
                // Ensure both strings are compared case-insensitively. Split by comma and take the first part. replace numbers, punctuations and extra spaces
                const lowerCaseJournalTitle = journalTitle.toLowerCase().split(/,\s*(.+)/)[0].replace(/\d+/g, '').replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();
                if (journalAttributesCache.has(lowerCaseJournalTitle)) return journalAttributesCache.get(lowerCaseJournalTitle);
                for (const entry of jsonData) {
                    // Compare the 'Name' attribute case-insensitively
                    if (entry.Name && lowerCaseJournalTitle.includes(entry.Name.toLowerCase()) && entry.Name.toLowerCase().includes(lowerCaseJournalTitle)) {
                        // Retrieve the 8th attribute (counting starts from 0)
                        // console.log(entry); //DEBUG
                        const attributeValues = Array.from(Object.values(entry));
                        // console.log(attributeValues); //DEBUG
                        // console.log(Math.max(...cols)); //DEBUG
                        if (attributeValues.length >= Math.max(...cols)) {
                            const selectedValues = [entry.JIF5Years, entry.Qscore]; //cols.map(index => attributeValues[index]);
                            // console.log("Journal Title: ", lowerCaseJournalTitle, "Excel Column: ", selectedValues); //DEBUG
                            journalAttributesCache.set(lowerCaseJournalTitle, selectedValues);
                            return selectedValues; // 5ht col contains the impact factor and 8th attribute/Column which is the Q* score in the excel file/JSON
                        } else {
                            // console.warn("Entry doesn't have enough attributes.", entry, attributeValues.toString());
                            journalAttributesCache.set(lowerCaseJournalTitle, ["NA", "NA"]);
                            return ["NA", "NA"];
                        }
                    }
                }
                journalAttributesCache.set(lowerCaseJournalTitle, ["NA", "NA"]);
                return ["NA", "NA"];
            }

            // async function resolveRedirect(url)
            // {
            //     try {
            //         const response = await fetch(url, { method: "HEAD", redirect: "manual" });
            //         if (response.status >= 300 && response.status < 400) {
            //             const redirectUrl = response.headers.get("location");
            //             console.log(redirectUrl); //DEBUG
            //             return redirectUrl ? new URL(redirectUrl, url).href : null; // Resolve relative redirects
            //         }
            //         return url; // No redirection
            //     } catch (error) {
            //         console.error("Error resolving redirect:", error);
            //         return null;
            //     }
            // }

            // async function resolveFinalUrl(encodedUrl) {
            //     // console.warn(encodedUrl); //DEBUG
            //     try {
            //         const response = await axios.get(decodeURIComponent(encodedUrl), {
            //         maxRedirects: 1,
            //         validateStatus: status => status >= 200 && status < 400,
            //         });
            //         const finalUrl = response.request.res.responseUrl || response.request._redirectable._options.href;
            //     console.warn(finalUrl); //DEBUG

            //         return finalUrl;
            //     } catch (error) {
            //         console.error('Error resolving final URL:', error);
            //         return null;
            //     }
            // }

            publicationElements.forEach(async (element, index) => {
                // Pre-process the expanded publication table
                const publicationTitleElement = element.querySelector('.gsc_a_t a');
                const publicationTitle = publicationTitleElement ? publicationTitleElement.textContent.trim() : "No title";
                const publicationUrl = publicationTitleElement ? publicationTitleElement.href : null;

                let citationCountElement = element.querySelector('.gsc_a_c a');
                citationCountElement = citationCountElement ? citationCountElement.textContent.trim() : "0";
                let citationCount = parseInt(citationCountElement);
                if (isNaN(citationCount)) {
                    citationCount = 0;
                }

                const grayElements = element.querySelectorAll('.gsc_a_t .gs_gray');

                const spanElement = element.querySelector('.gs_oph');
                // Get the previous sibling (text node) of the span element to get the journal title. We do this because other extensions can change the DOM structure (ExCitation for eg.)
                const journalTitle = spanElement ? (spanElement.previousSibling ? spanElement.previousSibling.textContent.trim() : "Unknown Journal") : "Unknown Journal";

                if (journalTitle.toLowerCase().match(/rxiv/) != null) {
                    preprintCount++;
                } else {
                    //If it is not preprint then we add +1 to journal name
                    const journalNameMatch = journalTitle.match(journalNameRegex);
                    const journalName = journalNameMatch ? journalNameMatch[1].trim() : journalTitle;

                    if (!journalCountMap.has(journalName)) {
                        journalCountMap.set(journalName, 0);
                    }

                    journalCountMap.set(journalName, journalCountMap.get(journalName) + 1);
                }

                const yearElement = element.querySelector('.gsc_a_y span');
                const year = yearElement ? yearElement.textContent.trim() : "No year";

                const articleLinkElement = element.querySelector('.gs_ibl');
                const articleLinkGS = articleLinkElement ? articleLinkElement.hasAttribute("href") ? articleLinkElement.getAttribute("href") : null : null;

                if (parseInt(year) < minYear || minYear === 0) {
                    minYear = parseInt(year);
                    selectedMinYear = minYear;
                }

                if (parseInt(year) > maxYear) {
                    maxYear = parseInt(year);
                    selectedMaxYear = maxYear;
                    selectedSingleYear = maxYear;
                }

                if (year != "No year" && year != undefined) {
                    if (!yearwiseData.has(year)) {
                        yearwiseData.set(year, new Map());
                    }
                    if (!yearList.includes(year)) {
                        yearList.push(year);
                    }

                    // // console.log(articleLinkGS); //DEBUG
                    // // console.log(articleLinkElement); //DEBUG
                    // if (articleLinkGS && articleLinkGS.length > 0) {
                    //     // const articleLink = new URL(articleLinkGS);
                    //     // Get the 'cites' query parameter
                    //     const citationCluster = new URL(articleLinkGS).searchParams.get("cites");
                    //     if (citationCluster) {

                    //         // loadScript(axiosPath, async () => {
                    //             resolveFinalUrl(`https://scholar.google.com/scholar?oi=bibs&cluster=${citationCluster}&btnI=1`).then((articleLink) => 
                    //         classifyArticleFromLink(articleLink)
                    //             .then(category => console.log(`Final Classification: ${category}`))
                    //             .catch(error => console.error("Error:", error))
                    //             );
                    //         // try {
                    //         //     const articleLink = await resolveFinalUrl(`https://scholar.google.com/scholar?oi=bibs&cluster=${citationCluster}&btnI=1`);
                    //         //     const category = await classifyArticleFromLink(articleLink);
                    //         //     console.log(`Final Classification: ${category}`);
                    //         // } catch (error) {
                    //         //     console.error("Error:", error);
                    //         // }
                    //         // });

                    //     }
                    // }


                }

                const authorsElement = grayElements[0]; //element.querySelector('.gsc_a_t .gs_gray');
                const authors = authorsElement ? authorsElement.textContent.trim() : "No authors";

                // Get journal Q* score from the Excel data
                const excelAttrs = getExcelColumns(journalTitle, excelData, [5, 7]);

                // // If authors list contains '...', then the full authors list is not displayed so we need to scrape it from the publication URL
                // if (authors.includes("...") && publicationUrl) {
                //     urls.push(publicationUrl);
                // }

                // allURLs.push(publicationUrl);
                // console.log(excelAttrs[0], excelAttrs[1]); //DEBUG

                publicationData.push({
                    title: publicationTitle,
                    citations: citationCount,
                    year: year,
                    // authors: authors.includes("...") ? "Pending" : authors,
                    authors: authors,
                    total_authors: 0,
                    author_pos: "NA",
                    journalRanking: excelAttrs[1],
                    journalTitle: journalTitle,
                    impact_factor: excelAttrs[0],
                    index: index,
                    publicationURL: publicationUrl
                });
            });

            // console.log(journalCountMap); //DEBUG

            //sort map in descending and and take the first three elements //Thanks DeepSeek R1
            // Convert Map to array, sort by count (descending), take top 3
            const sortedEntries = [...journalCountMap.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            //Display the table in HTML
            const tableHtml = `
            <table class="journalTableStyle">
                <thead>
                <tr>
                    <th>Journal Name</th>
                    <th>Count</th>
                </tr>
                </thead>
                <tbody>
                ${sortedEntries.map(([journal, count]) => `
                    <tr>
                    <td>${journal}</td>
                    <td>${count}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
            `;

            // Insert into your HTML (e.g., a div with id="results")
            document.getElementById('journalTable').innerHTML = DOMPurify.sanitize(tableHtml);

            // selectedMinYear = minYear;
            // selectedMaxYear = maxYear;
            // selectedSingleYear = maxYear;

            const doubleRangeInputs = document.querySelectorAll(".double_range_slider_box input");
            const singleRangeInput = document.getElementById("single_range");
            singleRangeInput.min = minYear;
            singleRangeInput.max = maxYear;
            singleRangeInput.value = selectedSingleYear.toString();

            doubleRangeInputs[0].min = minYear;
            doubleRangeInputs[0].max = maxYear;
            doubleRangeInputs[0].value = selectedMinYear.toString();
            doubleRangeInputs[1].min = minYear;
            doubleRangeInputs[1].max = maxYear;
            doubleRangeInputs[1].value = selectedMaxYear.toString();

            updateDoubleRangeMin(selectedMinYear);
            updateDoubleRangeMax(selectedMaxYear);
            updateSingleRange(selectedSingleYear);

            // Function to fetch full authors concurrently with a limit
            async function fetchFullAuthorsWithLimit(pub_titles, urls, limit = 5, timeDelay = 0) {
                const results = [];
                try {
                    let index = 0;
                    // let timeDelay = 0;

                    if (urls.length >= 100) {
                        timeDelay = timeDelay > 10000 ? timeDelay : 10000;
                        // limit = 5;
                    }

                    const requestBatch = async () => {
                        if (index >= urls.length) return;
                        const batch = urls.slice(index, index + limit);
                        index += limit;

                        // Add an initial delay before sending requests
                        await new Promise(resolve => setTimeout(resolve, timeDelay));

                        const promises = batch.map(async (url, curr_idx) => {
                            try {
                                // let backoffDelay = timeDelay;  // Initial delay for backoff
                                let response;
                                const parser = new DOMParser();

                                // Retry with exponential backoff until a 200 status is received
                                // while (true) {
                                try {
                                    // response = await fetch(url);
                                    response = await fetchWithSessionCache(pub_titles[curr_idx], url);
                                    // // if (response && response.status === 200) {
                                    // // break;  // Exit loop on success
                                    // // } else {
                                    // // response = await fetchWithSessionCache(pub_titles[curr_idx], url, refetch = true);
                                    // // }
                                    // // console.warn(`Status ${response.status} encountered. Retrying in ${backoffDelay} ms...`);
                                    // if (response && response.status === 200) {
                                    //     const html = await response.text();
                                    //     const doc = parser.parseFromString(DOMPurify.sanitize(html), 'text/html');
                                    //     const authorDiv = doc.querySelector('.gsc_oci_value');

                                    //     console.log(authorDiv.textContent.trim()); //DEBUG
                                    //     return authorDiv ? authorDiv.textContent.trim() : "Authors not found";
                                    // }
                                    let request_retries = 0;
                                    while (!response || response.status != 200) {
                                        response = await fetchWithSessionCache(pub_titles[curr_idx], url, refetch = true);
                                        request_retries++;
                                        if(request_retries > MAX_RETRIES) {
                                            throw new Error("Request limit exceeded. Refresh the page and rerun GScholarLENS.");
                                        }
                                        await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                                    }
                                    const html = await response.text();
                                    const doc = parser.parseFromString(DOMPurify.sanitize(html), 'text/html');
                                    const authorDiv = doc.querySelector('.gsc_oci_value');
                                    await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                                    // console.log(authorDiv.textContent.trim()); //DEBUG
                                    return authorDiv ? authorDiv.textContent.trim() : "Authors not found";

                                } catch (error) {
                                    console.error("Error fetching authors:", error);
                                    //release semaphonre
                                    chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
                                        console.log(release_response.status);  // Should log "Semaphore acquired" once acquired
                                        window.alert("Large Profile : Rate limit reached. Please re-run GScholarLENS.");
                                        window.location.reload();
                                    });
                                    // window.location.reload();
                                    // window.alert("Large Profile : Rate limit reached. Please re-run GScholarLENS.");
                                }

                                // Wait for backoff delay before retrying
                                // await new Promise(resolve => setTimeout(resolve, backoffDelay));
                                // backoffDelay *= 2;  // Exponential backoff
                                // }

                                // if(response){
                                // const html = await response.text();
                                // const doc = parser.parseFromString(DOMPurify.sanitize(html), 'text/html');
                                // const authorDiv = doc.querySelector('.gsc_oci_value');
                                // return authorDiv ? authorDiv.textContent.trim() : "Authors not found";
                                // }else{
                                return "Authors not found";
                                // }
                            } catch (error) {
                                console.error("Error fetching authors (batch.map):", error);

                                return "Error loading authors";
                            }
                        });
                        
                        results.push(...await Promise.all(promises));
                        updateLoadingBar((index / urls.length) * 100, "Fetching URLs(" + index + "): ");
                        // setTimeout(updateLoadingBar, 20, (index / urls.length) * 100, "Fetching URLs(" + index + "): ");
                        await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                        await requestBatch();
                    };

                    // await new Promise(resolve => setTimeout(resolve, 2000));  // 2-second delay
                    await requestBatch();
                    await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                } catch (error) {
                    console.log("Error Fetching Authors:", error);
                    chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
                        console.log(response.status);  // Should log "Semaphore acquired" once acquired
                    });
                    window.location.reload();
                }
                // await new Promise(resolve => setTimeout(resolve, 500));  // Wait for 0.5 seconds
                return results;
            }

            // MOVED TO WORKER THREAD
            // function processAuthorPositions(author, author_list, citationCount, index, qscore, year, pub_idx) {
            //     // Process author positions and contributions
            //     const adj_i = adjustIndexForSymbols(author_list, index);
            //     let position = "NA";  // Assume NA as position by default

            //     if (!yearwiseData.get(year).has("author_pos_contrib")) {
            //         yearwiseData.get(year).set("author_pos_contrib", new Map());
            //         yearwiseData.get(year).get("author_pos_contrib").set("first_author", 0);
            //         yearwiseData.get(year).get("author_pos_contrib").set("second_author", 0);
            //         yearwiseData.get(year).get("author_pos_contrib").set("co_author", 0);
            //         yearwiseData.get(year).get("author_pos_contrib").set("corresponding_author", 0);
            //     }

            //     if (!yearwiseData.get(year).has("author_pos_cite_contrib")) {
            //         yearwiseData.get(year).set("author_pos_cite_contrib", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("first_author", 0);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("second_author", 0);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("co_author", 0);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("corresponding_author", 0);
            //     }

            //     if (!yearwiseData.get(year).has("author_pos_cite_map")) {
            //         yearwiseData.get(year).set("author_pos_cite_map", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_map").set("first_author", []);
            //         yearwiseData.get(year).get("author_pos_cite_map").set("second_author", []);
            //         yearwiseData.get(year).get("author_pos_cite_map").set("co_author", []);
            //         yearwiseData.get(year).get("author_pos_cite_map").set("corresponding_author", []);
            //     }

            //     if (!yearwiseData.get(year).has("author_pos_cite_qscore")) {
            //         yearwiseData.get(year).set("author_pos_cite_qscore", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_qscore").set("first_author", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_qscore").set("second_author", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_qscore").set("co_author", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_qscore").set("corresponding_author", new Map());
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").set("Q1", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").set("Q2", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").set("Q3", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").set("Q4", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("first_author").set("NA", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").set("Q1", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").set("Q2", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").set("Q3", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").set("Q4", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("second_author").set("NA", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").set("Q1", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").set("Q2", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").set("Q3", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").set("Q4", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("co_author").set("NA", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").set("Q1", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").set("Q2", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").set("Q3", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").set("Q4", 0);
            //         yearwiseData.get(year).get("author_pos_cite_qscore").get("corresponding_author").set("NA", 0);
            //     }

            //     if (author.includes('*') || adj_i + 1 === author_list.length) {
            //         position = "corresponding_author";
            //         // author_pos_contrib.set("corresponding_author", author_pos_contrib.get("corresponding_author") + 1);
            //         // author_pos_cite_contrib.set("corresponding_author", author_pos_cite_contrib.get("corresponding_author") + citationCount);
            //         // author_pos_cite_map.get("corresponding_author").push(citationCount);
            //         yearwiseData.get(year).get("author_pos_contrib").set("corresponding_author", yearwiseData.get(year).get("author_pos_contrib").get("corresponding_author") + 1);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("corresponding_author", yearwiseData.get(year).get("author_pos_cite_contrib").get("corresponding_author") + citationCount);
            //         yearwiseData.get(year).get("author_pos_cite_map").get("corresponding_author").push(citationCount);
            //     } else if (adj_i === 0) {
            //         position = "first_author";
            //         // author_pos_contrib.set("first_author", author_pos_contrib.get("first_author") + 1);
            //         // author_pos_cite_contrib.set("first_author", author_pos_cite_contrib.get("first_author") + citationCount);
            //         // author_pos_cite_map.get("first_author").push(citationCount);
            //         yearwiseData.get(year).get("author_pos_contrib").set("first_author", yearwiseData.get(year).get("author_pos_contrib").get("first_author") + 1);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("first_author", yearwiseData.get(year).get("author_pos_cite_contrib").get("first_author") + citationCount);
            //         yearwiseData.get(year).get("author_pos_cite_map").get("first_author").push(citationCount);
            //     } else if (adj_i === 1) {
            //         position = "second_author";
            //         // author_pos_contrib.set("second_author", author_pos_contrib.get("second_author") + 1);
            //         // author_pos_cite_contrib.set("second_author", author_pos_cite_contrib.get("second_author") + citationCount);
            //         // author_pos_cite_map.get("second_author").push(citationCount);
            //         yearwiseData.get(year).get("author_pos_contrib").set("second_author", yearwiseData.get(year).get("author_pos_contrib").get("second_author") + 1);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("second_author", yearwiseData.get(year).get("author_pos_cite_contrib").get("second_author") + citationCount);
            //         yearwiseData.get(year).get("author_pos_cite_map").get("second_author").push(citationCount);
            //     } else if (adj_i > 1 && adj_i + 1 < author_list.length) {
            //         position = "co_author";
            //         // author_pos_contrib.set("co_author", author_pos_contrib.get("co_author") + 1);
            //         // author_pos_cite_contrib.set("co_author", author_pos_cite_contrib.get("co_author") + citationCount);
            //         // author_pos_cite_map.get("co_author").push(citationCount);
            //         yearwiseData.get(year).get("author_pos_contrib").set("co_author", yearwiseData.get(year).get("author_pos_contrib").get("co_author") + 1);
            //         yearwiseData.get(year).get("author_pos_cite_contrib").set("co_author", yearwiseData.get(year).get("author_pos_cite_contrib").get("co_author") + citationCount);
            //         yearwiseData.get(year).get("author_pos_cite_map").get("co_author").push(citationCount);
            //     } else {
            //         console.log("IDX:", pub_idx, "Adj idx:", adj_idx, "Author:", author, "Position:", position, "Citations:", citationCount, "QScore:", qscore); //DEBUG
            //         console.warn(pub_idx, publicationData[pub_idx].author_pos); // DEBUG
            //     }

            //     // console.log("IDX:", pub_idx, "Author:", author, "Position:", position, "Citations:", citationCount, "QScore:", qscore); //DEBUG
            //     // console.warn(pub_idx, publicationData[pub_idx].author_pos); // DEBUG
            //     // console.log(author_pos_cite_qscore.get(position)); //DEBUG

            //     yearwiseData.get(year).get("author_pos_cite_qscore").get(position).set(qscore, yearwiseData.get(year).get("author_pos_cite_qscore").get(position).get(qscore) + citationCount);

            //     // Store the author's position for this publication
            //     // // publicationAuthorPositions.push(position);
            //     // // publicationAuthorPositions[pub_idx] = position;
            //     // publicationAuthorPositions.set(pub_idx, position);
            //     return position;
            // }

            function processQScore(author_pos, year, qScore) {
                //Fetch and process QScore data
                if (author_pos === "NA") {
                    return;
                }

                if (!yearwiseData.get(year).has("qPosCount")) {
                    yearwiseData.get(year).set("qPosCount", new Map());
                    yearwiseData.get(year).get("qPosCount").set("first_author", new Map());
                    yearwiseData.get(year).get("qPosCount").get("first_author").set("Q1", 0);
                    yearwiseData.get(year).get("qPosCount").get("first_author").set("Q2", 0);
                    yearwiseData.get(year).get("qPosCount").get("first_author").set("Q3", 0);
                    yearwiseData.get(year).get("qPosCount").get("first_author").set("Q4", 0);
                    yearwiseData.get(year).get("qPosCount").get("first_author").set("NA", 0);
                    yearwiseData.get(year).get("qPosCount").set("second_author", new Map());
                    yearwiseData.get(year).get("qPosCount").get("second_author").set("Q1", 0);
                    yearwiseData.get(year).get("qPosCount").get("second_author").set("Q2", 0);
                    yearwiseData.get(year).get("qPosCount").get("second_author").set("Q3", 0);
                    yearwiseData.get(year).get("qPosCount").get("second_author").set("Q4", 0);
                    yearwiseData.get(year).get("qPosCount").get("second_author").set("NA", 0);
                    yearwiseData.get(year).get("qPosCount").set("co_author", new Map());
                    yearwiseData.get(year).get("qPosCount").get("co_author").set("Q1", 0);
                    yearwiseData.get(year).get("qPosCount").get("co_author").set("Q2", 0);
                    yearwiseData.get(year).get("qPosCount").get("co_author").set("Q3", 0);
                    yearwiseData.get(year).get("qPosCount").get("co_author").set("Q4", 0);
                    yearwiseData.get(year).get("qPosCount").get("co_author").set("NA", 0);
                    yearwiseData.get(year).get("qPosCount").set("corresponding_author", new Map());
                    yearwiseData.get(year).get("qPosCount").get("corresponding_author").set("Q1", 0);
                    yearwiseData.get(year).get("qPosCount").get("corresponding_author").set("Q2", 0);
                    yearwiseData.get(year).get("qPosCount").get("corresponding_author").set("Q3", 0);
                    yearwiseData.get(year).get("qPosCount").get("corresponding_author").set("Q4", 0);
                    yearwiseData.get(year).get("qPosCount").get("corresponding_author").set("NA", 0);
                }

                if (!yearwiseData.get(year).has("qTotal")) {
                    yearwiseData.get(year).set("qTotal", new Map());
                    yearwiseData.get(year).get("qTotal").set("Q1", 0);
                    yearwiseData.get(year).get("qTotal").set("Q2", 0);
                    yearwiseData.get(year).get("qTotal").set("Q3", 0);
                    yearwiseData.get(year).get("qTotal").set("Q4", 0);
                    yearwiseData.get(year).get("qTotal").set("NA", 0);
                }

                switch (qScore.charAt(0)) {
                    case 'Q':
                        switch (qScore.charAt(1)) {
                            case '1':
                                // const newQ1Cnt = qPosCount.get(author_pos).get("Q1") + 1;
                                // qPosCount.get(author_pos).set("Q1", newQ1Cnt);
                                // const newQ1Total = qTotal.get("Q1") + 1;
                                // qTotal.set("Q1", newQ1Total);

                                const newQ1Cnt = yearwiseData.get(year).get("qPosCount").get(author_pos).get("Q1") + 1;
                                yearwiseData.get(year).get("qPosCount").get(author_pos).set("Q1", newQ1Cnt);
                                const newQ1Total = yearwiseData.get(year).get("qTotal").get("Q1") + 1;
                                yearwiseData.get(year).get("qTotal").set("Q1", newQ1Total);
                                break;
                            case '2':
                                // const newQ2Cnt = qPosCount.get(author_pos).get("Q2") + 1;
                                // qPosCount.get(author_pos).set("Q2", newQ2Cnt);
                                // const newQ2Total = qTotal.get("Q2") + 1;
                                // qTotal.set("Q2", newQ2Total);

                                const newQ2Cnt = yearwiseData.get(year).get("qPosCount").get(author_pos).get("Q2") + 1;
                                yearwiseData.get(year).get("qPosCount").get(author_pos).set("Q2", newQ2Cnt);
                                const newQ2Total = yearwiseData.get(year).get("qTotal").get("Q2") + 1;
                                yearwiseData.get(year).get("qTotal").set("Q2", newQ2Total);
                                break;
                            case '3':
                                // const newQ3Cnt = qPosCount.get(author_pos).get("Q3") + 1;
                                // qPosCount.get(author_pos).set("Q3", newQ3Cnt);
                                // const newQ3Total = qTotal.get("Q3") + 1;
                                // qTotal.set("Q3", newQ3Total);

                                const newQ3Cnt = yearwiseData.get(year).get("qPosCount").get(author_pos).get("Q3") + 1;
                                yearwiseData.get(year).get("qPosCount").get(author_pos).set("Q3", newQ3Cnt);
                                const newQ3Total = yearwiseData.get(year).get("qTotal").get("Q3") + 1;
                                yearwiseData.get(year).get("qTotal").set("Q3", newQ3Total);
                                break;
                            case '4':
                                // const newQ4Cnt = qPosCount.get(author_pos).get("Q4") + 1;
                                // qPosCount.get(author_pos).set("Q4", newQ4Cnt);
                                // const newQ4Total = qTotal.get("Q4") + 1;
                                // qTotal.set("Q4", newQ4Total);

                                const newQ4Cnt = yearwiseData.get(year).get("qPosCount").get(author_pos).get("Q4") + 1;
                                yearwiseData.get(year).get("qPosCount").get(author_pos).set("Q4", newQ4Cnt);
                                const newQ4Total = yearwiseData.get(year).get("qTotal").get("Q4") + 1;
                                yearwiseData.get(year).get("qTotal").set("Q4", newQ4Total);
                                break;
                        }
                        break;
                    default:
                        // const newNACnt = qPosCount.get(author_pos).get("NA") + 1;
                        // qPosCount.get(author_pos).set("NA", newNACnt);
                        // const newNATotal = qTotal.get("NA") + 1;
                        // qTotal.set("NA", newNATotal);

                        const newNACnt = yearwiseData.get(year).get("qPosCount").get(author_pos).get("NA") + 1;
                        yearwiseData.get(year).get("qPosCount").get(author_pos).set("NA", newNACnt);
                        const newNATotal = yearwiseData.get(year).get("qTotal").get("NA") + 1;
                        yearwiseData.get(year).get("qTotal").set("NA", newNATotal);
                        break;
                }
            }

            function adjustIndexForSymbols(author_list, index) {
                // If ^ is present then authors share that position, we have to adjust the index to find the position shared by the authors
                let adj_i = index;
                while (adj_i > 0 && (author_list[adj_i].includes('^') || author_list[adj_i].includes('*'))) {
                    adj_i--;
                }
                return adj_i;
            }

            const cleanStringSpaces = (str) => str.replace(/\s+/g, ' ').trim();

            // const areEqual = (a, b) =>
            //     cleanStringSpaces(a.trim().normalize()).localeCompare(cleanStringSpaces(b.trim().normalize()), undefined, { sensitivity: 'base' }) === 0;

            const cleanAndNormalize = (str) =>
                replaceSpecialChars(str)
                    .normalize('NFC') // Normalize Unicode composition
                    .replace(/\s+/g, ' ') // Collapse multiple spaces
                    .trim() // Remove leading/trailing spaces
                    .toLowerCase(); // Convert to lowercase

            const areEqual = (a, b) =>
                cleanAndNormalize(a).localeCompare(cleanAndNormalize(b), undefined, { sensitivity: 'base' }) === 0;

            //MOVED TO WORKER THREAD
            // function checkAuthor(author) {
            //     // Remove special characters from author names (normalize localizations), remvoe puctuation & extra spaces, and convert to lowercase
            //     const non_specialAuthor_name = replaceSpecialChars(normalizeString(author)).toLowerCase();
            //     // console.log("checkAuthor():", non_specialAuthor_name, author, authorName, author.toLowerCase().trim() === authorName.toLowerCase().trim(), author.toLowerCase().trim() == authorName.toLowerCase().trim()); // DEBUG
            //     // console.log("checkAuthor():", non_specialAuthor_name, author, authorName, areEqual(author, authorName)); // DEBUG
            //     // authorRegexes matches [first initial< wildcard *.>last name]
            //     // return authorRegexes.test(non_specialAuthor_name) || non_specialAuthor_name.includes(authorNameShort.toLowerCase()) || areEqual(author, authorName);

            //     const regexRes = [];

            //     authorRegexes.forEach((nameRegex) => {
            //         regexRes.push(nameRegex.test(non_specialAuthor_name));
            //     });
            //     regexRes.push(non_specialAuthor_name.includes(authorNameShort.toLowerCase()));
            //     regexRes.push(areEqual(author, authorName));

            //     regexRes.push(otherNamesList.includes(normalizeString(author.trim())));
            //     regexRes.push(nameComboList.includes(author.trim()));

            //     return regexRes.some(x => x === true);
            // }

            //MOVED TO WORKER THREAD
            // function checkAuthorExtended(author) {
            //     // Remove special characters from author names (normalize localizations), remvoe puctuation & extra spaces, and convert to lowercase
            //     const non_specialAuthor_name = replaceSpecialChars(normalizeString(author)).toLowerCase();
            //     // console.log("checkAuthorExtended():", non_specialAuthor_name, author, authorName, author.toLowerCase().trim() === authorName.toLowerCase().trim(), author.toLowerCase().trim() == authorName.toLowerCase().trim()); // DEBUG
            //     // console.log("checkAuthorExtended():", non_specialAuthor_name, author, authorName, areEqual(author, authorName)); // DEBUG
            //     // authorRegexesEx matches [first name< wildcard *.>last name]
            //     // return authorRegexesEx.test(non_specialAuthor_name) || areEqual(author, authorName);

            //     const regexRes = [];

            //     authorRegexesEx.forEach((name) => {
            //         regexRes.push(name.test(non_specialAuthor_name));
            //     });
            //     regexRes.push(areEqual(author, authorName));

            //     regexRes.push(otherNamesList.includes(normalizeString(author.trim())));
            //     regexRes.push(nameComboList.includes(author.trim()));

            //     return regexRes.some(x => x === true);
            // }

            const retractedPubsIdxList = [];
            let retractionProgress = 0;
            // let activeWorkers = 0;

            // function scheduleTask(workerPool, taskQueue, callback, message) {
            //     if (taskQueue.length === 0 && activeWorkers === 0) {
            //       // all done
            //       return finalize();
            //     }
            //     while (activeWorkers < MAX_WORKERS && taskQueue.length) {
            //       const { pub, idx } = taskQueue.shift();
            //       const worker = workerPool.find(w => w.idle);
            //       if (!worker) break;
            //       worker.idle = false;
            //       activeWorkers++;
                  
            //       worker.onmessage = callback;
            //       worker.postMessage(message);
            //     }
            //   }

            async function processPublicationsData() {
                let extended_scrape = false;
                const processedPubsIdx = new Set();
                const  pubWorkerPool = [];
                
                for (let i = 0; i < MAX_WORKERS/2; i++) {
                    const w = await createInlineWorker(chrome.runtime.getURL('workers/publicationWorker.min.js'));
                    w.idle = true;
                    pubWorkerPool.push(w);
                }
                // const taskQueue = publicationData.map((pub, idx) => ({ pub, idx }));
                // scheduleTask(pubWorkerPool, taskQueue, callback, message)
                //Initial scrape
                // Process publication data and match authors
                for (const [pub_idx, publication] of publicationData.entries()) {

                    // if (publication.authors === "Pending") {
                    //     // Process pending authors in the extended scrape step (next step)
                    //     extended_scrape = true;
                    //     continue;
                    // }
                   
                    // if (pub_idx > retractionProgress) {
                    //     //    console.log(retractedPubsIdxList.length); //DEBUG
                    //     //wait until retraction check is complete for the specific publication
                    //     await new Promise(resolve => setTimeout(resolve, 100));
                    // }


                    while (pub_idx > retractionProgress) {
                        //    console.log(retractedPubsIdxList.length); //DEBUG
                        //wait until retraction check is complete for the specific publication
                        await new Promise(r => setTimeout(r, 100));  // Allow other tasks to run
                    }

                    if (retractedPubsIdxList.includes(pub_idx)) {
                        continue;
                    }
                    
                    while(!pubWorkerPool.find(w => w.idle)){
                        await new Promise(r => setTimeout(r, 100));  // Allow other tasks to run
                    }
                    
                    const pubWorker = pubWorkerPool.find(w => w.idle);
                    pubWorker.idle = false;
                    // chrome.runtime.sendMessage({
                    //     task: 'initialScrape',
                    //     publication,
                    //     authorRegexes,
                    //     otherNamesList,
                    //     authorNameShort,
                    //     authorName,
                    //     authorNameLong
                    // });
                    
                    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    //     if (request.task === 'initialScrape') {
                    //         // Handle the processed data from the worker
                    //         console.log('Publication processed:', request);
                    //         // Do something with the result, e.g., update the UI
                    //     }
                    // });


                    // MOVED TO WORKER THREAD - START
                    pubWorker.onmessage = async ({ data }) => {
                        if (data.task === 'initialScrape' && data.type === 'working'){
                            if(!data.authorFound && data.extended_scrape){
                                return;
                            }
                            publicationProgress+=1;
                            updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                            await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                            publicationData[data.publication.pub_idx] = data.publication; // Update the publication data with the modified publication values
                            processedPubsIdx.add(data.publication.pub_idx);

                            // authorRegexes = [...authorRegexes, ...data.authorRegexes];
                            // authorRegexes = new Array(...new Set(authorRegexes));

                            if(data.publication.year.toString().trim().length === 0){
                                pub_no_year += 1;
                            }

                            if (!yearwiseData.get(data.publication.year).has("total_publications")) {
                                yearwiseData.get(data.publication.year).set("total_publications", 0);
                            }
                            yearwiseData.get(data.publication.year).set("total_publications", yearwiseData.get(data.publication.year).get("total_publications") + 1);

                      let adjustedCitationCount = 0;
                      let citationWeight = 0;
                      let author_pos_string = "0\t0\t0\t0";
                      // switch (publicationData[pub_idx].author_pos) {
                    switch (data.publication.author_pos) {
                          case "first_author":
                              author_pos_string = "1\t0\t0\t0";
                              adjustedCitationCount = data.publication.citations * hCiteProp[0];
                              citationWeight = hCiteProp[0];
                              break;
                          case "second_author":
                              author_pos_string = "0\t1\t0\t0";
                              adjustedCitationCount = data.publication.citations * hCiteProp[1];
                              citationWeight = hCiteProp[1];
                              break;
                          case "co_author":
                              author_pos_string = "0\t0\t1\t0";
                              if (data.publication.total_authors > 6 ) { //&& publication.authors.includes("...")
                                  adjustedCitationCount = data.publication.citations * 0.1;
                                  citationWeight = 0.1;
                              } else {
                                  adjustedCitationCount = data.publication.citations * 0.25;
                                  citationWeight = 0.25;
                              }
                              break;
                          case "corresponding_author":
                              author_pos_string = "0\t0\t0\t1";
                              adjustedCitationCount = data.publication.citations * hCiteProp[3];
                              citationWeight = hCiteProp[3];
                              break;
                          default:
                              //Author not found
                              console.warn(data.publication.pub_idx, data.publication.author_pos); // DEBUG    
                              break;
                      }
                      tsvContent += `${data.publication.index}\t${data.publication.title}\t${data.publication.authors}\t${data.publication.authors.includes("...") ? `${data.publication.total_authors - 1}+` : data.publication.total_authors}\t${data.publication.year}\t${data.publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${data.publication.journalTitle}\t${data.publication.journalRanking}\t${data.publication.impact_factor}\t${data.publication.considered}\t${author_pos_string}\n`; // Add each publication in a new row

                        }
                        if (data.type === 'done') {
                            authorNamesConsidered = [...authorNamesConsidered, ...data.authorNamesConsidered];
                            authorNamesConsidered = new Array(...new Set(authorNamesConsidered));
                            //MERGE yearwiseData and data.yearwiseData Maps
                            mergeYearwiseData(yearwiseData, data.yearwiseData);
                            // pubWorker.removeEventListener('message', onPubDone);
                            // pubWorker.terminate();           // kills the thread
                            pubWorker.idle = true;
                            pubWorker.onmessage = null;  
                        }
                        if (data.type === 'error') {
                            console.error(`Worker error on ${data.task}:`, data.error);
                          //   releaseSemaphore();
                          }
                      };
                    
                    // const pubWorker = await createInlineWorker(chrome.runtime.getURL('workers/publicationWorker.min.js'));
                    pubWorker.postMessage({ task: 'initialScrape', batch: [publication], authorRegexes, authorRegexesEx, nameComboList, otherNamesList, authorNameShort, authorName, authorNameLong });
                    
                    // await new Promise(res => {
                    //   const onPubDone = async ({ data }) => {
                    //     if (data.task === 'initialScrape' && data.type === 'working'){
                    //         if(!data.authorFound && data.extended_scrape){
                    //             return;
                    //         }
                    //         publicationProgress+=1;
                    //         updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                    //         await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    //         publicationData[data.publication.pub_idx] = data.publication; // Update the publication data with the modified publication values
                    //         processedPubsIdx.add(data.publication.pub_idx);
                    //         authorRegexes = [...authorRegexes, ...data.authorRegexes];
                    //         authorRegexes = new Array(...new Set(authorRegexes));
                    //         if(data.publication.year.toString().trim().length === 0){
                    //             pub_no_year += 1;
                    //         }

                    //         if (!yearwiseData.get(data.publication.year).has("total_publications")) {
                    //             yearwiseData.get(data.publication.year).set("total_publications", 0);
                    //         }
                    //         yearwiseData.get(data.publication.year).set("total_publications", yearwiseData.get(data.publication.year).get("total_publications") + 1);

                    //   let adjustedCitationCount = 0;
                    //   let citationWeight = 0;
                    //   let author_pos_string = "0\t0\t0\t0";
                    //   // switch (publicationData[pub_idx].author_pos) {
                    // switch (data.publication.author_pos) {
                    //       case "first_author":
                    //           author_pos_string = "1\t0\t0\t0";
                    //           adjustedCitationCount = data.publication.citations * hCiteProp[0];
                    //           citationWeight = hCiteProp[0];
                    //           break;
                    //       case "second_author":
                    //           author_pos_string = "0\t1\t0\t0";
                    //           adjustedCitationCount = data.publication.citations * hCiteProp[1];
                    //           citationWeight = hCiteProp[1];
                    //           break;
                    //       case "co_author":
                    //           author_pos_string = "0\t0\t1\t0";
                    //           if (data.publication.total_authors > 6 ) { //&& publication.authors.includes("...")
                    //               adjustedCitationCount = data.publication.citations * 0.1;
                    //               citationWeight = 0.1;
                    //           } else {
                    //               adjustedCitationCount = data.publication.citations * 0.25;
                    //               citationWeight = 0.25;
                    //           }
                    //           break;
                    //       case "corresponding_author":
                    //           author_pos_string = "0\t0\t0\t1";
                    //           adjustedCitationCount = data.publication.citations * hCiteProp[3];
                    //           citationWeight = hCiteProp[3];
                    //           break;
                    //       default:
                    //           //Author not found
                    //           console.warn(data.publication.pub_idx, data.publication.author_pos); // DEBUG    
                    //           break;
                    //   }
                    //   tsvContent += `${data.publication.index}\t${data.publication.title}\t${data.publication.authors}\t${data.publication.authors.includes("...") ? `${data.publication.total_authors - 1}+` : data.publication.total_authors}\t${data.publication.year}\t${data.publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${data.publication.journalTitle}\t${data.publication.journalRanking}\t${data.publication.impact_factor}\t${data.publication.considered}\t${author_pos_string}\n`; // Add each publication in a new row

                    //     }
                    //     if (data.type === 'done') {
                    //         authorNamesConsidered = [...authorNamesConsidered, ...data.authorNamesConsidered];
                    //         authorNamesConsidered = new Array(...new Set(authorNamesConsidered));
                    //         //MERGE yearwiseData and data.yearwiseData Maps
                    //         mergeYearwiseData(yearwiseData, data.yearwiseData);
                    //         pubWorker.removeEventListener('message', onPubDone);
                    //         pubWorker.terminate();           // kills the thread
                    //         pubWorker.onmessage = null;  
                    //       res();
                    //     }
                    //     if (data.type === 'error') {
                    //         console.error(`Worker error on ${data.task}:`, data.error);
                    //       //   releaseSemaphore();
                    //       }
                    //   };
                    // //   pubWorker.addEventListener('message', onPubDone);
                    // });

                    // MOVING TO WORKER THREAD - START
                    // const authors = publication.authors;
                    // const citationCount = publication.citations;
                    // let author_list = authors.split(',').map(author => author.trim());
                    // let author_list_filtered = author_list.filter(checkAuthor);

                    // // console.warn("extended:",pub_idx, author_list_filtered); // DEBUG
                    // if ((uniq(author_list_filtered).length > 1 || author_list_filtered.length === 0) && authors.includes("...")) {
                    //     // If multiple surnames match, fetch extended author list for clarification
                    //     // urls.push(allURLs[pub_idx]);
                    //     // console.warn("extended:",pub_idx, author_list_filtered); // DEBUG
                    //     // console.warn(pub_idx, publication.title, publication.authors); // DEBUG
                    //     publicationData[pub_idx].authors = "Pending";
                    //     extended_scrape = true;
                    //     continue;
                    // }

                    // let authorFound = false;
                    // publicationProgress += 1;
                    // updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                    // // setTimeout(updateLoadingBar, 20, (publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                    // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    // // author_list.forEach(async (author, i) => {
                    // for (const [i, author] of author_list.entries()) {
                    //     // console.error(author); //DEBUG
                    //     if (author.includes("...")) {
                    //         publicationData[pub_idx].authors = "Pending";
                    //         extended_scrape = true;
                    //         // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    //         return;
                    //     }

                    //     //1st condition in the if() is a special case where extended author info is not available and we have conflicts with the author name/surname (multiple authors with sharmas for eg, n sharma & g sharma)
                    //     const non_specialAuthor_name = replaceSpecialChars(normalizeString(author)).toLowerCase();
                    //     if (non_specialAuthor_name.includes(authorNameShort.toLowerCase()) || non_specialAuthor_name.includes(authorNameLong.toLowerCase()) || areEqual(author, authorName) || otherNamesList.includes(normalizeString(author.trim()))) {
                    //         // if (authorRegexes.test(non_specialAuthor_name)) {
                    //         const regexInitial = [];
                    //         authorRegexes.forEach((name) => {
                    //             regexInitial.push(name.test(non_specialAuthor_name));
                    //         });
                    //         regexInitial.push(otherNamesList.includes(normalizeString(author.trim())));
                    //         if (regexInitial.some(x => x === true)) {
                    //             authorFound = true;
                    //             // if author name is processed, add to authorNamesConsidered list after stripping punctuation and extra spaces
                    //             const authorTrimmed = author.replace(/[\*\^']|_/g, "").replace(/\s+/g, " ").trim();

                    //             if (!authorNamesConsidered.includes(authorTrimmed)) {
                    //                 authorNamesConsidered.push(authorTrimmed);
                    //             }

                    //             // console.warn(pub_idx, publication.title, publication.authors); // DEBUG

                    //             // Process author positions based on roles (e.g., first author, co-author)
                    //             publicationData[pub_idx].author_pos = processAuthorPositions(author, author_list, citationCount, i, publication.journalRanking, publication.year, pub_idx);
                    //             processedPubsIdx.add(pub_idx);
                    //             publicationData[pub_idx].total_authors = author_list.length;

                    //             // firstAuthorCount = author_pos_contrib.get("first_author");
                    //             // secondAuthorCount = author_pos_contrib.get("second_author");
                    //             // correspondingAuthorCount = author_pos_contrib.get("corresponding_author");
                    //             // coAuthorCount = author_pos_contrib.get("co_author");
                    //             // firstAuthorCitationsTotal = author_pos_cite_contrib.get("first_author");
                    //             // secondAuthorCitationsTotal = author_pos_cite_contrib.get("second_author");
                    //             // correspondingAuthorCitationsTotal = author_pos_cite_contrib.get("corresponding_author");
                    //             // coAuthorCitationsTotal = author_pos_cite_contrib.get("co_author");

                    //             let adjustedCitationCount = 0;
                    //             let citationWeight = 0;
                    //             let author_pos_string = "0\t0\t0\t0";
                    //             switch (publicationData[pub_idx].author_pos) {
                    //                 case "first_author":
                    //                     author_pos_string = "1\t0\t0\t0";
                    //                     adjustedCitationCount = citationCount * hCiteProp[0];
                    //                     citationWeight = hCiteProp[0];
                    //                     break;
                    //                 case "second_author":
                    //                     author_pos_string = "0\t1\t0\t0";
                    //                     adjustedCitationCount = citationCount * hCiteProp[1];
                    //                     citationWeight = hCiteProp[1];
                    //                     break;
                    //                 case "co_author":
                    //                     author_pos_string = "0\t0\t1\t0";
                    //                     if (publication.total_authors > 6 ) { //&& publication.authors.includes("...")
                    //                         adjustedCitationCount = citationCount * 0.1;
                    //                         citationWeight = 0.1;
                    //                     } else {
                    //                         adjustedCitationCount = citationCount * 0.25;
                    //                         citationWeight = 0.25;
                    //                     }
                    //                     break;
                    //                 case "corresponding_author":
                    //                     author_pos_string = "0\t0\t0\t1";
                    //                     adjustedCitationCount = citationCount * hCiteProp[3];
                    //                     citationWeight = hCiteProp[3];
                    //                     break;
                    //                 default:
                    //                     console.warn(pub_idx, publicationData[pub_idx].author_pos); // DEBUG    
                    //                     break;
                    //             }

                    //             // console.warn(pub_idx, publicationData[pub_idx].author_pos); // DEBUG

                    //             tsvContent += `${publication.index}\t${publication.title}\t${publication.authors}\t${publication.authors.includes("...") ? `${publication.total_authors - 1}+` : publication.total_authors}\t${publication.year}\t${publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${publication.journalTitle}\t${publication.journalRanking}\t${publication.impact_factor}\t1\t${author_pos_string}\n`; // Add each publication in a new row
                    //         }
                    //     }
                    //     // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    // }//);

                    // if(publication.year.toString().trim().length === 0){
                    //     pub_no_year += 1;
                    // }

                    // if (!yearwiseData.get(publication.year).has("total_publications")) {
                    //     yearwiseData.get(publication.year).set("total_publications", 0);
                    // }
                    // yearwiseData.get(publication.year).set("total_publications", yearwiseData.get(publication.year).get("total_publications") + 1);

                    // if (!authorFound) {
                    //     // console.warn(pub_idx, publication.title, publication.authors); // DEBUG
                    //     publicationData[pub_idx].authors = "Pending";
                    //     extended_scrape = true;
                    // }

                    // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                // MOVING TO WORKER THREAD - END


                } //Initial Scraping - End

                // console.log("Extended Scraping"); // DEBUG
                //Extended Scrape - Scrape the extended author's list for publications with insufficient author info (or multi-matching or duplicating author names)
                // if (urls.length > 0) {
                if (extended_scrape) {
                    //Fetch all the URLs in one go
                    let urls = publicationData.filter(pub => pub.authors === "Pending").map(pub => pub.publicationURL);
                    let pub_titles = publicationData.filter(pub => pub.authors === "Pending").map(pub => pub.title);
                    const authorsListExt = await fetchFullAuthorsWithLimit(pub_titles, urls, urls.length, 0);
                    // console.warn(urls); //DEBUG
                    urls = [];
                    urls.length = 0;
                    pub_titles = [];
                    pub_titles.length = 0;
                    let authorIndexExt = 0;

                    // console.log(authorsListExt); //DEBUG

                    for (const [pub_idx, publication] of publicationData.entries()) {
                        // Process all the authors which are pending. Pending authors require scraping of extended author information from the publication URL/page
                        // if (pub_idx > retractionProgress) {
                        while (pub_idx > retractionProgress) {
                            // console.log(retractedPubsIdxList.length); //DEBUG
                            //wait until retraction check is complete for the specific publication
                            await new Promise(resolve => setTimeout(resolve, 100));
                            // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                        }

                        if (retractedPubsIdxList.includes(pub_idx)) {
                            // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                            continue;
                        }

                        if (publication.authors === "Pending") {
                            publication.authors = authorsListExt[authorIndexExt] || "Authors not found";
                            authorIndexExt++;
                        } else {
                            // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                            continue;
                        }

                        if (processedPubsIdx.has(pub_idx)) {
                            // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                            continue;
                        }

                        while(!pubWorkerPool.find(w => w.idle)){
                            await new Promise(r => setTimeout(r, 100));  // Allow other tasks to run
                        }
                        
                        const pubWorker = pubWorkerPool.find(w => w.idle);
                        pubWorker.idle = false;

                        pubWorker.onmessage = async ({ data }) => {
                            if (data.task === 'extendedScrape' && data.type === 'working'){
                                if(!data.authorFound){
                                    pub_author_no_match += 1;
                                    // return;
                                }
                                publicationProgress += 1;
                                updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                                // setTimeout(updateLoadingBar, 20, (publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                                await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                                publicationData[data.publication.pub_idx] = data.publication; // Update the publication data with the modified publication values

                                // authorRegexes = [...authorRegexes, ...data.authorRegexes];
                                // authorRegexes = new Array(...new Set(authorRegexes));
                                // authorRegexesEx = [...authorRegexesEx, ...data.authorRegexesEx];
                                // authorRegexesEx = new Array(...new Set(authorRegexesEx));

                                if(data.publication.year.toString().trim().length === 0){
                                    pub_no_year += 1;
                                }
                  
                                if (!yearwiseData.get(data.publication.year).has("total_publications")) {
                                    yearwiseData.get(data.publication.year).set("total_publications", 0);
                                }
                                yearwiseData.get(data.publication.year).set("total_publications", yearwiseData.get(data.publication.year).get("total_publications") + 1);
                                
                                let adjustedCitationCount = 0;
                                let citationWeight = 0;
                                let author_pos_string = "0\t0\t0\t0";

                                switch (data.publication.author_pos) {
                                    case "first_author":
                                        author_pos_string = "1\t0\t0\t0";
                                        adjustedCitationCount = data.publication.citations * hCiteProp[0];
                                        citationWeight = hCiteProp[0];
                                        break;
                                    case "second_author":
                                        author_pos_string = "0\t1\t0\t0";
                                        adjustedCitationCount = data.publication.citations * hCiteProp[1];
                                        citationWeight = hCiteProp[1];
                                        break;
                                    case "co_author":
                                        author_pos_string = "0\t0\t1\t0";
                                        if (data.publication.total_authors > 6) { // && publication.authors.includes("...")
                                            adjustedCitationCount = data.publication.citations * 0.1;
                                            citationWeight = 0.1;
                                        } else {
                                            adjustedCitationCount = data.publication.citations * 0.25;
                                            citationWeight = 0.25;
                                        }
                                        break;
                                    case "corresponding_author":
                                        author_pos_string = "0\t0\t0\t1";
                                        adjustedCitationCount = data.publication.citations * hCiteProp[3];
                                        citationWeight = hCiteProp[3];
                                        break;
                                }
      

                                tsvContent += `${data.publication.index}\t${data.publication.title}\t${data.publication.authors}\t${data.publication.authors.includes("...") ? `${data.publication.total_authors - 1}+` : data.publication.total_authors}\t${data.publication.year}\t${data.publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${data.publication.journalTitle}\t${data.publication.journalRanking}\t${data.publication.impact_factor}\t${data.publication.considered}\t${author_pos_string}\n`; // Add each publication in a new row
                            }
                            if (data.type === 'done') {
                                authorNamesConsidered = [...authorNamesConsidered, ...data.authorNamesConsidered];
                                authorNamesConsidered = new Array(...new Set(authorNamesConsidered));
                                //MERGE yearwiseData and data.yearwiseData Maps
                                mergeYearwiseData(yearwiseData, data.yearwiseData);
                                // pubWorker.removeEventListener('message', onPubDone);
                                // pubWorker.terminate();           // kills the thread
                                pubWorker.idle = true;           
                                pubWorker.onmessage = null;  
                              res();
                            }
                            if (data.type === 'error') {
                                console.error(`Worker error on ${data.task}:`, data.error);
                              //   releaseSemaphore();
                              }
                          };
                

                        // const pubWorker = await createInlineWorker(chrome.runtime.getURL('workers/publicationWorker.min.js'));
                        // pubWorker.addEventListener('message', onPubDone);
                        pubWorker.postMessage({ task: 'extendedScrape', batch: [publication], authorRegexes, authorRegexesEx, nameComboList, otherNamesList, authorNameShort, authorName, authorNameLong });
                        // await new Promise(res => {
                        //   const onPubDone = async ({ data }) => {
                        //     if (data.task === 'extendedScrape' && data.type === 'working'){
                        //         if(!data.authorFound){
                        //             pub_author_no_match += 1;
                        //             // return;
                        //         }
                        //         publicationProgress += 1;
                        //         updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                        //         // setTimeout(updateLoadingBar, 20, (publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                        //         await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                        //         publicationData[data.publication.pub_idx] = data.publication; // Update the publication data with the modified publication values
                        //         authorRegexes = [...authorRegexes, ...data.authorRegexes];
                        //         authorRegexes = new Array(...new Set(authorRegexes));
                        //         authorRegexesEx = [...authorRegexesEx, ...data.authorRegexesEx];
                        //         authorRegexesEx = new Array(...new Set(authorRegexesEx));
                        //         if(data.publication.year.toString().trim().length === 0){
                        //             pub_no_year += 1;
                        //         }
                  
                        //         if (!yearwiseData.get(data.publication.year).has("total_publications")) {
                        //             yearwiseData.get(data.publication.year).set("total_publications", 0);
                        //         }
                        //         yearwiseData.get(data.publication.year).set("total_publications", yearwiseData.get(data.publication.year).get("total_publications") + 1);
                                
                        //         let adjustedCitationCount = 0;
                        //         let citationWeight = 0;
                        //         let author_pos_string = "0\t0\t0\t0";

                        //         switch (data.publication.author_pos) {
                        //             case "first_author":
                        //                 author_pos_string = "1\t0\t0\t0";
                        //                 adjustedCitationCount = data.publication.citations * hCiteProp[0];
                        //                 citationWeight = hCiteProp[0];
                        //                 break;
                        //             case "second_author":
                        //                 author_pos_string = "0\t1\t0\t0";
                        //                 adjustedCitationCount = data.publication.citations * hCiteProp[1];
                        //                 citationWeight = hCiteProp[1];
                        //                 break;
                        //             case "co_author":
                        //                 author_pos_string = "0\t0\t1\t0";
                        //                 if (data.publication.total_authors > 6) { // && publication.authors.includes("...")
                        //                     adjustedCitationCount = data.publication.citations * 0.1;
                        //                     citationWeight = 0.1;
                        //                 } else {
                        //                     adjustedCitationCount = data.publication.citations * 0.25;
                        //                     citationWeight = 0.25;
                        //                 }
                        //                 break;
                        //             case "corresponding_author":
                        //                 author_pos_string = "0\t0\t0\t1";
                        //                 adjustedCitationCount = data.publication.citations * hCiteProp[3];
                        //                 citationWeight = hCiteProp[3];
                        //                 break;
                        //         }
      

                        //         tsvContent += `${data.publication.index}\t${data.publication.title}\t${data.publication.authors}\t${data.publication.authors.includes("...") ? `${data.publication.total_authors - 1}+` : data.publication.total_authors}\t${data.publication.year}\t${data.publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${data.publication.journalTitle}\t${data.publication.journalRanking}\t${data.publication.impact_factor}\t${data.publication.considered}\t${author_pos_string}\n`; // Add each publication in a new row
                        //     }
                        //     if (data.type === 'done') {
                        //         authorNamesConsidered = [...authorNamesConsidered, ...data.authorNamesConsidered];
                        //         authorNamesConsidered = new Array(...new Set(authorNamesConsidered));
                        //         //MERGE yearwiseData and data.yearwiseData Maps
                        //         mergeYearwiseData(yearwiseData, data.yearwiseData);
                        //         // pubWorker.removeEventListener('message', onPubDone);
                        //         pubWorker.terminate();           // kills the thread
                        //         pubWorker.onmessage = null;  
                        //       res();
                        //     }
                        //     if (data.type === 'error') {
                        //         console.error(`Worker error on ${data.task}:`, data.error);
                        //       //   releaseSemaphore();
                        //       }
                        //   };
                        //   pubWorker.addEventListener('message', onPubDone);
                        // });

                        //MOVED TO WORKER THREAD - START
                        // const authors = publication.authors;
                        // const citationCount = publication.citations;
                        // let extended_check = true;
                        // let author_list = authors.split(',').map(author => author.trim());
                        // let author_list_filtered = author_list.filter(checkAuthorExtended);

                        // if (author_list_filtered.length === 0) {
                        //     // console.warn("extended:",pub_idx, author_list_filtered); // DEBUG
                        //     // In a lot of cases, the full names are not retrieved even from the extended author information so we revert back to simple author name matching to include them
                        //     // console.warn(pub_idx, publication.title, publication.authors); // DEBUG
                        //     author_list_filtered = author_list.filter(checkAuthor);
                        //     extended_check = false;
                        //     // console.warn("simple:", pub_idx, author_list_filtered); // DEBUG
                        // }

                        // const regexToUse = extended_check ? authorRegexesEx : authorRegexes;

                        // // publicationProgress += 1;
                        // // updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");

                        // if (author_list_filtered.length === 0 || publication.authors === "Authors not found") {
                        //     // console.warn("extended - 1",pub_idx, publication.title, publication.authors); // DEBUG
                        //     // publicationAuthorPositions.set(pub_idx, "NA");
                        //     // console.log("Before:", pub_author_no_match); //DEBUG
                        //     // pub_author_no_match += 1;
                        //     // console.log(publication.authors); //DEBUG
                        //     tsvContent += `${publication.index}\t${publication.title}\t${publication.authors}\t${author_list_filtered.length}\t${publication.year}\t${publication.citations}\t0\t0\t${publication.journalTitle}\t${publication.journalRanking}\t${publication.impact_factor}\t0\t0\t0\t0\t0\n`; // Add each publication in a new row
                        //     // console.log("After:", pub_author_no_match); //DEBUG
                        // } else {
                        //     publicationProgress += 1;
                        //     updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                        //     // setTimeout(updateLoadingBar, 20, (publicationProgress / totalPublications) * 100, "Processing Publications (" + publicationProgress + "): ");
                        //     await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                        //     let authorFound = false;
                        //     // author_list.forEach(async (author, i) => {
                        //     for (const [i, author] of author_list.entries()) {
                        //         const non_specialAuthor_name = replaceSpecialChars(normalizeString(author)).toLowerCase();
                        //         if (non_specialAuthor_name.includes(authorNameShort.toLowerCase()) || non_specialAuthor_name.includes(authorNameLong.toLowerCase()) || areEqual(author, authorName) || otherNamesList.includes(normalizeString(author.trim()))) {
                        //             // if (regexToUse.test(non_specialAuthor_name)) {
                        //             const regexExtended = [];
                        //             regexToUse.forEach((name) => {
                        //                 regexExtended.push(name.test(non_specialAuthor_name));
                        //             });
                        //             // authorRegexes.forEach((name) => {
                        //             //     regexExtended.push(name.test(non_specialAuthor_name));
                        //             // });
                        //             // authorRegexesEx.forEach((name) => {
                        //             //     regexExtended.push(name.test(non_specialAuthor_name));
                        //             // });
                        //             regexExtended.push(otherNamesList.includes(normalizeString(author.trim())));

                        //             if (regexExtended.some(x => x === true)) {
                        //                 authorFound = true;
                        //                 processedPubsIdx.add(pub_idx);
                        //                 //if author name is processed, add to authorNamesConsidered list after stripping punctuation and extra spaces
                        //                 const authorTrimmed = author.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ").trim();
                        //                 if (!authorNamesConsidered.includes(authorTrimmed)) {
                        //                     authorNamesConsidered.push(authorTrimmed);
                        //                 }

                        //                 // console.warn("extended - FOUND",pub_idx, publication.title, publication.authors); // DEBUG

                        //                 // Process author positions based on roles (e.g., first author, co-author)
                        //                 publicationData[pub_idx].author_pos = processAuthorPositions(author, author_list, citationCount, i, publication.journalRanking, publication.year, pub_idx);

                        //                 publicationData[pub_idx].total_authors = author_list.length;

                        //                 let adjustedCitationCount = 0;
                        //                 let citationWeight = 0;

                        //                 // firstAuthorCount = author_pos_contrib.get("first_author");
                        //                 // secondAuthorCount = author_pos_contrib.get("second_author");
                        //                 // correspondingAuthorCount = author_pos_contrib.get("corresponding_author");
                        //                 // coAuthorCount = author_pos_contrib.get("co_author");
                        //                 // firstAuthorCitationsTotal = author_pos_cite_contrib.get("first_author");
                        //                 // secondAuthorCitationsTotal = author_pos_cite_contrib.get("second_author");
                        //                 // correspondingAuthorCitationsTotal = author_pos_cite_contrib.get("corresponding_author");
                        //                 // coAuthorCitationsTotal = author_pos_cite_contrib.get("co_author");

                        //                 let author_pos_string = "0\t0\t0\t0";
                        //                 switch (publicationData[pub_idx].author_pos) {
                        //                     case "first_author":
                        //                         author_pos_string = "1\t0\t0\t0";
                        //                         adjustedCitationCount = citationCount * hCiteProp[0];
                        //                         citationWeight = hCiteProp[0];
                        //                         break;
                        //                     case "second_author":
                        //                         author_pos_string = "0\t1\t0\t0";
                        //                         adjustedCitationCount = citationCount * hCiteProp[1];
                        //                         citationWeight = hCiteProp[1];
                        //                         break;
                        //                     case "co_author":
                        //                         author_pos_string = "0\t0\t1\t0";
                        //                         if (publication.total_authors > 6) { // && publication.authors.includes("...")
                        //                             adjustedCitationCount = citationCount * 0.1;
                        //                             citationWeight = 0.1;
                        //                         } else {
                        //                             adjustedCitationCount = citationCount * 0.25;
                        //                             citationWeight = 0.25;
                        //                         }
                        //                         break;
                        //                     case "corresponding_author":
                        //                         author_pos_string = "0\t0\t0\t1";
                        //                         adjustedCitationCount = citationCount * hCiteProp[3];
                        //                         citationWeight = hCiteProp[3];
                        //                         break;
                        //                 }

                        //                 tsvContent += `${publication.index}\t${publication.title}\t${publication.authors}\t${publication.authors.includes("...") ? `${publication.total_authors - 1}+` : publication.total_authors}\t${publication.year}\t${publication.citations}\t${adjustedCitationCount}\t${citationWeight}\t${publication.journalTitle}\t${publication.journalRanking}\t${publication.impact_factor}\t1\t${author_pos_string}\n`; // Add each publication in a new row
                        //             }
                        //         }
                        //         // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                        //     }//);

                        //     if(publication.year.toString().trim().length === 0){
                        //         pub_no_year += 1;
                        //     }

                        //     if (!yearwiseData.get(publication.year).has("total_publications")) {
                        //         yearwiseData.get(publication.year).set("total_publications", 0);
                        //     }
                        //     yearwiseData.get(publication.year).set("total_publications", yearwiseData.get(publication.year).get("total_publications") + 1);

                        //     if (!authorFound) {
                        //         // console.warn("extended - 2", pub_idx, publication.title, publication.authors); // DEBUG
                        //         // publicationAuthorPositions.set(pub_idx, "NA");
                        //         // console.log("Before:", pub_author_no_match); //DEBUG
                        //         pub_author_no_match += 1;
                        //         // console.log("After:", pub_author_no_match); //DEBUG
                        //     }
                        // }

                        // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    }
                } //Extended Scrape - End

                //MOVED TO WORKER THREAD - END

                authorNamesConsidered = [...authorNamesConsidered, ...namesList];
                authorNamesConsidered = new Array(...new Set(authorNamesConsidered));

                // Calculating QScore data for all publications
                publicationProgress = 0;
                publicationData.forEach(async (publication, index) => {
                    processQScore(publicationData[index].author_pos, publicationData[index].year, publicationData[index].journalRanking);

                    publicationProgress += 1;
                    updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Journal Rankings (" + publicationProgress + "): ");
                    // setTimeout(updateLoadingBar, 20, (publicationProgress / totalPublications) * 100, "Processing Journal Rankings (" + publicationProgress + "): ");
                    await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                });
                return true;
            }

            async function checkRetractedPublications(publicationProgress) {
                updateLoadingBar((publicationProgress / totalPublications) * 100, "Processing Retractions... ", true);
                await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                retractionWatchDB = await getRetractionWatchDB();

                const  retWorkerPool = [];
                
                for (let i = 0; i < MAX_WORKERS/2; i++) {
                    const w = await createInlineWorker(chrome.runtime.getURL('workers/retractionWorker.min.js'));
                    w.idle = true;
                    retWorkerPool.push(w);
                }

                // console.log(retractionWatchDB); //DEBUG
                // Check if the publication is retracted
                // const retractedPubsIdxList = [];
                // let retractionProgress = 0;
                // let ele_index = 0;
                // for(const [index, element] of publicationData.entries()) {
                // publicationData.forEach(async (element, index) => {
                for(const [index, element] of publicationData.entries()) {
                    // publicationData.map(async (element, index) => {
    
                    // chrome.runtime.sendMessage({
                    //     task: 'checkRetraction',
                    //     element
                    // });
                    
                    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    //     if (request.task === 'checkRetraction') {
                    //         // Handle the processed data from the worker
                    //         console.log('checkRetraction processed:', request);
                    //         // Do something with the result, e.g., update the UI
                    //     }
                    // });
                    
                    while(!retWorkerPool.find(w => w.idle)){
                        await new Promise(r => setTimeout(r, 100));  // Allow other tasks to run
                    }
                    const retractionWorker = retWorkerPool.find(w => w.idle);
                    retractionWorker.idle = false;
                
                    retractionWorker.onmessage   = async ({ data }) => {
                          if (data.task === 'checkRetraction' && data.type === 'working'){
                              retractionProgress += 1;
                              updateLoadingBar((retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): ");
                              // console.log(retractionProgress, totalPublications, (retractionProgress / totalPublications) * 100); //DEBUG
                              // setTimeout(updateLoadingBar, 10, (retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): "); 
                              await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                              if(data.isPubRetracted) {
                                  retractedPubsIdxList.push(data.publication.index);
                                  retractedPubsCount++;
                              }
                          }
                          if (data.type === 'done') {
            
                              // retractionWorker.removeEventListener('message', onPubDone);
                            //   retractionWorker.terminate();           // kills the thread
                            retractionWorker.idle = true;
                              retractionWorker.onmessage = null;  
                            // res();
                          }
                          if (data.type === 'error') {
                              console.error(`Worker error on ${data.task}:`, data.error);
                            //   releaseSemaphore();
                            }
                        };

                    //MOVED to WORKER THREAD
                    // const retractionWorker = await createInlineWorker(chrome.runtime.getURL('workers/retractionWorker.min.js'));
                    retractionWorker.postMessage({ task: 'checkRetraction', batch: [element], retractionWatchDB });
                    // await new Promise(res => {
                    //   const onPubDone = async ({ data }) => {
                    //     if (data.task === 'checkRetraction' && data.type === 'working'){
                    //         retractionProgress += 1;
                    //         updateLoadingBar((retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): ");
                    //         // console.log(retractionProgress, totalPublications, (retractionProgress / totalPublications) * 100); //DEBUG
                    //         // setTimeout(updateLoadingBar, 10, (retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): "); 
                    //         await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    //         if(data.isPubRetracted) {
                    //             retractedPubsIdxList.push(data.publication.index);
                    //             retractedPubsCount++;
                    //         }
                    //     }
                    //     if (data.type === 'done') {
          
                    //         // retractionWorker.removeEventListener('message', onPubDone);
                    //         retractionWorker.terminate();           // kills the thread
                    //         retractionWorker.onmessage = null;  
                    //       res();
                    //     }
                    //     if (data.type === 'error') {
                    //         console.error(`Worker error on ${data.task}:`, data.error);
                    //       //   releaseSemaphore();
                    //       }
                    //   };
                    //   retractionWorker.addEventListener('message', onPubDone);
                    // });


                    //MOVING to WORKER THREAD
                    // var isPubRetracted = false;
                    // const pubTitle = publicationData[index].title;
                    // // const pubTitle = element.title;
                    // const cleanPubTitle = pubTitle.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:}=\_\'\"\(\)\[\]\{\}\+-`~)]/g, '').replace(/\s+/g, '').replace(/retracted/g, '').replace(/retraction/g, '');
                    // retractionProgress += 1;
                    // retractionWatchDB.map(async (entry) => {
                    //     // retractionWatchDB.forEach(async (entry) => {
                    //     if (isPubRetracted) {
                    //         // setTimeout(updateLoadingBar, 20, (retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): "); 
                    //         return;
                    //     }
                    //     const cleanEntryTitle = entry.Title.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:}=\_\'\"\(\)\[\]\{\}\+-`~)]/g, '').replace(/\s+/g, '').replace(/retracted/g, '').replace(/retraction/g, '');
                    //     if (cleanPubTitle === cleanEntryTitle) {
                    //         // console.log("Retracted Publication:", pubTitle, entry.Title); //DEBUG
                    //         retractedPubsIdxList.push(index);
                    //         retractedPubsCount++;
                    //         isPubRetracted = true;
                    //     }
                    //     // else {
                    //     //     const entryRegExp = '.*^' + cleanEntryTitle + '$.*';
                    //     //     const retractMatch = cleanPubTitle.match(entryRegExp);
                    //     //     if (retractMatch != null) {
                    //     //         // console.log(retractMatch);
                    //     //         console.log("Retracted Publication:", pubTitle, entry.Title); //DEBUG
                    //     //         retractedPubsIdxList.push(index);
                    //     //         retractedPubsCount++;
                    //     //         isPubRetracted = true;
                    //     //     }
                    //     // }
                    //     // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                    // });
                    // updateLoadingBar((retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): ");
                    // // console.log(retractionProgress, totalPublications, (retractionProgress / totalPublications) * 100); //DEBUG
                    // // setTimeout(updateLoadingBar, 10, (retractionProgress / totalPublications) * 100, "Processing Retractions (" + retractionProgress + "): "); 
                    // await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run

                }// for - End);
                await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
                return true;
            }

            const [result1, result2] = await Promise.all([
                processPublicationsData(),
                checkRetractedPublications(publicationProgress)
            ]);

            // console.log(result1, result2); //DEBUG

            function getQBadgeColor(q) {
                const colors = {
                    'Q1': '#2e7d32',
                    'Q2': '#689f38',
                    'Q3': '#f9a825',
                    'Q4': '#ef6c00'
                };
                return colors[q] || '#607d8b'; // default color if no Q rank
            }

            function getIFBadgeColor(q) {
                const colors = {
                    'Q1': '#2e7d32',
                    'Q2': '#689f38',
                    'Q3': '#f9a825',
                    'Q4': '#ef6c00'
                };
                return colors[q] || '#607d8b'; // default color if no Q rank
            }

            publicationData.sort((a, b) => a.index - b.index); // Sort publications by index in ascending

            publicationElements.forEach(async (element, index) => {
                // Other code extracting title, citations, etc.
                const authorPosition = publicationData[index].author_pos; //publicationAuthorPositions.get(index); //getAuthorPositionForCurrentPublication(index);
                // if (authorPosition != "NA") {
                // console.log(index, "Author Position:", authorPosition, publicationData[index].title, element.querySelector('.gsc_a_t a')); // DEBUG
                const gsGrayElement = element.querySelector('.gs_gray');

                if (gsGrayElement) {
                    // // const positionCirclesHTML = `
                    // //     <div style="display: flex; gap: 5px; margin-top: 5px;">
                    // //         <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "first_author" ? '#9cdcdc' : '#ddd'};"></span>
                    // //         <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "second_author" ? '#a87cff' : '#ddd'};"></span>
                    // //         <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "co_author" ? '#fac38c' : '#ddd'};"></span>
                    // //         <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "corresponding_author" ? '#98cef4' : '#ddd'};"></span>
                    // //     </div>
                    // // `;

                    // const positionCirclesHTML = DOMPurify.sanitize(`
                    //             <div class="position-circles" style="display: flex; gap: 5px; margin-top: 5px;">
                    //                 <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "first_author" ? '#3b8888' : '#ddd'};"></span>
                    //                 <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "second_author" ? '#5d33b8' : '#ddd'};"></span>
                    //                 <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "co_author" ? '#e68a41' : '#ddd'};"></span>
                    //                 <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "corresponding_author" ? '#3a83b2' : '#ddd'};"></span>
                    //             </div>
                    //         `);
                    const positionCirclesHTML = DOMPurify.sanitize(`
                        <div class="position-circles" style="display: flex; gap: 5px; margin-top: 2px; margin-left: 2px; align-items: center; position: relative;">
                            <div class="circles-container" style="display: flex; gap: 5px; margin-right: 0.30%; margin-left: 0.15%;">
        <span 
            style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "first_author" ? '#3b8888' : '#ddd'};"
            ${authorPosition === "first_author" ? 'data-role="First Author"' : ''}
        ></span>
        <span 
            style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "second_author" ? '#5d33b8' : '#ddd'};"
            ${authorPosition === "second_author" ? 'data-role="Second Author"' : ''}
        ></span>
        <span 
            style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "co_author" ? '#e68a41' : '#ddd'};"
            ${authorPosition === "co_author" ? 'data-role="Co-Author"' : ''}
        ></span>
        <span 
            style="width: 10px; height: 10px; border-radius: 50%; background-color: ${authorPosition === "corresponding_author" ? '#3a83b2' : '#ddd'};"
            ${authorPosition === "corresponding_author" ? 'data-role="Corresponding Author"' : ''}
        ></span>
                            </div>
                            <div class="q-badge" style="
                                /*opacity: 0;*/
                                transition: all 0.2s ease-in-out;
                                background: ${getQBadgeColor(publicationData[index].journalRanking)};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.8em;
                                margin-right: 0.25%;
                                margin-left: 0.25%;
                                /*position: absolute;
                                left: 100%;*/
                                white-space: nowrap;
                                pointer-events: none;
                            ">
                                ${publicationData[index].journalRanking}
                            </div>
                            <div class="if-badge" style="
                                /*opacity: 0;*/
                                transition: all 0.2s ease-in-out;
                                background: ${getIFBadgeColor(publicationData[index].impact_factor)};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.8em;
                                margin-right: 0.25%;
                                margin-left: 0.25%;
                                /*position: absolute;
                                left: 100%;*/
                                white-space: nowrap;
                                pointer-events: none;
                            ">
                                IF5: ${publicationData[index].impact_factor}
                            </div>
                        </div>
                    `);

                    // Check if a position circle element already exists
                    let existingPositionCircles = element.querySelector('.position-circles');

                    if (existingPositionCircles) {
                        // Update the existing element's HTML
                        existingPositionCircles.outerHTML = positionCirclesHTML;
                    } else {
                        // Insert the HTML if it doesn't exist yet
                        gsGrayElement.insertAdjacentHTML('afterend', positionCirclesHTML);
                    }
                }
                // }
                // else {
                //     console.warn("Author position not found for publication:", publicationData[index].title);
                //     console.warn(element);
                // }
                await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
            });

            updateLoadingBar(99, "Processing Retractions... ", true);
            // setTimeout(updateLoadingBar, 20, 0, "Processing Retractions... ");
            await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
            // const csvPath = chrome.runtime.getURL("data/retraction_watch_stripped.csv");
            // const papaparsePath = chrome.runtime.getURL('libs/papaparse.min.js');


            // console.log(retractedPubsCount);

            publicationElements.forEach(async (element, index) => {
                if (!retractedPubsIdxList.includes(index)) {
                    return;
                }
                const gsGrayElement = element.querySelector('.gs_gray');
                const retractionHTML = DOMPurify.sanitize(`
                <div class="blink_text"><div class="retraction-notice" style="margin-top: 5px; color: #ff0000; font-weight: bold;">
                RETRACTED</div></div>
            `);
                gsGrayElement.insertAdjacentHTML('afterend', retractionHTML);
                await new Promise(r => setTimeout(r, 0));  // Allow other tasks to run
            });


            // Function to recursively merge two Maps
            function mergeMaps(target, source) {
                for (let [key, value] of source.entries()) {
                    if (value instanceof Map) {
                        // If the target also has a Map at this key, merge recursively
                        if (!target.has(key)) {
                            target.set(key, new Map());
                        }
                        mergeMaps(target.get(key), value);
                    } else if (Array.isArray(value)) {
                        // If the value is an array, concatenate it to the target
                        const targetArray = target.get(key) || [];
                        target.set(key, [...targetArray, ...value]);
                    } else if (typeof value === "number") {
                        // If the value is a number, sum it with the target value
                        target.set(key, (target.get(key) || 0) + value);
                    } else {
                        // For other types (e.g., strings), overwrite the target value
                        target.set(key, value);
                    }
                }
            }

            // // Function to adds all entries of the source map to the target map
            // function addEntries(source, target) {
            //     // Loop over the entries of the source map
            //     for (let [key, value] of source.entries()) {
            //         // Add or update the entry to the target map
            //         target.set(key, value);
            //     }
            // }

            // Note: in some cases, certain publications would not have year and it would be stored in the yearwiseData map as "" (empty string). We will have to move these to the most recent year to account for the metrics

            let emptyKeyData = yearwiseData.get("");
            // console.log(emptyKeyData); //DEBUG
            // console.log(yearwiseData); //DEBUG
            // If empty key data exists, merge it into the max year
            if (emptyKeyData) {
                // UNCOMMENT if you want to move the empty key data to the most recent year
                // let maxYearData = yearwiseData.get(maxYear.toString());
                // // console.log(maxYear); //DEBUG
                // // console.log(maxYearData); //DEBUG

                // mergeMaps(maxYearData, emptyKeyData);
                // // // addEntries(emptyKeyData, maxYearData);
                // // create a new object with all the properties from both maps
                // // console.log(maxYearData); //DEBUG
                // // Update the map for max year
                // yearwiseData.set(maxYear, maxYearData);

                // Remove the empty key
                yearwiseData.delete("");
            }

            let parsedData;
            async function parseTSV() {
                parsedData = Papa.parse(tsvContent, {
                    delimiter: '\t',
                    header: true
                });
                // await loadScript(jandasPath, calculateShIndex);
                calculateShIndex();
            }
            // Iterate through CSV data and calculate Sh-Index
            async function calculateShIndex() {
                // const tsv_blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
                const adjustedCitations = [];
                const rawCitations = [];
                // //iterate through tsv blob and fetch the citations columns for each author position
                // let headerLine = true;
                // tsv_blob.split('\n').forEach(line => {
                //     if(headerLine){
                //         headerLine = false;
                //         return;
                //     }

                //     const columns = line.split('\t');
                //     const authorPos = columns[0]; // Assuming the first column is the author position
                //     const citation = columns[1]; // Assuming the second column is the citation

                //     citations.push({ authorPos, citation });
                // });

                // const hIndexMap = new Map();
                // hIndexMap.set("h_first", 0);  //first author
                // hIndexMap.set("h_second",0); //second author
                // hIndexMap.set("h_other", 0); //co-author
                // hIndexMap.set("h_co",0); //corresponding

                // const hIndexArr = new Array(4).fill(0);
                // const hIndexArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
                // const hIndexMinCiteArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
                // const subsetItersArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]
                // // const subsetRowCountsArr = [0, 0, 0, 0]; // [first author, second author, co-author, corresponding author]

                // console.log(parsedData.data); //DEBUG

                // NONE OF THE DATAFRAME JS packages work due to unsafe eval() or Function() calls :( which is intolerated by CSP
                //     // Convert the parsed data to a DataFrame
                //     const df = new jandas.DataFrame(parsedData.data);
                //     console.log(df); //DEBUG
                const filterColumns = ['First_Author', 'Second_Author', 'Co_Author', 'Corresponding_Author'];

                //     const sortedDf = df.sort_values(['Citations'], false); //.sort_values(filterColumns, false); // true for ascending order

                //     console.log(sortedDf); //DEBUG
                //     // Take subsets based on the filter columns being 1
                // //     const subsets = filterColumns.map((column_idx, column) => {
                // //         const subset_df = [];
                // //         sortedDf.iterrows((row, key, i) => {
                // //             // console.log(row.values, key);
                // //             // console.log(row); //DEBUG
                // //             // console.log(sortedDf.iloc([row_idx, column_idx]).values); //DEBUG
                // //             if (sortedDf.iloc([i, column_idx]).values === 1) {
                // //                 subset_df.push(row);
                // //             }
                // //         });
                // //         return subset_df;
                // // });
                //     shIndexPubCount = sortedDf.shape[0] - 1; // -1 for header

                //     const subsets = sortedDf.groupby(filterColumns).then((gp,k,i)=>{
                //         // if (row.get(column) === 1) {
                //         //             const rowCites = parseInt(row.get('Citations'));
                //         //             // if citations is atleast the count of papers, increment the h-index of that authorPos
                //         //             if (rowCites >= subsetItersArr[subset_idx]) {
                //         //                 hIndexArr[column_idx]++;
                //         //             }
                //         //         } else {
                //         //             return;
                //         //         }
                //         // console.log(gp,k,i); //DEBUG
                //         // console.log(k.indexOf('1'));//DEBUG
                //         const authorshipColumn = k.indexOf('1');
                //         if (authorshipColumn >= 0) {
                //             subsetItersArr[authorshipColumn]++;
                //             gp.iterrows((row, key, j) => {
                //                 // console.log(row, key, j); //DEBUG
                //                 // console.log(filterColumns[authorshipColumn]); //DEBUG
                //                 // console.log(row.loc(["Citations"]).values); //DEBUG
                //                 // console.log(parseInt(row.loc(filterColumns[authorshipColumn]).values)); //DEBUG
                //                 // if (parseInt(row.loc(filterColumns[authorshipColumn]).values) === 1) {
                //                     const rowCites = parseInt(row.loc(["Citations"]).values);
                //                     // if citations is atleast the count of papers, increment the h-index of that authorPos
                //                     // console.log(rowCites); //DEBUG
                //                     if (rowCites >= subsetItersArr[authorshipColumn]) {
                //                         hIndexArr[authorshipColumn]++;
                //                         // shIndexPubCount++;
                //                     }
                //                 // }
                //             })
                //         }
                //     });


                //     // console.log(subsets); //DEBUG
                //     // // Iterate through the sorted DataFrame and fetch the citations columns for each author position
                //     // sortedDf.map(row => {
                //     //     const authorPos = row.get('authorPos'); // Assuming the first column is the author position
                //     //     const citation = row.get('citation'); // Assuming the second column is the citation
                //     //     citations.push({ authorPos, citation });
                //     // });


                //     // Function to process each subset
                //     // const processSubset = async (subset, filterColumns) => {
                //     //     subset.map((subset_idx, row) => {
                //     //         subsetItersArr[subset_idx]++;
                //     //         // get row count of this subset
                //     //         // subsetRowCountsArr[subset_idx] = subset.count();
                //     //         // Find out which filtering column has a value of 1
                //     //         filterColumns.forEach((column_idx, column) => {
                //     //             if (row.get(column) === 1) {
                //     //                 const rowCites = parseInt(row.get('Citations'));
                //     //                 // if citations is atleast the count of papers, increment the h-index of that authorPos
                //     //                 if (rowCites >= subsetItersArr[subset_idx]) {
                //     //                     hIndexArr[column_idx]++;
                //     //                 }
                //     //             } else {
                //     //                 return;
                //     //             }
                //     //         });


                //     //     });
                //     // };

                //     // // Iterate through the subsets in parallel
                //     // const results = await Promise.all(subsets.map(subset => processSubset(subset, filterColumns)));

                shIndexPubCount = parsedData.data.length - 1; // -1 for header
                function subsetJSONData(data, filterColumn) {
                    return data.filter(row =>
                        parseInt(row[filterColumn]) === 1
                    );
                }

                // // Function to sort subsets by 'Citations'
                // function sortJSONSubsets(subsets, sortColumn) {
                //     subsets.forEach(subset => {
                //         subset.sort((a, b) => parseInt(b[sortColumn]) - parseInt(a[sortColumn])); // Descending order
                //     });
                // }

                const subsets = new Map();
                filterColumns.forEach(column => {
                    subsets.set(column, subsetJSONData(parsedData.data, column));
                })

                // subsets.forEach((subset, key) => {
                //     subset.sort((a, b) => parseInt(b['Citations']) - parseInt(a['Citations'])); //Sort in Descending order
                //     subset.forEach((row, row_key) => { 
                //         // console.log(row, row_key); //DEBUG
                //         const authorshipColumn = filterColumns.map((column, index) => {
                //             return parseInt(row[column]) === 1 ? index : -1; // If 1, return index; else -1
                //         }).filter(index => index !== -1); // Remove -1 (columns where value isn't 1)

                //         // console.log(authorshipColumn); //DEBUG
                //         if (authorshipColumn && authorshipColumn >= 0) {
                //             subsetItersArr[authorshipColumn]++;
                //             // const rowCites = parseInt(row["Citations"]);
                //             const rowCites = parseInt(row["Citations"]) * hCiteProp[authorshipColumn]; // Multiply by citation proportion
                //             adjustedCitations.push(rowCites);
                //             // if citations is atleast the count of papers, increment the h-index of that authorPos
                //             // console.log(rowCites); //DEBUG
                //             if (rowCites >= subsetItersArr[authorshipColumn]) {
                //                 hIndexArr[authorshipColumn]++;
                //             }
                //         }
                //     });
                // });
                // console.log(retractedPubsIdxList); //DEBUG
                subsets.forEach((subset, key) => {
                    // subset.sort((a, b) => parseInt(b['Citations']) - parseInt(a['Citations'])); //Sort in Descending order
                    subset.sort((a, b) => parseInt(b['Adjusted_Citations']) - parseInt(a['Adjusted_Citations'])); //Sort in Descending order
                    subset.forEach((row, row_key) => {
                        if (retractedPubsIdxList.includes(parseInt(row['Index']))) {
                            // console.warn(row, row_key); //DEBUG
                            return;
                        }
                        // console.log(row, row_key); //DEBUG
                        const authorshipColumn = filterColumns.map((column, index) => {
                            return parseInt(row[column]) === 1 ? index : -1; // If 1, return index; else -1
                        }).filter(index => index !== -1); // Remove -1 (columns where value isn't 1)

                        // console.log(authorshipColumn); //DEBUG
                        if (authorshipColumn && authorshipColumn >= 0) {
                            subsetItersArr[authorshipColumn]++;
                            // const rowCites = parseInt(row["Citations"]);
                            // const rowCites = parseInt(row["Citations"]) * hCiteProp[authorshipColumn]; // Multiply by citation proportion
                            const rowCites = parseInt(row["Adjusted_Citations"]);
                            adjustedCitations.push(rowCites);
                            rawCitations.push(parseInt(row["Citations"]));
                            // if citations is atleast the count of papers, increment the h-index of that authorPos
                            // console.log(rowCites); //DEBUG
                            if (rowCites >= subsetItersArr[authorshipColumn]) {
                                hIndexArr[authorshipColumn]++;
                            }
                        }
                    });
                });

                // console.log(subsets); //DEBUG

                hFirst = hIndexArr[0];
                hSecond = hIndexArr[1];
                hOther = hIndexArr[2];
                hCO = hIndexArr[3];

                // console.log(hFirst, hSecond, hOther, hCO); //DEBUG

                // // Calculate shIndex as 90% of hFirst, 50% of hSecond, 10% of hOther, and 100% of hCO
                // // shIndex = 0.9 * hFirst + 0.5 * hSecond + 0.1 * hOther + 1.0 * hCO;
                // shIndex = 0.9 * hFirst + 0.5 * hSecond + 0.1 * hOther + 1.0 * hCO;

                adjustedCitations.sort((a, b) => b - a); // Sort in descending order
                rawCitations.sort((a, b) => b - a); // Sort in descending order

                adjustedCitations.forEach((citations, index) => {
                    if (citations >= index + 1) {
                        shIndex = index + 1;
                    }
                });

                rawCitations.forEach((citations, index) => {
                    if (citations <= 0)
                        zeroCitationPubs++;
                });

                medianCitationsAdj = adjustedCitations[Math.floor(adjustedCitations.length / 2)];
                medianCitationsRaw = rawCitations[Math.floor(rawCitations.length / 2)];

                // console.log(shIndex); //DEBUG
                document.getElementById("sh_index").textContent = DOMPurify.sanitize(`Sh-Index : ${shIndex.toFixed(0)}`);
                document.getElementById("h_first").textContent = DOMPurify.sanitize(`${hFirst.toString()}`);
                document.getElementById("h_second").textContent = DOMPurify.sanitize(`${hSecond.toString()}`);
                document.getElementById("h_other").textContent = DOMPurify.sanitize(`${hOther.toString()}`);
                document.getElementById("h_co").textContent = DOMPurify.sanitize(`${hCO.toString()}`);

                document.getElementById("medianCitationsAdj").textContent = DOMPurify.sanitize(`${medianCitationsAdj.toString()}`);
                document.getElementById("medianCitationsRaw").textContent = DOMPurify.sanitize(`${medianCitationsRaw.toString()}`);
                document.getElementById("zeroCitationPubs").textContent = DOMPurify.sanitize(`${zeroCitationPubs.toString()}`);
                document.getElementById("retractedPubsCount").textContent = DOMPurify.sanitize(`${retractedPubsCount.toString()}`);
                document.getElementById("preprintCount").textContent = DOMPurify.sanitize(`${preprintCount.toString()}`);
                // document.getElementById("sh_index_info").innerHTML = DOMPurify.sanitize(`(${hCiteProp[0] * 100}% H<sub>First</sub> + ${hCiteProp[1] * 100}% H<sub>Second</sub> + ${hCiteProp[2] * 100}% H<sub>Other</sub> + ${hCiteProp[3] * 100}% H<sub>Co</sub>) - from ${shIndexPubCount} publications`);
            }

            function blinkText(element_id, interval = 500) {
                // const text = document.getElementById(element_id);
                // let isVisible = true;

                // // Toggle visibility every 500ms
                // setInterval(() => {
                //     text.style.visibility = isVisible ? "hidden" : "visible";
                //     isVisible = !isVisible;
                // }, interval); // Change the interval duration as needed
                const elements = document.querySelectorAll(`.${element_id}`);

                elements.forEach(async element => {
                    let isVisible = true;
                    setInterval(() => {
                        element.style.visibility = isVisible ? "hidden" : "visible";
                        isVisible = !isVisible;
                    }, interval);
                });
            }

            loadScript(papaparsePath, parseTSV, "papaparse_script");

            // console.log(yearwiseData); //DEBUG
            // console.log(pub_author_no_match); //DEBUG
            // console.log(totalPublications); //DEBUG
            // console.log(pub_no_year); //DEBUG
            // Load script for chart.js and render plots

            // function loadChartPlugin(){
            //     const chartPluginPath = chrome.runtime.getURL('libs/chartjs-plugin-annotation.min.js');
            //     loadScript(chartPluginPath, draw10yearsChart, "chartjs_plugin_script");
            // }

            loadScript(chartPath, draw10yearsChart, "chartjs_script_decade");
            // loadScriptURL("https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js", draw10yearsChart, "chartjs_script_decade");
            loadScript(chartPath, updateAuthorChart, "chartjs_script_author");
            loadingBarContainer.style.display = "none";
            if (retractedPubsCount > 0) {
                blinkText("blink_text", 1250);
            }
            document.getElementsByTagName('body')[0].style.overflow = 'visible'; //Release the scrollbar
            profileScraped = true;
            chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
                console.log(release_response.status); // Logs "Semaphore released"
            });
            // uncomment if you want to use popup again
            // sendResponse({ authorName: authorName, publications: publicationData });

        }; // scrapePublications - End

        // Click "Show More" until all publications are loaded
        const clickShowMoreUntilDisabled = async () => {
            const showMoreButton = document.querySelector('#gsc_bpf_more');

            if (!showMoreButton) {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait and retry
                return clickShowMoreUntilDisabled();
            }

            if (showMoreButton.hasAttribute("disabled")) {
                totalPublications = document.querySelectorAll(".gsc_a_at").length; //Get the total number of publications
                // console.log(document.querySelector("#gsc_a_nn").textContent.split(/[-–]/)[1]); //DEBUG
                const articleCount = parseInt(document.querySelector("#gsc_a_nn").textContent.split(/[-–]/)[1].trim());
                // console.log(articleCount); //DEBUG
                // if (totalPublications != articleCount) {
                if (totalPublications > articleCount) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait and retry
                    return clickShowMoreUntilDisabled();
                } else {
                    scrapePublications();
                    // console.log(totalPublications, articleCount); //DEBUG
                }
            } else {
                showMoreButton.click();
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait and retry
                return clickShowMoreUntilDisabled();
            }
        };

        loadingText.textContent = "Waiting for other GScholarLENS processes to complete...";
        chrome.runtime.sendMessage({ type: 'get_semaphore' }, (response) => {
            try {
                //Wait for semaphore, update loading bar, click 'show more' to expand publications table/list and scrape publications
                console.log(response.status);  // Should log "Semaphore acquired" once acquired
                updateLoadingBar(0, "Expanding Publications List: ", true);
                const currentTabURL = window.location.href.toString();
                fetch(currentTabURL).then((captchaTest) => {
                    if (captchaTest.status != 200) {
                        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
                            console.log(release_response.status);  // Should log "Semaphore released" 
                            window.location.reload();
                        });
                    }
                });

                (async function () {
                    // await new Promise(resolve => setTimeout(resolve, 2000)); // Wait and retry
                    excelData = await getJCRExcel();
                    retractionWatchDB = await getRetractionWatchDB();
                })();

                clickShowMoreUntilDisabled();
            } catch (error) {
                console.error("Error scraping profile:", error);
                document.getElementsByTagName('body')[0].style.overflow = 'visible';
                chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
                    console.log(release_response.status);  // Should log "Semaphore released" 
                });
            }
        });

    } catch (error) {
        console.error("Error scraping:", error);
        document.getElementsByTagName('body')[0].style.overflow = 'visible';
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
            console.log(release_response.status);  // Should log "Semaphore released" 
        });
    } 
    // finally {
    //     chrome.runtime.sendMessage({ type: 'release_semaphore' }, (release_response) => {
    //         console.log(release_response.status);  // Should log "Semaphore released" 
    //     });
    // }

    return true;
}
