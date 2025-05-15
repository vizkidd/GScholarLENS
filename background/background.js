// const csp_hash_map = new Map()
// //DEV
// csp_hash_map.set('jandas.min.js', 'sha256-9J9gwU1pNEg+9Z2o48vTF+U6BBFJ0294qrHyE08zFn4=');
// csp_hash_map.set('papaparse.min.js', 'sha256-ZT0H7UHVbBCL3ANKU+gS0b+XWtSVYFkOcrQMUPkBXA4=');
// csp_hash_map.set('chart.umd.js', 'sha256-256VuaiAHJ3TG2qeoPS7fYz8hkweUg+i0TbY/i9B9VXFaE=');
// csp_hash_map.set('index.js', 'sha256-8CGKe4Unhu8x4bikC6qU3zJy3DYXbMHYt5lbIHnwpQg=');
// csp_hash_map.set('index.umd.js', 'sha256-uQ5s+kqlQQniRbT3tBv9nBbKDyNfymzc5hiYAdzymzo=');
// csp_hash_map.set('index.umd.min.js', 'sha256-57fGoqA8EXMUM48fXCXXtlheUfoN/jg+hnYXq+w7BjY=');
// csp_hash_map.set('chart.js', 'sha256-0+DXJnZYYnCV/yDxaMgIC0sT3/RpBknIPggiDOgy+zE=');
// csp_hash_map.set('xlsx.full.min.js', 'sha256-FPSC3XUkFoe869hAfbpIsSmcnOhpTNw6gVBOq3D00pk=');
// csp_hash_map.set('purify.min.js', 'sha256-e2sErBT4UHV6xsNfL+dFY0Osqxg6flTZU+W8cH6t3WE=');
// csp_hash_map.set('GScholarLENS.js', 'sha256-5BmD2Qp6gTru4qIdwvi6nosgxolpYrjw/uiCgjqM9Aw=');

// // + PROD
// csp_hash_map.set('GScholarLENS.min.js', '3b647d5455595294cdf63c1060a45e88721ab485f68a3a91960d32de5d54f8b1-GScholarLENS.min.js');

// await chrome.storage.local.set({ "csp_hash_map": csp_hash_map });

// background.js
const semaphore_queue = [];
let processing_tab = null;

(async function () {
    // if (!runtime) {
    //     console.error('No valid runtime environment found.');
    // }
    await permissionsCheck();
    await releaseSemaphore();
    deviceCheck();
    if (await isPermitted()) {
    //     // console.warn("Permissions granted");
        await initializeGScholarLENS();
    }
    // // else {
    // //     console.warn("Permissions NOT granted");
    // // }
})();

// When the extension is installed or updated…
chrome.runtime.onInstalled.addListener(async (details) => {
    chrome.runtime.setUninstallURL('https://forms.gle/uHuKHqutNQF1ToPW7');
//     console.log(details);
//     if (details.reason === 'install' || details.reason === 'update') {
//         // Open the permission-request page in a new tab
//         if (!await isPermitted()) {
//             const url = chrome.runtime.getURL('content/permissions.html');
//             chrome.tabs.create({ url });
//         }
//   }
});


async function setPermissionStatus(status) {
    return new Promise(resolve => {
        chrome.storage.local.set({ "isPermitted": status }, resolve);
    });
}

async function isPermitted() {
    return new Promise(resolve => {
        chrome.storage.local.get("isPermitted", (result) => {
            resolve(result.isPermitted || false);
        });
    });
    // const { ret_val } = await chrome.storage.local.get("isScraping");
    // console.error("getSemaphoreStatus() : " + ret_val); //DEBUG
    // return ret_val;
}

async function openPopupWindow(url) {
  // Build the creation options
  const createData = {
    url: url,
    type: 'popup',      // 'popup' gives you a window without normal browser chrome
    width: 400,
    height: 600,
    left: 100,
    top: 100,
    focused: true
  };

  // Cross-browser API reference:
  if (typeof browser !== 'undefined' && browser.windows) {
    // Firefox (or Chrome with the "browser" namespace polyfill)
    await browser.windows.create(createData);
  } else if (typeof chrome !== 'undefined' && chrome.windows) {
    // Chrome
    chrome.windows.create(createData);
  } else {
    console.error('No windows API available');
  }
    return true;
}

