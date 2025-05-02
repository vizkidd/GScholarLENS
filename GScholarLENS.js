const QbackgroundColor = [
    ['rgba(166, 54, 3, 0.4)', 'rgba(84, 39, 143, 0.4)', 'rgba(0, 109, 44, 0.4)', 'rgba(8, 81, 156, 0.4)'],
    ['rgba(230, 85, 13, 0.4)', 'rgba(117, 107, 177, 0.4)', 'rgba(49, 163, 84, 0.4)', 'rgba(49, 130, 189,0.4)'],
    ['rgba(253, 141, 60, 0.4)', 'rgba(158, 154, 200, 0.4)', 'rgba(116, 196, 118, 0.4)', 'rgba(107, 174, 214, 0.4)'],
    ['rgba(253, 190, 133, 0.4)', 'rgba(203, 201, 226, 0.4)', 'rgba(186, 228, 179, 0.4)', 'rgba(189, 215, 231, 0.4)'],
    ['rgba(254, 237, 222, 0.4)', 'rgba(242, 240, 247, 0.4)', 'rgba(237, 248, 233, 0.4)', 'rgba(239, 243, 255, 0.4)']
];

const QborderColor = [
    ['rgb(127, 44, 2)', 'rgb(58, 27, 107)', 'rgb(0, 75, 28)', 'rgb(5, 52, 105)'], // Group 1
    ['rgb(179, 63, 11)', 'rgb(89, 79, 137)', 'rgb(38, 122, 62)', 'rgb(35, 97, 138)'], // Group 2
    ['rgb(184, 94, 42)', 'rgb(108, 106, 148)', 'rgb(78, 139, 82)', 'rgb(73, 115, 155)'], // Group 3
    ['rgb(194, 151, 99)', 'rgb(157, 156, 186)', 'rgb(145, 161, 135)', 'rgb(148, 173, 197)'], // Group 4
    // ['rgb(254, 237, 222)', 'rgb(242, 240, 247)', 'rgb(237, 248, 233)', 'rgb(239, 243, 255)'] // Group NA
    ['rgb(205, 141, 108)', 'rgb(180, 168, 207)', 'rgb(157, 208, 150)', 'rgb(150, 180, 230)'],// Group NA
];

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

function getRandomNumber(low, high) {
    let r = Math.floor(Math.random() * (high - low + 1)) + low;
    return r;
}

function generateRandomNumbers(total, count) {
    let numbers = [];
    let sum = 0;

    // Generate random numbers for the first (count - 1) elements
    for (let i = 0; i < count - 1; i++) {
        let remaining = total - sum; // Remaining value to distribute
        let random = Math.random() * remaining; // Random value between 0 and the remaining
        let rounded = Math.floor(random); // Convert to integer
        numbers.push(rounded);
        sum += rounded;
    }

    // Add the final number to make the total equal to the target
    numbers.push(total - sum);

    return numbers;
}

const QScorePosStackedChart_Q1 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const QScorePosStackedChart_Q2 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const QScorePosStackedChart_Q3 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const QScorePosStackedChart_Q4 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const QScorePosStackedChart_NA = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
function createQScorePosStackedChart() {
    const data = {
        labels: ["First Author", "Second Author", "Co Author", "Corresponding Author"],
        datasets: [
            { label: 'Q1', data: QScorePosStackedChart_Q1, backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
            { label: 'Q2', data: QScorePosStackedChart_Q2, backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
            { label: 'Q3', data: QScorePosStackedChart_Q3, backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
            { label: 'Q4', data: QScorePosStackedChart_Q4, backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
            { label: 'NA', data: QScorePosStackedChart_NA, backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 },
        ]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Publication Count By Authorship'
                },
                legend: {
                    display: false
                }
            },
            responsive: true,
            // interaction: {
            //     intersect: false,
            // },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                }
            }
        }
    };
    new Chart('qScorePosStackedChart', config);
}

