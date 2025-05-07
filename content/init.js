// Load the font using JavaScript
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
        try {
            startScraping(chrome);
            button.style.display = "none";
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

async function getJCRExcel() {
    // await new Promise(resolve => setTimeout(resolve, 1000));  // 1-second delay
    try {
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
    }
    catch (error) {
        console.error("Error: Could not RetractionWatchDB blob data. " + error);
        chrome.runtime.sendMessage({ type: 'release_semaphore' }, (response) => {
            console.log(response.status);  // Should log "Semaphore released" 
        });
    }
}

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

const gslensPath = chrome.runtime.getURL("content/GScholarLENS.js");
loadScript(gslensPath, () => { 
    try {
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
        console.log("GScholarLENS script loaded");
    }    catch (error) {
        console.error('Error loading GScholarLENS script:', error);
    }
}, "gscholarlens_script");