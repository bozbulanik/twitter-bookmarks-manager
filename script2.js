let bookmarksData = [];
let currentPath = "";

let renderTimeout;

document.getElementById("category-text").addEventListener("click", function (event) {
    createList("", bookmarksData); 
    changePathText("", false);
});

function changePathText(text, forSearch){
    const pathDiv = document.getElementById("path");
    if (forSearch) {
        pathDiv.innerText = text;
    } else {
        let words = text.split(">");
        let formattedStr = words.map(word => {
            return word.trim().replace(/\b\w/g, char => char.toUpperCase());
        }).join(" > ");
        pathDiv.innerText = formattedStr;
    }
}

function changeTagText(text){
    let words = text.split(">");
    let formattedStr = words.map(word => {
        return word.trim().replace(/\b\w/g, char => char.toUpperCase());
    }).join(" > ");
    return formattedStr;
}

function buildCategoryTree(bookmarks) {
    const tree = {};
    bookmarks.forEach((bookmark) => {
        const categories = bookmark.tags.split("+");
        categories.forEach((categoryString) => {
            let categoriesList = categoryString.split(">");
            let currentNode = tree;
            categoriesList.forEach((cat) => {
                if (!currentNode[cat]) {
                    currentNode[cat] = {};
                }
                currentNode = currentNode[cat];
            });
        });
    });
    return tree;
}

function renderTreeView(tree, parentCategories = []) {
    const ul = document.createElement("ul");
    for (const category in tree) {
        const li = document.createElement("li");
        const childTree = renderTreeView(tree[category], [...parentCategories, category]);
        li.textContent = category;
        li.classList.add(Object.keys(tree[category]).length === 0 ? "leaf" : "expandable");

        li.addEventListener("click", function (event) {
            event.stopPropagation();
            currentPath = [...parentCategories, category].join(">");
            createList(currentPath, bookmarksData);
            changePathText(currentPath, false);
        });

        if (Object.keys(tree[category]).length > 0) {
            li.addEventListener("click", function (event) {
                event.stopPropagation();
                toggleCollapse(li, childTree);
            });
            childTree.style.display = "none";
            li.appendChild(childTree);
        }
        ul.appendChild(li);
    }
    return ul;
}

function toggleCollapse(li, childTree) {
    const isExpanded = li.classList.contains("expanded");
    li.classList.toggle("expanded", !isExpanded);
    childTree.style.display = isExpanded ? "none" : "block";
}

// Main application setup function
function app() {
    const tree = buildCategoryTree(bookmarksData);
    const treeView = renderTreeView(tree);
    document.getElementById("treeView").innerHTML = "";
    document.getElementById("treeView").appendChild(treeView);
    createList("", bookmarksData);
    changePathText(currentPath, false);
}

let searchTimeout; // To hold the debounce timer

document.getElementById("searchInput").addEventListener("input", () => {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    if (searchValue) {
        // Update the path text for searching
        let pathText = "Searching for " + searchValue + "...";
        changePathText(pathText, true);

        // Clear the previous timeout if user types before debounce time is over
        clearTimeout(searchTimeout);

        // Set a new timeout to wait for the user to stop typing
        searchTimeout = setTimeout(() => {
            // Filter data efficiently and update the list
            const filteredData = bookmarksData.filter(item => {
                return item.full_text && item.full_text.toLowerCase().includes(searchValue);
            });
            createList(currentPath, filteredData);
        }, 300); // Adjust the delay (300ms in this case)
    } else {
        // When no search input, show the full list and reset the path
        changePathText(currentPath, false);
        createList(currentPath, bookmarksData);
    }
});

function createList(path, data) {
    const bookmarkList = document.getElementById("bookmarkList");
    const fragment = document.createDocumentFragment(); // Use fragment to reduce reflows
    bookmarkList.innerHTML = ""; // Clear previous list

    data.forEach((item, index) => {
        if (item.tags.includes(path)) {
            const bookmarkElement = document.createElement("div");
            bookmarkElement.className = "bookmark-item";

            const idElement = document.createElement("div");
            const textElement = document.createElement("a");
            const tagElement = document.createElement("div");
            const deleteButton = document.createElement("button");

            idElement.innerHTML = item.id;
            textElement.innerHTML = item.full_text;
            textElement.href = item.tweet_url;
            tagElement.innerHTML = changeTagText(item.tags);

            idElement.className = "idElement";
            textElement.className = "textElement";
            tagElement.className = "tagElement";
            deleteButton.className = "delete-button"; 
            deleteButton.addEventListener("click", () => {
                deleteKeyValue(index);
            });

            bookmarkElement.appendChild(idElement);
            bookmarkElement.appendChild(textElement);
            bookmarkElement.appendChild(tagElement);
            bookmarkElement.appendChild(deleteButton);
            fragment.appendChild(bookmarkElement);
        }
    });

    bookmarkList.appendChild(fragment); // Append the fragment to minimize reflows
}

function deleteKeyValue(index) {
    bookmarksData.splice(index, 1);
    createList(currentPath, bookmarksData);
}

// Handle file input and display the tree view
document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        bookmarksData = JSON.parse(e.target.result);
        app();
    };
    reader.readAsText(file);
});

async function loadFileFromDisk() {
    try {
        const response = await fetch('http://localhost:8000/data.json'); // Adjust path
        if (!response.ok) throw new Error("Failed to fetch the file.");
        
        const data = await response.json();
        bookmarksData = data;
        app();
    } catch (error) {
        console.error("Error loading file:", error);
    }
}

loadFileFromDisk();

function addBookmark(name, url, tags) {
    const newId = bookmarksData.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    
    const tweetedAt = new Date().toISOString();

    const newBookmark = {
        "id": newId,
        "full_text": name,
        "tweet_url": url,
        "tweeted_at": tweetedAt,
        "tags": tags
    };

    bookmarksData.push(newBookmark);
}


// Get modal and button elements
const addBMModal = document.getElementById("addBMModal");
const openAddBMModalBtn = document.getElementById("openAddBMModalBtn");
const closeAddBMModalBtn = document.getElementById("closeAddBMModalBtn");

// Open modal when button is clicked
openAddBMModalBtn.onclick = function() {
    addBMModal.style.display = "block";
}

// Close modal when "x" is clicked
closeAddBMModalBtn.onclick = function() {
    addBMModal.style.display = "none";
}

// Close modal if the user clicks outside of the modal content
window.onclick = function(event) {
    if (event.target == addBMModal) {
        addBMModal.style.display = "none";
    }
}



const addBMForm = document.getElementById('addBMForm');
addBMForm.onsubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById('addBMName').value;
    const url = document.getElementById('addBMURL').value;
    // const category = document.getElementById('addBookmarkCategory').value;

    const status = document.getElementById("addBMStatus");
    status.innerText = "Bookmark added with the name " + name + "!";

    addBookmark(name, url, "tags");
    createList(currentPath, bookmarksData);
}