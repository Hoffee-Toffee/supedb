# supedb
<!-- Display screenshot.png -->
![screenshot](screenshot.png)
A database to help with complex story planning

## Design

The application will have 3 main parts as follows:
### Node map

The node map will be a visual representation of the storylines and events.
Each node can be connected to other nodes to show the relationships between them.

The relationships can be one of the following:

* Cause (one event directly causes another, shown by a colored arrow from the cause to the effect)
* Factor (one event is a factor in causing another, shown by a grey arrow from the factor to the effect)
* Extension (two events either happen simultaneously or one node is an extension of the other, shown by a colored line between the nodes)

There are also 4 main types of nodes:

* Head Node (used to label a group of nodes, e.g. a character or storyline)
* Sub Node (an individual event associated with a head node, e.g. a character finds a MacGuffin)
* Era Divider (used to divide the story into eras, e.g. modern day, old west, etc.)
* Info Node (used for additional information that would be too bulky to include in the node map, e.g. a ship's crew manifest or a physical description of a character)

Head nodes each have their own color, which is used to color the arrows and lines connecting to them.
It allows a quick distinction between the different groups of nodes and their relationships.

#### Node menu

Each node has it's own menu that allows the user to perform the following actions:
* Delete the node
* Edit node links (coming soon)
* Change or add the node's head (not for head nodes, coming soon)
* Change node color (head nodes only)

### Wiki

(coming soon)

The wiki will contain pages for each head node.
Each page will contain the information in it's info nodes, and the page sections will be the information from it's associated sub nodes.
Changes to this wiki will change the information in the info nodes and sub nodes.

### Version control

(coming soon)

Users will be able to save their work in different ways to allow for iteration and group collaboration.
Here are the different types of saves/versions:

* Draft (an idea of changes to the story, only the user can see and edit the draft)
* Suggestion (an idea of changes to the story, everyone can see and edit the suggestion)
* Proposal (a set of conflicting suggestions, users can vote to decide which suggestion to use)
* Change (a change that skips the suggestion and proposal stages, if a user appeals the change, it will become a proposal)

Users will see a line representing the current version of the story.
There will be branches off of this line representing the different versions of the story.
Drafts will be shown as grey lines with a dot at the end. (the dot links to the draft)
Suggestions will be shown as colored lines with a dot at either end. (the first dot links to the proposal, the second dot links to the suggestion draft)
Proposals will be shown as a dot (the dot described above) which links to the proposal.
Changes will be shown as colored lines with a dot at either end. (the first dot links to the proposal, the second dot links to the change)

Drafts will be shown as lines curving to the right, while changes will be shown as lines curving to the left.

## UI Design

The UI will be retrofuturistic, based on the style of the TVA from the Marvel Cinematic Universe.
And since I love the retrofuturistic UI from Dead Space so much, I'll also be using that as inspiration.

### Colors

Shades of orange will be used for the main UI elements.
Shades of black/dark grey will be used for the background.
White will be used for most text.

Other colors that will be present, but used less frequently, are:

* Yellow (accent color)
* Red (for importance and as an accent color)
* Green (for success and as an accent color)
* Brown/Beige (retro aesthetic)
* Blue/Purple (futuristic aesthetic)

### Text, icons, borders, and buttons

Title text will be pixelated, like old terminals.
While most other text will be a clean, modern font.
Each element will have a fluorescent glow around it. (including some text)
Icons, borders, and buttons will be rounded to offset the sharp edges of the text.

### Inspiration images

<!-- ![Orange TVA logo on a green background, retro style](https://cdn.dribbble.com/users/2349641/screenshots/15994954/media/0c090a97b337e46aff656bc29d4bc5b9.jpg?compress=1&resize=768x576&vertical=top)
![TVA timeline view, white line with branching orange lines](https://steamuserimages-a.akamaihd.net/ugc/1696153791086046919/AF90181D15D7D56CA8A5B13CDFAC12A2E1CECA79/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true)
![TVA TemPad UI design](https://cdn.dribbble.com/users/1152027/screenshots/16053318/media/6ac38a3b3d403fd6a5bb939d0d624057.jpg?compress=1&resize=768x576&vertical=top)
![Dead Space UI menu prompt design](https://www.gameuidatabase.com/uploads/Dead-Space02052021-101017-29148.jpg)
![Dead Space door UI](https://dinoignacio.com/wp-content/uploads/2013/05/ds2_holograms.jpg)
![Dead Space orange elevator UI](https://i.ytimg.com/vi/ycptxNI49d4/maxresdefault.jpg) -->

<!-- Image grid (2x3) TVA on left and DS on right -->

| TVA | Dead Space |
| --- | ---------- |
| <img alt="Orange TVA logo on a green background, retro style" src="https://cdn.dribbble.com/users/2349641/screenshots/15994954/media/0c090a97b337e46aff656bc29d4bc5b9.jpg?compress=1&resize=768x576&vertical=top" width="400"> | <img alt="Dead Space UI menu prompt design" src="https://www.gameuidatabase.com/uploads/Dead-Space02052021-101017-29148.jpg" width="400"> |
| <img alt="TVA timeline view, white line with branching orange lines" src="https://steamuserimages-a.akamaihd.net/ugc/1696153791086046919/AF90181D15D7D56CA8A5B13CDFAC12A2E1CECA79/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true" width="400"> | <img alt="Dead Space door UI" src="https://dinoignacio.com/wp-content/uploads/2013/05/ds2_holograms.jpg" width="400"> |
| <img alt="TVA TemPad UI design" src="https://cdn.dribbble.com/users/1152027/screenshots/16053318/media/6ac38a3b3d403fd6a5bb939d0d624057.jpg?compress=1&resize=768x576&vertical=top" width="400"> | <img alt="Dead Space orange elevator UI" src="https://i.ytimg.com/vi/ycptxNI49d4/maxresdefault.jpg" width="400"> |