const AuthorCitations_Q1 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const AuthorCitations_Q2 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const AuthorCitations_Q3 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const AuthorCitations_Q4 = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
const AuthorCitations_NA = [getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100), getRandomNumber(0, 100)];
function createAuthorCitationsChart() {
    const data = {
        labels: ['First Author Citations', 'Second Author Citations', 'Co-Author Citations', 'Corresponding Author Citations'],
        datasets: [
            { label: 'Q1 Citations', data: AuthorCitations_Q1, backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
            { label: 'Q2 Citations', data: AuthorCitations_Q2, backgroundColor: QbackgroundColor[1], borderColor: QborderColor[1], borderWidth: 1 },
            { label: 'Q3 Citations', data: AuthorCitations_Q3, backgroundColor: QbackgroundColor[2], borderColor: QborderColor[2], borderWidth: 1 },
            { label: 'Q4 Citations', data: AuthorCitations_Q4, backgroundColor: QbackgroundColor[3], borderColor: QborderColor[3], borderWidth: 1 },
            { label: 'NA Citations', data: AuthorCitations_NA, backgroundColor: QbackgroundColor[4], borderColor: QborderColor[4], borderWidth: 1 },
        ]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Citation Count By Authorship'
                },
                legend: {
                    display: false
                }
            },
            responsive: true,
            // interaction: {
            //     intersect: false,
            // },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                }
            }
        }
    };
    new Chart('authorCitationsChart', config);
}

const MAX_PUBLICATIONS = getRandomNumber(0, 50);
const MAX_CITATIONS = getRandomNumber(0, 800);
const pub_count = getRandomNumber(0, MAX_PUBLICATIONS);
const getCitationDistValues = () => {
    const citations_dist = [];
    for (let i = 0; i < getRandomNumber(pub_count - 1, pub_count); i++) {
        citations_dist.push(getRandomNumber(0, MAX_CITATIONS));
    }
    return citations_dist;
}
const AuthorCitationDistributions = [getCitationDistValues(), getCitationDistValues(), getCitationDistValues(), getCitationDistValues()];
function createAuthorCitationsDistChart() {

    const data = {
        labels: ['First Author Citations', 'Second Author Citations', 'Co-Author Citations', 'Corresponding Author Citations'],
        datasets: [
            { label: 'Citation Distribution', data: AuthorCitationDistributions, backgroundColor: QbackgroundColor[0], borderColor: QborderColor[0], borderWidth: 1 },
        ]
    };
    const config = {
        type: 'violin',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Citation Distribution By Authorship'
                },
                legend: {
                    display: false
                }
            },
            responsive: true,
            whiskersMode: 'exact',
            coef: 0,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                },
                y: {
                    stacked: true,
                    type: "logarithmic",
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                }
            }
        }
    };
    new Chart('authorCitationsDistChart', config);
}

const AuthorContributionPercentages = generateRandomNumbers(100, 4);
function createAuthorStackedChart() {
    // const AuthorContributionPercentages = generateRandomNumbers(100,4);
    const data = {
        // labels: ['Author Contribution %'],
        labels: [''],
        datasets: [
            { label: 'First Author Contribution %', data: [AuthorContributionPercentages[0]], backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            { label: 'Second Author Contribution %', data: [AuthorContributionPercentages[1]], backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            { label: 'Co-Author Contribution %', data: [AuthorContributionPercentages[2]], backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            { label: 'Corresponding Author Contribution %', data: [AuthorContributionPercentages[3]], backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 }
        ]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Author Contribution in % based on Authorship'
                },
                legend: {
                    display: false
                }
            },
            indexAxis: 'y',
            responsive: true,  // Make the chart responsive to container size
            maintainAspectRatio: false,  // Allow the chart to change size freely
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                }
            }
        }
    };
    new Chart('authorStackedChart', config);
}