async function permissionsCheck() {
    // const permissions = !chrome.permissions ? !browser.permissions ? null : browser.permissions : chrome.permissions;//manifest.optional_permissions || {};
    // console.log('permissions', await permissions.getAll());
    try {
        const manifest = chrome.runtime.getManifest();
        // console.log(manifest);
        const origins = manifest.host_permissions || [];
        const perms = manifest.optional_permissions || [];

        // Build the “contains” query object
        const query = {};
        if (origins.length) query.origins = origins;
        if (perms.length) query.permissions = perms;

        // Check whether *all* are already granted
        const already = await chrome.permissions.contains(query);
        if (!already) {
            // Not all granted — open the dialog
            const url = chrome.runtime.getURL('content/permissions.html');
            // chrome.windows.create({ url });
            // console.log("here"); //DEBUG
            await openPopupWindow(url);
        } else {
            setPermissionStatus(true);
        }
    } catch (error) {
        console.error("Error requesting permissions:", error);
        setPermissionStatus(false);
    }
}

async function setInitializationStatus(status) {
    return new Promise(resolve => {
        chrome.storage.local.set({ "isInitialized": status }, resolve);
    });
}

async function isInitialized() {
    return new Promise(resolve => {
        chrome.storage.local.get("isInitialized", (result) => {
            resolve(result.isInitialized || false);
        });
    });
    // const { ret_val } = await chrome.storage.local.get("isScraping");
    // console.error("getSemaphoreStatus() : " + ret_val); //DEBUG
    // return ret_val;
}

// async function getSemaphoreStatus() {
async function getSemaphoreStatus() {
    return new Promise(resolve => {
        chrome.storage.local.get("isScraping", (result) => {
            // resolve(result.isScraping || false);
            resolve(result.isScraping);
        });
    });
    // const { ret_val } = await chrome.storage.local.get("isScraping");
    // console.error("getSemaphoreStatus() : " + ret_val); //DEBUG
    // return ret_val;
}

// Function to set the semaphore status in chrome storage
async function setSemaphoreStatus(status) {
    return new Promise(resolve => {
        chrome.storage.local.set({ "isScraping": status }, resolve);
    });
}

// Function to wait until the semaphore is free
async function waitForSemaphore() {
    while (await getSemaphoreStatus()) {
        // while (getSemaphoreStatus()) {
        await new Promise(resolve => setTimeout(resolve, 50));  // Poll every 50ms
        console.log('Waiting for semaphore...');
    }
    await setSemaphoreStatus(false);  // Acquire the semaphore
}

// Function to release the semaphore
async function getSemaphore() {
    // await new Promise(resolve => setTimeout(resolve, 4000));  // Wait for 4 seconds
    await setSemaphoreStatus(true);
}

// Function to release the semaphore
async function releaseSemaphore() {
    // await new Promise(resolve => setTimeout(resolve, 4000));  // Wait for 4 seconds
    await setSemaphoreStatus(false);
}

async function deviceCheck() {
    try {
        let isDesktop = false; // Default to false
        // Use the appropriate API for each browser
        const getPlatformInfo = (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getPlatformInfo)
            ? browser.runtime.getPlatformInfo
            : (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getPlatformInfo)
                ? () => new Promise(resolve => chrome.runtime.getPlatformInfo(resolve))
                : null;

        if (!getPlatformInfo) {
            isDesktop = false;
            console.warn('getPlatformInfo API not available. Defaulting to isDesktop = false.');
            return;
        }

        const info = await getPlatformInfo();
        isDesktop = info.os !== 'android';
        console.log(info);

        // Proceed with the rest of your extension logic
        console.log(`Running on ${info.os}. isDesktop: ${isDesktop}`);
        return new Promise(resolve => {
            chrome.storage.local.set({ "isDesktop": isDesktop }, resolve);
        });
    } catch (error) {
        console.error('Error determining platform:', error);
    }
}

