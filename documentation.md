# Documentation

Functions, Tests

## Table of Contents

- [Documentation](#documentation)
  - [Table of Contents](#table-of-contents)
  - [common.js](#commonjs)
    - [loadTheme()](#loadtheme)
    - [genContextMenu(*e, attr, hoverOnly = false*)](#gencontextmenue-attr-hoveronly--false)
    - [toogleContextMenu(*e*)](#tooglecontextmenue)
    - [redir()](#redir)
    - [notify()](#notify)
    - [genID()](#genid)
    - [passToKey(*password*)](#passtokeypassword)
    - [newKey()](#newkey)
    - [lock(key, data)](#lockkey-data)
    - [unlock(key, data)](#unlockkey-data)
  - [help.js](#helpjs)
    - [help()](#help)
    - [scrollCheck()](#scrollcheck)
  - [dash.js](#dashjs)
    - [start()](#start)
    - [contextMenu(*e*)](#contextmenue)
    - [settingsMenu()](#settingsmenu)
  - [login.js](#loginjs)
    - [start()](#start-1)
    - [tryLogin()](#trylogin)
    - [switchToLogin()](#switchtologin)
    - [switchToSignup()](#switchtosignup)
    - [forgotPassword()](#forgotpassword)
    - [errorChanged(*element*)](#errorchangedelement)
  - [map.js](#mapjs)
    - [start()](#start-2)
    - [contextMenu(*e*)](#contextmenue-1)
    - [helpMenu()](#helpmenu)
    - [settingsMenu(*visClass*)](#settingsmenuvisclass)
    - [display(*all = true, objs = objects, embedEl = null*)](#displayall--true-objs--objects-embedel--null)
    - [newObj(*type, obj = null, e = null, headId = null, document = null*)](#newobjtype-obj--null-e--null-headid--null-document--null)
    - [updateObj(*el, attr, toSave = true*)](#updateobjel-attr-tosave--true)
    - [updateColor(*color*)](#updatecolorcolor)
    - [updateLinks(*element, get = false*)](#updatelinkselement-get--false)
    - [save(*manual = false, reason*)](#savemanual--false-reason)
    - [moveObj(*obj*)](#moveobjobj)
    - [linkPoints(*button, *obj*, points*)](#linkpointsbutton-obj-points)
    - [deleteObj(*toDel*)](#deleteobjtodel)
    - [changeHead(*id*)](#changeheadid)
    - [checkStatus(*event*)](#checkstatusevent)
    - [modeToggled(*initialDelay = true*)](#modetoggledinitialdelay--true)
  - [versions.js](#versionsjs)
    - [start()](#start-3)
    - [settingsMenu()](#settingsmenu-1)
    - [genLine()](#genline)
    - [check(*event, e = true*)](#checkevent-e--true)
    - [trigger(*id*)](#triggerid)
    - [cssVar(*name*)](#cssvarname)
  - [wiki.js](#wikijs)
    - [start()](#start-4)
    - [displayWiki()](#displaywiki)
    - [helpMenu()](#helpmenu-1)
    - [settingsMenu()](#settingsmenu-2)
    - [saveObjects(*callback = null*)](#saveobjectscallback--null)
    - [toggleEdit(*alert = true*)](#toggleeditalert--true)
    - [textSet(*element, text*)](#textsetelement-text)
    - [traverseObj(*obj, path, set = null*)](#traverseobjobj-path-set--null)
    - [genContent(*parent, info, path, depth = 2*)](#gencontentparent-info-path-depth--2)


## common.js

### loadTheme()

>Changes theme to the theme stored in the Cookies

* **Parameters:**
  * None

* **Side Effects:**
  * Get's the value of the `theme` cookie
  * Adds a link to a stylesheet of the same name
  * e.g. a theme cookie of `'aegis'` would add a link to `'../common/themes/aegis.css'`.

* **Return Value:**
  * None

* **Tests**
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

* **Tests**
  * None

### toogleContextMenu(*e*)

>Decides whether to close the current menu, or open a new one on mouse event

* **Parameters:**
  * `e`: MouseEvent, contains information on the action that initiated this function
    * `e.type`: Whether it was a click or a move of the mouse
    * `e.target`: The element that was clicked, can use the `id` or `classList` to determine what to do with it
    * `e.button`: Will be a `2` if the user right-clicked

* **Side Effects:**
  * Uses the above information to decide whether to open/close/replace a context menu
    * If you moved off an existing context menu with a class of `hoverOnly`, then remove that menu
    * If you click (not just right-click) something outside of an existing context menu, then remove that menu
    * Lastly, if the user has right-clicked anything, then try to make a new menu using that info by running `genContextMenu(e, contextMenu(e))`

* **Return Value:**
  * None

* **Tests**
  * None

### redir()

>Returns a redirect url

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * Returns a link to the current page, minus the host, but including all query data

* **Tests**
  * None

### notify()

>Creates a notification at the top of the screen

* **Parameters:**
  * `message`: A string of text to display

* **Side Effects:**
  * Displays the notice, at the top of the screen
  * After 5 seconds it will be dismissed, using a closing animation before being deleted

* **Return Value:**
  * None

* **Tests**
  * None

### genID()

>Returns a randomly generated id using the current date and time

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * Returns a string formed using the current time, and a random number to further avoid duplicates

* **Tests**
  * None

### passToKey(*password*)

>Generates an encryption key from the given password
>This key will be used to decrypt other access keys for this user

* **Parameters:**
  * `password`: A string, being the password of the user

* **Side Effects:**
  * None

* **Return Value:**
  * Returns the generated key

* **Tests**
  * None

### newKey()

>Returns a randomly generated encryption key
>Used to generate a key for use in a new encryptable project/timeline

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * A randomly generated key

* **Tests**
  * None

### lock(key, data)

>Runs the full encryption scheme, with the given key on the provided data

* **Parameters:**
  * `key`: The key used to encrypt the data
  * `data`: The data to encrypt

* **Side Effects:**
  * None

* **Return Value:**
  * Returns the encrypted data

* **Tests**
  * None

### unlock(key, data)

>Runs the full decryption scheme, with the given key on the provided data

* **Parameters:**
  * `key`: The key used to decrypt the data
  * `data`: The data to decrypt

* **Side Effects:**
  * None

* **Return Value:**
  * Returns the decrypted data

* **Tests**
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

* **Tests**
  * None

### scrollCheck()

>Handles scrolling in the help menus

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
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

* **Tests**
  * None

### contextMenu(*e*)

>Returns the context menu data for this page

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### settingsMenu()

>Toggles the theme change settings menu

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
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

* **Tests**
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

* **Tests**
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

* **Tests**
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

* **Tests**
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

* **Tests**
  * None

### errorChanged(*element*)

> Removes the error message once a button is pressed or user resubmits the form

* **Parameters:**
  * `element`: The element where the error is displayed

* **Side Effects:**
  * Clears the error message

* **Return Value:**
  * None

* **Tests**
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

* **Tests**
  * None

### contextMenu(*e*)

> Returns the appropriate contextMenu for the element clicked

* **Parameters:**
  * `e`: mouseEvent, used to know what was right clicked and where

* **Side Effects:**
  * generates different options, such as 'New Sub' for head nodes and 'Flip Direction' for links

* **Return Value:**
  * An array of objects, representing each button in the context menu
  
* **Tests**
  * None

### helpMenu()

> Toggles the display of the help menu for this page

* **Parameters:**
  * None

* **Side Effects:**
  * Creates/deletes the help page

* **Return Value:**
  * None

* **Tests**
  * None

### settingsMenu(*visClass*)

> Shows the settings menu of the given class

* **Parameters:**
  * `visClass`: A string; The class of fields to make visible, or will close the menu if this class is already showing

* **Side Effects:**
  * Opens the menu page specified by the visClass, or closes it

* **Return Value:**
  * None

* **Tests**
  * None

### display(*all = true, objs = objects, embedEl = null*)

> Shows entires of the wiki as nodes

* **Parameters:**
  * `all`: Bool set to `true` by default

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### newObj(*type, obj = null, e = null, headId = null, document = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### updateObj(*el, attr, toSave = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### updateColor(*color*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### updateLinks(*element, get = false*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### save(*manual = false, reason*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### moveObj(*obj*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### linkPoints(*button, *obj*, points*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### deleteObj(*toDel*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### changeHead(*id*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### checkStatus(*event*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### modeToggled(*initialDelay = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

## versions.js

### start()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### settingsMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### genLine()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### check(*event, e = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### trigger(*id*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### cssVar(*name*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

## wiki.js

### start()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### displayWiki()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### helpMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### settingsMenu()

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### saveObjects(*callback = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### toggleEdit(*alert = true*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### textSet(*element, text*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### traverseObj(*obj, path, set = null*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None

### genContent(*parent, info, path, depth = 2*)

* **Parameters:**
  * None

* **Side Effects:**
  * None

* **Return Value:**
  * None

* **Tests**
  * None