const AuthorCitationPercentages = generateRandomNumbers(100, 4);
function createCitationsStackedChart() {
    // const AuthorCitationPercentages = generateRandomNumbers(100, 4);
    const data = {
        // labels: ['Author Contribution %'],
        labels: [''],
        datasets: [
            { label: 'First Author Citations %', data: [AuthorCitationPercentages[0]], backgroundColor: backgroundColor[0], borderColor: borderColor[0], borderWidth: 1 },
            { label: 'Second Author Citations %', data: [AuthorCitationPercentages[1]], backgroundColor: backgroundColor[1], borderColor: borderColor[1], borderWidth: 1 },
            { label: 'Co-Author Citations %', data: [AuthorCitationPercentages[2]], backgroundColor: backgroundColor[2], borderColor: borderColor[2], borderWidth: 1 },
            { label: 'Corresponding Author Citations %', data: [AuthorCitationPercentages[3]], backgroundColor: backgroundColor[3], borderColor: borderColor[3], borderWidth: 1 }
        ]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Citation Contribution in % based on Authorship'
                },
                legend: {
                    display: false
                }
            },
            indexAxis: 'y',
            responsive: true,  // Make the chart responsive to container size
            maintainAspectRatio: false,  // Allow the chart to change size freely
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Set the transparency of the x-axis gridlines
                    }
                }
            }
        }
    };
    new Chart('citationsStackedChart', config);
}

// function showLogoByBrowserPlatform(){
//     // console.log(platform.name.toLowerCase()); //DEBUG
//     let elements = [];
//     if(platform.name.toLowerCase() === "chrome"){
//         elements = document.getElementsByClassName('addon-firefox');
//         // document.getElementById('addon-chrome').style.display = 'none';
//     }
//     else if(platform.name.toLowerCase() === "firefox"){
//         elements = document.getElementsByClassName('addon-chrome')
//         // document.getElementById('addon-firefox').style.display = 'none';
//     }

//     for (let i = 0; i < elements.length; i++) {
//         // console.log(entry); //DEBUG
//         elements[i].style.display = 'none';
//     }
// }

// showLogoByBrowserPlatform();

const fontPath = "fonts/SchibstedGrotesk.ttf";
const schibsted_grotesk = new FontFace('schibsted-grotesk', `url(${fontPath})`);

// Add the font to the document once it's loaded
schibsted_grotesk.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
    document.body.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
}).catch((error) => {
    console.error('Font failed to load:', error);
});

function colorWords() {
    document.getElementById("redWord").style.color = "red";
}

function blinkText(element_id, interval = 500) {
    const text = document.getElementById(element_id);
    let isVisible = true;

    // Toggle visibility every 500ms
    setInterval(() => {
        text.style.visibility = isVisible ? "hidden" : "visible";
        isVisible = !isVisible;
    }, interval); // Change the interval duration as needed
}

function blinkTextColor(element_id, originalColor, blinkColor, interval = 500) {
    const text = document.getElementById(element_id);
    let isOriginalColor = true;

    // Toggle color every 500ms
    setInterval(() => {
        text.style.color = isOriginalColor ? originalColor : blinkColor;
        isOriginalColor = !isOriginalColor;
    }, interval);
}

const selectedList = [];

function getUniqueRandomPair(AuthorCitationDistributions, selectedList) {
    let authorPosIndex, publicationPosIndex;

    do {
        authorPosIndex = getRandomNumber(0, AuthorCitationDistributions.length - 1);

        // Prevent crash if an author has no publications
        if (AuthorCitationDistributions[authorPosIndex].length === 0) continue;

        publicationPosIndex = getRandomNumber(0, AuthorCitationDistributions[authorPosIndex].length - 1);
    } while (
        selectedList.some(([aIndex, pIndex]) => aIndex === authorPosIndex && pIndex === publicationPosIndex)
    );

    return [authorPosIndex, publicationPosIndex];
}