async function isDesktop() {
    return new Promise(resolve => {
        chrome.storage.local.get("isDesktop", (result) => {
            resolve(result.isDesktop || false);
        });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log("Received message:", request.type); //DEBUG
    if (request.type === 'get_semaphore') {
        (async () => {
            // semaphore_queue.push(sender.tab.id);  // Add the tab ID to the queue    
            // while (true) {
            //     const tabId = sender.tab.id;
            //     // Check if this tab is still at the front of the queue
            //     const isFirstInQueue = (tabId === semaphore_queue[0]);
            //     // Check if the tab is still active (exists and not discarded/closed)
            //     try {
            //         const tab = await chrome.tabs.get(tabId);
            //         const isStillActive = tab.active && !tab.discarded; // optional: check tab.status === "complete"

            //         if (!isStillActive) {
            //             // Remove the tab if it's not active anymore
            //             const index = semaphore_queue.indexOf(tabId);
            //             if (index !== -1) semaphore_queue.splice(index, 1);
            //             return; // Exit early, this tab is no longer eligible
            //         }

            //         if (isFirstInQueue && isStillActive) {
            //             // Proceed only if it's this tab's turn
            //             break;
            //         }

            //     } catch (err) {
            //         // Tab probably no longer exists (e.g. closed)
            //         const index = semaphore_queue.indexOf(tabId);
            //         if (index !== -1) semaphore_queue.splice(index, 1);
            //         return; // Exit the loop, nothing more to do
            //     }

            //     // Wait a bit before checking again
            //     await new Promise(resolve => setTimeout(resolve, 1000 * Math.max(semaphore_queue.length - 1, 1)));
            // }
            
            while(await getSemaphoreStatus()) {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));  // Wait for some ms
            }
            await waitForSemaphore();  // Wait for semaphore to be free
            // await new Promise(resolve => setTimeout(resolve, 4000));  // Wait for 4 seconds
            await getSemaphore();
            processing_tab = sender.tab.id; //semaphore_queue.shift();  // Remove the first tab ID from the queue
            sendResponse({ status: 'Semaphore acquired' });
        })();
    } else if (request.type === 'release_semaphore') {
        (async () => {
            if(processing_tab && processing_tab === sender.tab.id){
                await releaseSemaphore();
                processing_tab = null;  // Clear the processing tab
                sendResponse({ status: 'Semaphore released' });
            }
        })();
    } else if (request.type === 'wait_for_initialization') {
        (async () => {
            while (!await isInitialized()) {
                await new Promise(resolve => setTimeout(resolve, 50));  // Poll every 50ms
                console.log('Waiting for initialization...');
            }
            sendResponse({ status: 'Initialized GScholarLENS!' });
        })();
    } else if (request.type === 'device_check') {
        (async () => {
            while (!await isInitialized()) {
                await new Promise(resolve => setTimeout(resolve, 50));  // Poll every 50ms
            }
            sendResponse({ isDesktop: await isDesktop() });
        })();
    } else if (request.type === 'permissions_check') {
        (async () => {
            // console.log("here0.1"); //DEBUG
            // if (!await isPermitted()) {
            // //     // console.log("here0.2"); //DEBUG
            //     await permissionsCheck();
            // }
            if (await isPermitted() && !await isInitialized()) { 
                // console.log("here0.2"); //DEBUG
                await initializeGScholarLENS();
            }
            // console.log("here0.3"); //DEBUG
            sendResponse({ isPermitted: await isPermitted() });
        })();
    } else if (request.type === 'permissions_granted') {
        (async () => {
            // console.log("here1"); //DEBUG
            await setPermissionStatus(true);
            if (!await isInitialized()) { 
            //     // console.log("here2"); //DEBUG
                await initializeGScholarLENS();
            }
            sendResponse({ isPermitted: await isPermitted() });
        })();
    } else if (request.type === 'initialization_check') {
        (async () => {
            sendResponse({ isInitialized: await isInitialized() });
        })();
    }
    // else if (request.type === 'initialize_gscholarlens') {
    //     (async () => {
    //         await initializeGScholarLENS();
    //         sendResponse({ isInitialized: await isInitialized() });
    //     })();
    // } 
    return true; // Indicate that response is asynchronous
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.task === 'initialScrape') {
//         const pubWorker = new Worker(chrome.runtime.getURL('workers/publicationWorker.min.js'));
//         pubWorker.postMessage({ task: 'initialScrape', batch: request.publication, authorRegexes: request.authorRegexes, otherNamesList: request.otherNamesList, authorNameShort: request.authorNameShort, authorName: request.authorName, authorNameLong: request.authorNameLong });
//         pubWorker.onmessage = (event) => {
//             // Send the result back to the content script
//             chrome.tabs.sendMessage(sender.tab.id, { data: event.data });
//         };
//     }else if (request.task === 'checkRetraction') {
//         const retractionWorker = new Worker(chrome.runtime.getURL('workers/retractionWorker.min.js'));
//         retractionWorker.postMessage({ task: 'checkRetraction', batch: request.publication });
//         retractionWorker.onmessage = (event) => {
//             // Send the result back to the content script
//             chrome.tabs.sendMessage(sender.tab.id, { data: event.data });
//         };
//     }
//     return true; // Indicate that response is asynchronous
// });

onbeforeunload = (event) => {
    // alert('Releasing semaphore before unloading...');
    releaseSemaphore();
};

// //Read the JCR excel file
// function readJCRExcel(){
//     // Get the file URL
//     const fileUrl = chrome.runtime.getURL("data/2024-JCR_IMPACT_FACTOR_for_ScholarLens.xlsx");

//     (async function (fileUrl) {
//         await waitForSemaphore();
//         await getSemaphore();
//         // Fetch the file and parse it
//         fetch(fileUrl)
//         .then(response => response.arrayBuffer())  // Get file data as ArrayBuffer
//         .then(data => {
//             const workbook = XLSX.read(data, { type: "array" });  // Read workbook from array
//             const sheetName = workbook.SheetNames[0];             // Get the first sheet name
//             const worksheet = workbook.Sheets[sheetName];         // Get the worksheet
//             const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convert sheet to JSON
//             chrome.storage.local.set({ "jcrJSON": jsonData });
//         })
//         .catch(error => console.error("Error reading .xlsx file:", error));
//         await releaseSemaphore();
//     })();
// }

async function readJCRExcel() {

    try {
        await waitForSemaphore();
        // console.error("Got Semaphore for reading JCR excel Data"); //DEBUG
        // Get the file URL
        const fileUrl = chrome.runtime.getURL("data/2024-JCR_IMPACT_FACTOR.xlsx");

        // Fetch the file
        const response = await fetch(fileUrl);

        // Get file data as ArrayBuffer
        const data = await response.arrayBuffer();

        // Read workbook from array
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];

        // Get the worksheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Save the JSON data to local storage
        await chrome.storage.local.set({ "jcrJSON": jsonData });
        // console.error("Stored JCR excel Data"); //DEBUG
        await getJCRExcel();
        // console.error("Got JCR excel Data"); //DEBUG
        await releaseSemaphore();
        // // console.error("Released Semaphore after reading JCR excel Data"); //DEBUG
        // // console.log("Excel data saved to storage:", jsonData); //DEBUG
        // await setInitializationStatus(true);
    } catch (error) {
        console.error("Error reading .xlsx file:", error);
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            console.log(response.status);  // Should log "Semaphore acquired" once acquired
        });
    }

}


