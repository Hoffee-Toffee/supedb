# Documentation

Functions, Tests

## common.js

### loadTheme()

>Changes theme to the theme stored in the Cookies

**Parameters:** none

**Side Effects:** Get's the value of the `theme` cookie, linking to a stylesheet of the same name

**Return Value:** none

### genContextMenu(*e, attr, hoverOnly = false*)

>Creates context menu with given data

**Parameters:**

* `e`: mouseEvent used to place the menu at the point of click
* `attr`: An array of objects, representing the menu's options, e.g.

  ```js
    [
      {
        text: "Delete Node", // Button Title
        onclick: () => (/* Some code that executes on click */),
        key: "Del" // Shows keypress information, but does not link to keypress here
      },
      ...
    ]
  ```

* `hoverOnly`: bool with default value of `false`\
  if set to `true` then the menu will close when the mouse is no longer hovering over the menu

**Side Effects:** Creates the menu and click events

**Return Value:** none

### toogleContextMenu(*e*)

>Decides whether to close the current menu, or open a new one on click

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### redir()

>Returns a redirect url

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### notify()

>Creates a notification at the top of the screen

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### genID()

>Returns a randomly generated id using the current date and time

**Parameters:** none

**Side Effects:** none

**Return Value:** none

## help.js

### help()

>Toggles the help/tutorial menu for this page

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### scrollCheck()

>Handles scrolling in the help menus

**Parameters:** none

**Side Effects:** none

**Return Value:** none

## dash.js

### start()

>Checks auth, reloads on data change

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### contextMenu(*e*)

>Returns the context menu data for this page

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### settingsMenu()

>Toggles the theme change settings menu

**Parameters:** none

**Side Effects:** none

**Return Value:** none

## login.js

### start()

> Shows login screen if cookies indicate an account has been made before, otherwise will show the sign up page

**Parameters:** none

**Side Effects:** `Shows the login/signup page`

**Return Value:** none

### tryLogin()

> Attempts to sign in using the user's credentials from the form

**Parameters:** none

**Side Effects:** `Logs in if possible, or will show an error`

**Return Value:** none

### switchToLogin()

> Switches the page from signup to login

**Parameters:** none

**Side Effects:** `Hides all fields for signup, and shows all fields for login`

**Return Value:** none

### switchToSignup()

> Switches the page from login to signup

**Parameters:** none

**Side Effects:** `Hides all fields for login, and shows all fields for signup`

**Return Value:** none

### forgotPassword()

> Currently a placeholder function
> In the future will send an email allowing a password reset

**Parameters:** none

**Side Effects:** `none (yet)`

**Return Value:** none

### errorChanged(*element*)

> Removes the error message once a button is pressed or user resubmits the form

**Parameters:**

* `element`: The element where the error is displayed

**Side Effects:** `Clears the error message`

**Return Value:** none

## map.js

### start()

> Checks users permissions, gets data, puts it on the screen

**Parameters:** none

**Side Effects:** `Checks if user can access the data, and shows it if so`

**Return Value:** none

### contextMenu(*e*)

> Returns the appropriate contextMenu for the element clicked

**Parameters:**

* `e`: mouseEvent, used to know what was right clicked and where

**Side Effects:** `generates different options, such as 'New Sub' for head nodes and 'Flip Direction' for links`

**Return Value:** `An array of objects, representing each button in the context menu`

### helpMenu()

> Toggles the display of the help menu for this page

**Parameters:** none

**Side Effects:** `Creates/deletes the help page`

**Return Value:** none

### settingsMenu(*visClass*)

> Shows the settings menu of the given class

**Parameters:**

* `visClass`: A string; The class of fields to make visible, or will close the menu if this class is already showing

**Side Effects:** `Opens the menu page specified by the visClass, or closes it`

**Return Value:** none

### display(*all = true, objs = objects, embedEl = null*)

> Shows entires of the wiki as nodes

**Parameters:** 

* `all`: Bool set to 

**Side Effects:** none

**Return Value:** none

### newObj(*type, obj = null, e = null, headId = null, document = null*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### updateObj(*el, attr, toSave = true*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### updateColor(*color*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### updateLinks(*element, get = false*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### save(*manual = false, reason*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### moveObj(*obj*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### linkPoints(*button, *obj*, points*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### deleteObj(*toDel*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### changeHead(*id*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### checkStatus(*event*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### modeToggled(*initialDelay = true*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

## versions.js

### start()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### settingsMenu()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### genLine()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### check(*event, e = true*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### trigger(*id*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### cssVar(*name*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

## wiki.js

### start()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### displayWiki()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### helpMenu()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### settingsMenu()

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### saveObjects(*callback = null*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### toggleEdit(*alert = true*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### textSet(*element, text*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### traverseObj(*obj, path, set = null*)

**Parameters:** none

**Side Effects:** none

**Return Value:** none

### genContent(*parent, info, path, depth = 2*)