let tsvContent = `Index\tTitle\tAuthorship\tAuthorCount\tCitations\tAdjustedCitations\tAdjustmentWeight\n`;
const Publications = [[], [], [], []];
function generatePublications() {
    const Authorship = ["First Author", "Second Author", "Co-Author", "Corresponding Author"];
    const hCiteProp = [0.9, 0.5, 0.1, 1.0];
    for (let i = 0; i < MAX_PUBLICATIONS; i++) {
        const selectedPair = getUniqueRandomPair(AuthorCitationDistributions, selectedList);
        const authorPosIndex = selectedPair[0];
        const authorCount = getRandomNumber(authorPosIndex, 10);
        const publicationPosIndex = selectedPair[1];
        selectedList.push(selectedPair); // Add to selected list
        const citation = AuthorCitationDistributions[authorPosIndex][publicationPosIndex];
        const authorPos = Authorship[authorPosIndex];
        const adjustmentWeight = authorPosIndex === 2 ? authorCount > 6 ? 0.1 : 0.25 : hCiteProp[authorPosIndex];
        const publication = {
            id: i,
            title: crypto.randomUUID().replaceAll("-", ""),
            authorPos: authorPos,
            authorCount: authorCount,
            citation: citation,
            adjustedCitation: citation * adjustmentWeight,
            adjustmentWeight: adjustmentWeight,
            authorshipIndex: authorPosIndex
        };
        Publications[authorPosIndex].push(publication);
        tsvContent += `${publication.id}\t${publication.title}\t${publication.authorPos}\t${publication.authorCount}\t${publication.citation}\t${publication.adjustedCitation}\t${publication.adjustmentWeight}\n`;
        selectedList.push([authorPosIndex, publicationPosIndex]);
    }
}

function createButtons() {
    const button = document.createElement("button");

    button.id = "inject-content-button";
    button.textContent = "Run GScholarLENS";
    button.textContent.color = "white";
    button.style.display = "flex"; // Flexbox for proper alignment
    button.style.alignItems = "center"; // Vertically center text and icon
    button.style.gap = "5px"; // Space between icon and text
    // button.style.padding = "12px 20px"; // Increase padding for a larger button
    button.style.fontSize = "16px"; // Larger font size
    // button.style.fontWeight = "bold"; // Bold text
    button.style.color = "white"; // White text
    // button.style.fontStyle = "italic"; // Italicized text
    button.style.marginTop = "10px";
    button.style.marginBottom = "10px";
    button.style.zIndex = "1000";
    button.style.borderRadius = "7px";
    button.style.cursor = "pointer";
    button.style.boxShadow = "3px 3px 5px rgba(0,0,0,0.6)";
    button.style.fontFamily = "schibsted-grotesk, sans-serif"; // Apply the font
    button.style.backgroundColor = "rgba(0,0,0,0.8)"; // Black background

    // Add an icon to the button
    const icon = document.createElement("img");
    icon.src = "icons/icon128.png"; // Path to the icon
    icon.alt = "GScholarLENS";
    icon.style.height = "20px"; // Adjust icon size
    icon.style.width = "20px";
    icon.style.objectFit = "contain";

    // Add the icon and text to the button
    button.prepend(icon);

    const button1Section = document.getElementById('scholarlens-button');
    button1Section.append(button);

    const downloadButton = document.createElement("button");
    // downloadButton.id = "downloadButton";
    // downloadButton.disabled = true;
    downloadButton.style.display = 'none';
    downloadButton.style.fontFamily = 'schibsted-grotesk, sans-serif'; // Apply the font
    downloadButton.textContent = "Download Publications";

    downloadButton.addEventListener("click", () => {
        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "sample_publications.tsv"; // Filename includes the author's name
        // document.body.appendChild(link);
        link.click();
    });
    const button2Section = document.getElementById("download-button");
    button2Section.append(downloadButton);

    // Append the download button to the profile section
    // profileSection.appendChild(downloadButton);

    // Add an event listener to the button to execute content.js when clicked
    // button.addEventListener("click", () => {
    //     // alert("GScholarLENS is running!");
    //     document.getElementById("website_body").style.display = 'block';
    //     downloadButton.style.display = 'block';
    //     // button.style.display = "none";
    // }, { passive: true });
}