async function getJCRExcel() {
    return new Promise(resolve => {
        chrome.storage.local.get("jcrJSON", (result) => {
            resolve(result.jcrJSON || false);
        });
    });
}


//https://gitlab.com/crossref/retraction-watch-data/-/raw/main/retraction_watch.csv
async function getRetractionWatchDB() {
    return new Promise(resolve => {
        chrome.storage.local.get("retractionwatchdb", (result) => {
            resolve(result.retractionwatchdb || false);
        });
    });
}

// async function getRetractionWatchDB() {
//     return new Promise((resolve) => {
//         chrome.storage.local.get("retractionwatchdb", (result) => {
//             const base64Data = result.retractionwatchdb;
//             if (!base64Data) {
//                 resolve(false); // No data found
//                 return;
//             }

//             // Convert Base64 string back to Blob
//             const byteString = atob(base64Data.split(",")[1]);
//             const mimeString = base64Data.split(",")[0].split(":")[1].split(";")[0];
//             const ab = new ArrayBuffer(byteString.length);
//             const ia = new Uint8Array(ab);

//             for (let i = 0; i < byteString.length; i++) {
//                 ia[i] = byteString.charCodeAt(i);
//             }

//             resolve(new Blob([ab], { type: mimeString }));
//         });
//     });
// }

// async function setRetractionWatchDB(blob) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => {
//             // Store the Blob as a Base64 string
//             const base64Data = reader.result;
//             chrome.storage.local.set({ retractionwatchdb: base64Data }, () => {
//                 resolve();
//             });
//         };
//         reader.onerror = (error) => reject(error);
//         reader.readAsDataURL(blob); // Convert Blob to Base64
//     });
// }

// //Credit : https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
// const cyrb53 = (str, seed = 0) => {
//     let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
//     for(let i = 0, ch; i < str.length; i++) {
//         ch = str.charCodeAt(i);
//         h1 = Math.imul(h1 ^ ch, 2654435761);
//         h2 = Math.imul(h2 ^ ch, 1597334677);
//     }
//     h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
//     h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
//     h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
//     h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

