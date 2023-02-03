function help() {
    // Get the help screen
    let helpScreen = document.getElementById("helpScreen");

    // Toggle the help screen on and off
    document.documentElement.classList.toggle("help");

    // Return if now hidden
    if (!document.documentElement.classList.contains("help")) {
        // Return scrolling to the body
        document.body.style.overflow = "auto";

        // Remove all children from the help screen
        while (helpScreen.firstChild) {
            helpScreen.removeChild(helpScreen.firstChild);
        }

        return;
    };

    // Try to get the page data for this page
    try {
        let menuData = helpMenu();

        /* In format:
        "topic": {
            desc: [
                "Line 1",
                "Line 2",
                ...
            ],
            pages: [
                {
                    "section": [
                        "Line 1",
                        "Line 2",
                        ...
                    ],
                    ...
                },
                ...
            ]
        },
        ...

        Each page will have a gif, the title will be the in the format of "{topic}-{page}"
        */

        // Add the help box
        let helpBox = document.createElement("div");
        helpBox.id = "helpBox";
        helpScreen.appendChild(helpBox);

        // Remove scrolling from the body
        document.body.style.overflow = "hidden";

        // Add the title
        let title = document.createElement("h1");
        title.innerText = "Help";
        helpBox.appendChild(title);

        // Add the table of contents and main content
        let toc = document.createElement("nav");
        let tocTitle = document.createElement("h2");
        let tocUl = document.createElement("ul");
        tocTitle.innerText = "Table of Contents";
        toc.id = "toc";
        helpBox.appendChild(toc);
        toc.appendChild(tocTitle);
        toc.appendChild(tocUl);

        let content = document.createElement("div");
        content.id = "content";
        helpBox.appendChild(content);

        // Add scroll check
        content.addEventListener("scroll", scrollCheck);

        // Loop through each topic
        for (let topic in menuData) {
            // Add the topic to the table of contents
            let topicLi = document.createElement("li");
            let topicLink = document.createElement("a");
            let topicUl = document.createElement("ul");
            topicLink.innerText = topic;
            topicLi.appendChild(topicLink);
            topicLi.appendChild(topicUl);
            tocUl.appendChild(topicLi);

            // Add the topic to the content
            let topicDiv = document.createElement("div");
            topicDiv.id = topic;
            content.appendChild(topicDiv);

            // Add the topic title
            let topicTitle = document.createElement("h2");
            topicTitle.innerText = topic;
            topicDiv.appendChild(topicTitle);

            // Scroll to topicDiv when topicLink is clicked
            topicLink.addEventListener("click", function() {
                // Scroll the content to the topic
                content.scrollTo({
                    top: topicDiv.offsetTop,
                    behavior: "smooth"
                });
            });

            // Add scroll check
            topicDiv.addEventListener("scroll", scrollCheck);

            // Loop through each page
            for (let i = 0; i < menuData[topic].pages.length; i++) {
                let pageDiv = document.createElement("div");
                pageDiv.id = topic + "-" + (i + 1);
                topicDiv.appendChild(pageDiv);

                // Add page to the table of contents (if more than one page) and content
                if (menuData[topic].pages.length > 1) {
                    let pageLi = document.createElement("li");
                    let pageLink = document.createElement("a");
                    pageLink.innerText = "Page " + (i + 1);
                    pageLi.appendChild(pageLink);
                    topicUl.appendChild(pageLi);

                    // Scroll to pageDiv when pageLink is clicked
                    pageLink.addEventListener("click", function() {
                        // Scroll the content to the topic, then scroll the topic to the page (once the content has scrolled)
                        content.scrollTo({
                            top: topicDiv.offsetTop,
                            behavior: "smooth"
                        });

                        setTimeout(function() {
                            topicDiv.scrollTo({
                                left: pageDiv.offsetLeft,
                                behavior: "smooth"
                            });
                        }, 500);
                    });
                }

                // Add the description (if any and only on the first page)
                if (i == 0 && menuData[topic].desc) {
                    let desc = document.createElement("p");
                    desc.innerText = menuData[topic].desc.join("\n");
                    pageDiv.appendChild(desc);
                }

                // Loop through each section
                for (let section in menuData[topic].pages[i]) {
                    // Add the section text
                    let sectionText = document.createElement("p");
                    sectionText.innerText = menuData[topic].pages[i][section].join("\n");
                    pageDiv.appendChild(sectionText);
                }
            }
        }

        // Run scroll check
        scrollCheck();

    } catch (e) {
        console.error(e);

        // Add the help box (with placeholder text)
        let helpBox = document.createElement("div");
        helpBox.id = "helpBox";
        helpScreen.appendChild(helpBox);

        // Remove scrolling from the body
        document.body.style.overflow = "hidden";

        // Add the title
        let title = document.createElement("h1");
        title.innerText = "Help";
        helpBox.appendChild(title);

        // Add the placeholder text
        let placeholder = document.createElement("h2");
        placeholder.innerText = "No help available for this page yet.";
        helpBox.appendChild(placeholder);

        // Add styles to the placeholder
        placeholder.style.textAlign = "center";
        placeholder.style.height = "100%";
        placeholder.style.width = "100%";
        placeholder.style.color = "var(--col-orange)";
        placeholder.style.textShadow = "0 0 5px var(--col-red)";
    }
}

function scrollCheck() {
    // Get the elements in view
    let elements = document.elementsFromPoint(content.offsetWidth / 2, content.offsetHeight / 2);
    
    // The topic in view will be the one just before the content
    let topicInView = elements[elements.indexOf(content) - 1];

    // The page will be the one just before that
    let pageInView = elements[elements.indexOf(topicInView) - 1];

    // Exit if either are undefined
    if (!topicInView || !pageInView) return;

    console.log(topicInView.id, pageInView.id)

    // Loop through each link in the table of contents (backwards)
    let links = document.querySelectorAll("#toc a");

    var done = false;

    for (let i = links.length - 1; i >= 0; i--) {
        let link = links[i];
        let title = link.innerText;

        if (done) {
            link.classList.remove("active");
            continue;
        }

        // Check if it starts with "Page"
        if (title.startsWith("Page")) {
            // Swap the first 5 characters for the inner text of the topic
            title = link.parentElement.parentElement.parentElement.firstChild.innerText + "-" + title.substring(5);

            // Check if the title is the same as the page in view
            if (title == pageInView.id) {
                // If so, set the link as active
                link.classList.add("active");
                done = true;
            }
            else {
                // Otherwise, remove the active class
                link.classList.remove("active");
            }
        }
        else {
            // Check if the title is the same as the topic in view
            if (title == topicInView.id) {
                // If so, set the link as active
                link.classList.add("active");
                done = true;
            }
            else {
                // Otherwise, remove the active class
                link.classList.remove("active");
            }
        }
        
    }
}