function createShIndex() {
    const hCiteProp = [0.9, 0.5, 0.1, 1.0];
    // const hFirst = getRandomNumber(0, 100);
    // const hSecond = getRandomNumber(0, 100);
    // const hOther = getRandomNumber(0, 100);
    // const hCO = getRandomNumber(0, 100);
    const hIndex = [0, 0, 0, 0];
    const adjustedCitations = []
    let shIndex = 0;
    // // console.log(AuthorCitationDistributions);
    // // console.log(AuthorCitations_Q1, AuthorCitations_Q2, AuthorCitations_Q3, AuthorCitations_Q4, AuthorCitations_NA);
    // AuthorCitationDistributions.forEach((element, index) => {
    //     element.sort((a, b) => b - a);
    //     let pub_idx = 1;
    //     while ((pub_idx - 1) < element.length) { 
    //         const adjustedCitation = element[pub_idx - 1] * hCiteProp[index];
    //         adjustedCitations.push(adjustedCitation);
    //         if (adjustedCitation > hIndex[index]) {
    //             hIndex[index]++;
    //         } 
    //         pub_idx++;
    //     }
    //  });

    Publications.forEach((pubArray, authorIdx) => {
        // 1. Sort by adjustedCitation, highest first
        pubArray.sort((a, b) => b.adjustedCitation - a.adjustedCitation);
        // console.log(pubArray);
        // 2. Walk through the sorted list and collect citations
        pubArray.forEach((pub, i) => {
            const adj = Number(pub.adjustedCitation);
            //   console.log(pub.adjustedCitation);
            adjustedCitations.push(adj);

            // 3. h-index logic: h is max i+1 such that citation >= i+1
            if (adj >= i + 1) {
                hIndex[authorIdx] = i + 1;
            }
        });

        // Debug
        // console.log(`Author position #${authorIdx}:`, pubArray);
        // console.log(`  Adjusted citations:`, pubArray.map(p => p.adjustedCitation));
        // console.log(`  h-index =`, hIndex[authorIdx]);
    });

    adjustedCitations.sort((a, b) => b - a);
    adjustedCitations.forEach((element, index) => {
        if (parseInt(element) > shIndex) {
            shIndex++;
        }
    });

    // const shIndexPubCount = getRandomNumber(0, 100);
    // console.log(hFirst, hSecond, hOther, hCO); //DEBUG

    // Calculate shIndex as 90% of hFirst, 50% of hSecond, 10% of hOther, and 100% of hCO
    // shIndex = 0.9 * hFirst + 0.5 * hSecond + 0.1 * hOther + 1.0 * hCO;
    // const shIndex = 0.9 * hFirst + 0.5 * hSecond + 0.1 * hOther + 1.0 * hCO;

    // console.log(shIndex); //DEBUG
    document.getElementById("sh_index").textContent = `Sh-Index:${shIndex.toFixed(0)}`;
    document.getElementById("h_first").textContent = hIndex[0].toString();
    document.getElementById("h_second").textContent = hIndex[1].toString();
    document.getElementById("h_other").textContent = hIndex[2].toString();
    document.getElementById("h_co").textContent = hIndex[3].toString();
    // document.getElementById("sh_index_info").innerHTML = `(${hCiteProp[0] * 100}% H<sub>First</sub> + ${hCiteProp[1] * 100}% H<sub>Second</sub> + ${hCiteProp[2] * 100}% H<sub>Other</sub> + ${hCiteProp[3] * 100}% H<sub>Co</sub>)`;
}

createQScorePosStackedChart();
createAuthorCitationsChart();
createAuthorCitationsDistChart();
createAuthorStackedChart();
createCitationsStackedChart();
generatePublications();
createShIndex();
colorWords();
blinkText("redWord", 500);
// blinkTextColor("redWord", "black", "red", 250);
createButtons();
