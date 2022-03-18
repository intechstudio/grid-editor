## EN16 shifted pages profile with relative encoders - Description

### Added Functionality

This configuration profile lets the EN16 shift between the 16 MIDI channels easily using the utility button on the side of the module.

**Attention!**

Using this profile you lose the ability to switch between Pages using the utility button.

### Using it

Each of the encoders are set to work in Relative mode, utilizing velocity as well. When shifting between MIDI channels using the utility button; one of the LEDs will shine brighter than the other ones for a couple of seconds. This LED alludes to the MIDI channel number.

Using this profile you can have 256 parameters controlled with just one controller.

Relative mode is used so all values stay the same when switching between channels, so you can tweak in peace.

### How does it work?

The configuration uses a global `shift` variable, this does the heavy lifting in this profile. The `shift` variable changes when the side utility button is pressed. The shift variable modifies the MIDI channel, all encoders send their control changes out on. This way you can have 16 faux "Pages" in comparison to the real 4 Pages found on the Grid modular controllers.

