## BU16 Stream controller OBS profile - Description

### Added Functionality

This configuration profile lets the BU16 behave as a controller for the streaming application named OBS. 

Using this configuration will allow you to **switch between scenes**, **turn sources on and off** within those scenes and **mute/unmute audio sources**.

**Attention!**

For this configuration to work properly, you must also adjust your keyboard hotkey macros within the OBS application as well.

### Using it

In normal orientation the first column of elements represent scenes.

The second and third columns represent sources and the LEDs are switched off by default (implying switched off sources as well, but you could change this as you like).

The first two elements of the fourth column are mutes for audio sources.

Elements #11 #13 #14 #15 are blank, indicated by the default blue LED colors. You could configure these as you'd like using the functions found within this profile as a template.

### How does it work?

The scene switcher buttons use simple keyboard messages from `alt+shift+0` to `alt+shift+3` to switch between scenes. The LED behavior is made possible by a short `for` function.

The source buttons are toggles, nested within double `if` structures, so as to both check the button value and the button state before sending out messages from `alt+shift+4` to `alt+shift+9` (as of right now this is the limit of my keyboard, but you could come up with your own macros as well, you'll just have to match the ones in Grid Editor to the ones in OBS).

The audio mutes are simple keyboard messages nested inside `if` functions.