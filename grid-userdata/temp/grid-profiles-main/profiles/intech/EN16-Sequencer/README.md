## EN16 Sequencer Profile - Description

### Added Functionality

This profile lets the EN16 behave as an 8-step MIDI sequencer with an internal clock controlling tempo, note on/off setting and pitch change control for each note as well.

### Using it

The LEDs of the knobs from 0-7 (the top two rows) will show the sequencer playing, each one of the knobs representing a note in the sequence.

Turning the knobs will change the pitch of the note sent. The MIDI messages being sent out are configured under the 'encoder' event of each corresponding knob.

The top two rows of encoders will mute the corresponding notes when pressed once and unmute them when pressed again. This behavior can be changed under the 'button' event of each encoder.

Encoder 15 is controlling the tempo of the sequence. By pressing it down it can start and stop the whole sequence by starting or stopping the ongoing global 'timer' event. This behavior can be changed under the 'button' event of Encoder 15.

### How does it work?

The configuration is mainly based on custom Code Blocks under the System Events tab. Specifically, under System Events/Timer you will find the code for the internal clock of this sequencer (the variables for initializing these are found under the 'init' tab).

This clock is counting down constantly and sending out the next of the 8 notes on each 'tick'.

