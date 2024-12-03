let bookmarksData = []; // Array to hold all the bookmark data

let currentPath;

// Helper function to build the category tree
function buildCategoryTree(bookmarks) {
    const tree = {};

    bookmarks.forEach((bookmark) => {
        const categories = bookmark.tags.split("+");

        categories.forEach((categoryString) => {
            let categoriesList = categoryString.split(">");
            let currentNode = tree;

            categoriesList.forEach((cat) => {
                // If category doesn't exist, create it
                if (!currentNode[cat]) {
                    currentNode[cat] = {};
                }
                currentNode = currentNode[cat];
            });
        });
    });

    return tree;
}

// Function to recursively render the tree view as HTML with expand/collapse
function renderTreeView(tree, parentCategories = []) {
    const ul = document.createElement("ul");
    for (const category in tree) {
        const li = document.createElement("li");
        const childTree = renderTreeView(tree[category], [...parentCategories, category]);

        li.textContent = category;

        // Check if the current node is a leaf (deepest node)
        if (Object.keys(tree[category]).length === 0) {
            li.classList.add("leaf");
        } else {
            li.classList.add("expandable");

            li.addEventListener("click", function (event) {
                event.stopPropagation();
                toggleCollapse(li, childTree);
            });

            childTree.style.display = "none";
            li.appendChild(childTree);
        }

        // Add event listener to show current category and its parents
        li.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent expand/collapse behavior
            currentPath = [...parentCategories, category].join(">");
            createList([...parentCategories, category].join(">"))
        });

        ul.appendChild(li);
    }
    return ul;
}

// Toggle the collapse/expand of a category
function toggleCollapse(li, childTree) {
    const isExpanded = li.classList.contains("expanded");
    if (isExpanded) {
        li.classList.remove("expanded");
        childTree.style.display = "none";
    } else {
        li.classList.add("expanded");
        childTree.style.display = "block";
    }
}


function app(){
    const tree = buildCategoryTree(bookmarksData);
    const treeView = renderTreeView(tree);
    document.getElementById("treeView").innerHTML = ""; // Clear previous tree
    document.getElementById("treeView").appendChild(treeView);
    createList("");

}

function createList(path){

    const bookmarkList = document.getElementById("bookmarkList");
    bookmarkList.innerHTML = "";
    bookmarksData.forEach((item, index) => {
        if(item.tags.includes(path)){
            const bookmarkElement = document.createElement("div");
            bookmarkElement.className = "bookmark-item";

            const idElement = document.createElement("div");
            const textElement = document.createElement("a");
            const tagElement = document.createElement("div");
            const deleteButton = document.createElement("button");

            idElement.innerHTML = item.id;
            textElement.innerHTML = item.full_text;
            textElement.href = item.tweet_url;
            tagElement.innerHTML = item.tags;
        

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


            bookmarkList.appendChild(bookmarkElement);
        }
    });
}

function deleteKeyValue(index) {
    bookmarksData.splice(index, 1);
    createList(currentPath);
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
        app(); // Call your app function
    } catch (error) {
        console.error("Error loading file:", error);
    }
}

loadFileFromDisk(); // Automatically triggers on page load
