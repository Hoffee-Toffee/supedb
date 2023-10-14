# Documentation

Functions, Tests

## common.js

### loadTheme()

Changes theme to the theme stored in the Cookies

### genContextMenu(`e, attr, hoverOnly = false`)

Creates context menu with given data

### toogleContextMenu(`e`)

Decides whether to close the current menu, or open a new one on click

### redir()

Returns a redirect url

### notify()

Creates a notification at the top of the screen

### genID()

Returns a randomly generated id using the current date and time

## help.js

### help()

Toggles the help/tutorial menu for this page

### scrollCheck()

Handles scrolling in the help menus

## dash.js

### start()

Checks auth, reloads on data change

### contextMenu(`e`)

Returns the context menu data for this page

### settingsMenu()

Toggles the theme change settings menu

## login.js

### start()

### tryLogin()

### switchToLogin()

### switchToSignup()

### forgotPassword()

### errorChanged()

## map.js

### start()

### contextMenu(`e`)

### helpMenu()

### settingsMenu(`visClass`)

### display(`all = true, objs = objects, embedEl = null`)

### newObj(`type, obj = null, e = null, headId = null, document = null`)

### updateObj(`el, attr, toSave = true`)

### updateColor(`color`)

### updateLinks(`element, get = false`)

### save(`manual = false, reason`)

### moveObj(`obj`)

### linkPoints(`button, *obj*, points`)

### deleteObj(`toDel`)

### changeHead(`id`)

### checkStatus(`event`)

### modeToggled(`initialDelay = true`)

## versions.js

### start()

### settingsMenu()

### genLine()

### check(`event, e = true`)

### trigger(`id`)

### cssVar(`name`)

## wiki.js

### start()

### displayWiki()

### helpMenu()

### settingsMenu()

### saveObjects(`callback = null`)

### toggleEdit(`alert = true`)

### textSet(`element, text`)

### traverseObj(`obj, path, set = null`)

### genContent(`parent, info, path, depth = 2`)