//     return 4294967296 * (2097151 & h2) + (h1 >>> 0);
// };
// async function fetchWithSessionCache(key, url, refetch = false) {

//     if (!key || key.length === 0) {
//         // console.warn("Empty Cache key");
//         return null;   
//     }

//     const hash_key = cyrb53(key);
//     const cachedData = await sessionStorage.getItem(hash_key);
//     if (cachedData && !refetch) {
//         // console.log("Cache hit:", key);
//         // return JSON.parse(cachedData);
//         return cachedData;
//     }

//     // console.warn("Cache miss ("+ hash_key +") :", key);
//     try {
//         const response = await fetch(url);
//         // const data = await response.json();
//         // sessionStorage.setItem(key, JSON.stringify(data)); // Save to sessionStorage
//         // return data;
//         if(response && response.status == 200){
//             await sessionStorage.setItem(hash_key, response); // Save to sessionStorage
//         } 
//         return response;
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         return null;
//     }
//     return true;
// }

async function downloadRetractionWatchDB() {

    try {

        // while (!await isPermitted()) {
        //     await new Promise(resolve => setTimeout(resolve, 150));  // Poll every 50ms
        //     console.log('Waiting for permissions to download RetractionWatchDB...');
        // }

        await waitForSemaphore();
        // const proxy = "https://cors.bridged.cc/";  // or https://api.allorigins.win/raw?url=
        // const target = encodeURIComponent(
        // "https://gitlab.com/crossref/retraction-watch-data/-/raw/main/retraction_watch.csv"
        // );
        // const response = await fetch(proxy + target);

        const response = await fetch("https://gitlab.com/crossref/retraction-watch-data/-/raw/main/retraction_watch.csv");
        // console.log("Response status:", response); //DEBUG
        const reader = response.body.getReader();
        const chunks = [];
        let done = false;
        while (!done) {
            const { value, done: streamDone } = await reader.read();
            if (value) chunks.push(value);
            done = streamDone;
        }
        const data =  new Blob(chunks);
        // const data = await response.blob();
        Papa.parse(data, {
            // download: true,
            header: true, // Adjust based on your CSV structure
            // worker: true, // Use a web worker for performance
            skipEmptyLines: true, // Skip empty rows
            complete: results => {
                // console.log(results); //DEBUG
                // Save the CSV data to local storage
                chrome.storage.local.set({ "retractionwatchdb": results.data });
                getRetractionWatchDB();
                releaseSemaphore();
                setInitializationStatus(true);
            }
        });
        // // // await setRetractionWatchDB(data);
        // await chrome.storage.local.set({ "retractionwatchdb": data });
        // // ldb.set('retractionwatchdb', data);
        // await getRetractionWatchDB();
        // await releaseSemaphore();
        // await setInitializationStatus(true);

        // const csvPath = chrome.runtime.getURL("data/retraction_watch.csv");
        // const csvPath = chrome.runtime.getURL("data/retraction_watch_stripped.txt");




        // data.pipeTo(parseStream);
        // data.pipeThrough(new TextDecoderStream()).pipeTo(parseStream);
        // Papa.parse(data, {
        //     complete: results => {
        //         // console.log(results); //DEBUG
        //         // Save the CSV data to local storage
        //         chrome.storage.local.set({ "retractionwatchdb": results.data });
        //         getRetractionWatchDB();
        //         releaseSemaphore();
        //         setInitializationStatus(true);
        //     }
        // });
    } catch (error) {
        console.error("Error downloading RetractionWatchDB data :", error);
        // chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
        //     console.log(response.status);  // Should log "Semaphore acquired" once acquired
        // });
        releaseSemaphore();
    }

}

//Specialized loadScript function for different environments
let loadScript;

if (typeof importScripts === "function") {
    // Use the importScripts-based function for Chrome (background worker context)
    loadScript = function (url, callback) {
        try {
            // console.error("Permissions granted");
            importScripts(url);
            if (callback) callback();
        } catch (e) {
            console.error("(Chrome) Failed to load script:", e.name, e.message, e.code, url);
        }
    };
} else if (typeof document !== "undefined" && document.head) {
    // Use the DOM-based function for Firefox (non-worker context)
    loadScript = function (url, callback) {
        var head = document.head;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Bind the event to the callback function
        script.onreadystatechange = callback;
        script.onload = callback;

        // Append the script tag
        head.appendChild(script);
    };
} else {
    console.error("No valid environment for loading scripts.");
}

