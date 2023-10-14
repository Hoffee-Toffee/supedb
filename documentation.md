# Documentation

Functions, Tests

## common.js

### loadTheme()

>Changes theme to the theme stored in the Cookies

* **Parameters:**
  * None

* **Side Effects:**
  * Get's the value of the `theme` cookie
  * Link to a stylesheet of the same name

* **Return Value:**
  * None

### genContextMenu(*e, attr, hoverOnly = false*)

>Creates context menu with given data

* **Parameters:**

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

* **Side Effects:**
  * Creates the menu
  * Set up click events

* **Return Value:**
  * None

### toogleContextMenu(*e*)

>Decides whether to close the current menu, or open a new one on click

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### redir()

>Returns a redirect url

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### notify()

>Creates a notification at the top of the screen

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### genID()

>Returns a randomly generated id using the current date and time

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

## help.js

### help()

>Toggles the help/tutorial menu for this page

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### scrollCheck()

>Handles scrolling in the help menus

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

## dash.js

### start()

>Checks auth, reloads on data change

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### contextMenu(*e*)

>Returns the context menu data for this page

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### settingsMenu()

>Toggles the theme change settings menu

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

## login.js

### start()

> Shows login screen if cookies indicate an account has been made before, otherwise will show the sign up page

* **Parameters:**
  * None

* **Side Effects:**
  * Shows the login/signup page

* **Return Value:**
  * None

### tryLogin()

> Attempts to sign in using the user's credentials from the form

* **Parameters:**
  * None

* **Side Effects:** 
  * Logs in if possible
  * Show an error if failed

* **Return Value:**
  * None

### switchToLogin()

> Switches the page from signup to login

* **Parameters:**
  * None

* **Side Effects:** 
  * Hides all fields for signup
  * Shows all fields for login

* **Return Value:**
  * None

### switchToSignup()

> Switches the page from login to signup

* **Parameters:**
  * None

* **Side Effects:**
  * Hides all fields for login
  * Shows all fields for signup

* **Return Value:**
  * None

### forgotPassword()

> Currently a placeholder function
> In the future will send an email allowing a password reset

* **Parameters:**
  * None

* **Side Effects:**
  * None (yet)

* **Return Value:**
  * None

### errorChanged(*element*)

> Removes the error message once a button is pressed or user resubmits the form

* **Parameters:**

  * `element`: The element where the error is displayed

* **Side Effects:** 
  * Clears the error message

* **Return Value:**
  * None

## map.js

### start()

> Checks users permissions, gets data, puts it on the screen

* **Parameters:**
  * None

* **Side Effects:** 
  * Checks if user can access the data, and shows it if so

* **Return Value:**
  * None

### contextMenu(*e*)

> Returns the appropriate contextMenu for the element clicked

* **Parameters:**

  * `e`: mouseEvent, used to know what was right clicked and where

* **Side Effects:** 
  * generates different options, such as 'New Sub' for head nodes and 'Flip Direction' for links

* **Return Value:** 
  * An array of objects, representing each button in the context menu

### helpMenu()

> Toggles the display of the help menu for this page

* **Parameters:**
  * None

* **Side Effects:** 
  * Creates/deletes the help page

* **Return Value:**
  * None

### settingsMenu(*visClass*)

> Shows the settings menu of the given class

* **Parameters:**

  * `visClass`: A string; The class of fields to make visible, or will close the menu if this class is already showing

* **Side Effects:**
  * Opens the menu page specified by the visClass, or closes it

* **Return Value:**
  * None

### display(*all = true, objs = objects, embedEl = null*)

> Shows entires of the wiki as nodes

* **Parameters:**
  * `all`: Bool set to `true` by default

* **Side Effects:**
  * None

* **Return Value:**
  * None

### newObj(*type, obj = null, e = null, headId = null, document = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### updateObj(*el, attr, toSave = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### updateColor(*color*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### updateLinks(*element, get = false*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### save(*manual = false, reason*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### moveObj(*obj*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### linkPoints(*button, *obj*, points*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### deleteObj(*toDel*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### changeHead(*id*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### checkStatus(*event*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### modeToggled(*initialDelay = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

## versions.js

### start()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### settingsMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### genLine()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### check(*event, e = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### trigger(*id*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### cssVar(*name*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

## wiki.js

### start()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### displayWiki()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### helpMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### settingsMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### saveObjects(*callback = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### toggleEdit(*alert = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### textSet(*element, text*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### traverseObj(*obj, path, set = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

### genContent(*parent, info, path, depth = 2*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None
