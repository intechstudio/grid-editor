## PO16 Sequencer Profile - Description

### Added Functionality

This profile lets the PO16 behave as an 8-step MIDI sequencer with an internal clock controlling tempo and pitch change control for each note as well.

Knobs from 0-7 (the top two rows) will show the active sequencer. Turning the knobs will change the pitch of the note sent. The MIDI messages being sent out are configured under the 'potmeter' event of each corresponding knob.

Knob 15 is controlling the tempo of the sequence.

### How does it work?

The configuration is mainly based on custom Code Blocks under the System Events tab. Specifically, under System Events/Timer you will find the code for the internal clock of this sequencer (the variables for initializing these are found under the 'init' tab).

This clock is counting down constantly and sending out the next of the 8 notes on each 'tick'.