function loadLib(url, onDone) {
  return new Promise((resolve, reject) => {
    loadScript(url, () => {
      onDone();
      resolve();
    });
  });
}

// This is the old default loadScript which works in most cases in GScholarLENS.js
// function loadScript(url, callback) {
//     // Adding the script tag to the head as suggested before
//     var head = document.head;
//     var script = document.createElement('script');
//     script.type = 'text/javascript';
//     script.src = url;

//     // Then bind the event to the callback function.
//     // There are several events for cross browser compatibility.
//     script.onreadystatechange = callback;
//     script.onload = callback;

//     // Fire the loading
//     head.appendChild(script);
// }

// function loadScript(url, callback) {
//     try {
//         importScripts(url);
//         if (callback) callback();
//     } catch (e) {
//         console.error("Failed to load script:", e);
//     }
// }

// async function initializeGScholarLENS() {
//     const [result1, result2] = await Promise.all([
//         new Promise((resolve) => {
//             const xlsxPath = chrome.runtime.getURL('libs/xlsx.full.min.js');
//             loadScript(xlsxPath, readJCRExcel);
//         }),
//         new Promise((resolve) => {
//             const papaparsePath = chrome.runtime.getURL('libs/papaparse.min.js');
//             loadScript(papaparsePath, downloadRetractionWatchDB);
//         })
//     ]);
//     // const xlsxPath = chrome.runtime.getURL('libs/xlsx.full.min.js');
//     // loadScript(xlsxPath, readJCRExcel);
//     // const papaparsePath = chrome.runtime.getURL('libs/papaparse.min.js');
//     // loadScript(papaparsePath, downloadRetractionWatchDB);
// }

// await downloadRetractionWatchDB();

// chrome.action.onClicked.addListener((tab) => {
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['content/GScholarLENS.js']  // Inject GScholarLENS.js into the active tab
//         // func: createButton
//     });
// });

chrome.action.onClicked.addListener((tab) => {
    const url = tab.url || "";
    // console.log("Clicked on tab URL:", url);
    if (url.includes("user=") && url.includes("scholar.google")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/GScholarLENS.js']  // Inject init.js into the active tab
        }).catch(err => {
            console.error("Injection failed:", err);
        });
    }
});

// importScripts(
//   chrome.runtime.getURL('libs/xlsx.full.min.js'),
//   chrome.runtime.getURL('libs/papaparse.min.js')
// );
if (typeof importScripts === "function") {
    importScripts(
        chrome.runtime.getURL('libs/xlsx.full.min.js'),
        chrome.runtime.getURL('libs/papaparse.min.js')
    );
}

async function initializeGScholarLENS() {
    if (typeof importScripts === "function") {
        readJCRExcel();
        downloadRetractionWatchDB();
    } else {
        // await Promise.all([() => {
        const xlsxPath = chrome.runtime.getURL('libs/xlsx.full.min.js');
        loadScript(xlsxPath, readJCRExcel);
        // },()=>{
        const papaparsePath = chrome.runtime.getURL('libs/papaparse.min.js');
        loadScript(papaparsePath, downloadRetractionWatchDB);
        // }]);
        // const [result1, result2] = await Promise.all([
        //     readJCRExcel(),
        //     downloadRetractionWatchDB()
        // ]);
    }
}

// chrome.action.onClicked.addListener((tab) => {
//   // Check if the tab is already loaded
//   chrome.tabs.get(tab.id, (currentTab) => {
//     if (currentTab.status === 'complete') {
//       injectScript(tab.id); // Inject immediately if loaded
//     } else {
//       // Wait for the tab to finish loading
//       const listener = (tabId, changeInfo) => {
//         if (tabId === tab.id && changeInfo.status === 'complete') {
//           injectScript(tabId);
//           chrome.tabs.onUpdated.removeListener(listener); // Cleanup
//         }
//       };
//       chrome.tabs.onUpdated.addListener(listener);
//     }
//   });
// });

// function injectScript(tabId) {
//   chrome.scripting.executeScript({
//     target: { tabId: tabId },
//     files: ['content/GScholarLENS.js']
//   }).catch(err => {
//     console.error('Injection failed:', err);
//   });
// }

chrome.action.onClicked.addListener(async () => {
    if (!await isPermitted()) await permissionsCheck();
    chrome.tabs.create({ url: "https://project.iith.ac.in/sharmaglab/gscholarlens/" }); // Navigates to the GScholarLENS website on clicking the extension icon
});


