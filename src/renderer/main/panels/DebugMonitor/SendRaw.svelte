<script lang="ts">
  import {
    MoltenPushButton,
    MoltenInput,
    Block,
    BlockRow,
  } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { get } from "svelte/store";
  import { grid } from "@intechstudio/grid-protocol";
  import {
    InstructionClassName,
    InstructionClass,
  } from "../../../runtime/engine.store";

  export let target: { dx: number; dy: number };

  let rawInput = `\x02085e0012print("INFO: foo")\x03`;

  async function handleSendRawClicked() {
    const runtime = get(runtime_manager).active?.runtime;
    if (!runtime) return;

    const dummyDescr = {
      brc_parameters: { DX: target.dx, DY: target.dy },
      class_name: InstructionClassName.IMMEDIATE,
      class_instr: InstructionClass.EXECUTE,
      class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
    };
    const encoded = grid.encode_packet(dummyDescr);
    if (!encoded) return;

    const brcHeader: number[] = encoded.serial.slice(0, 23);

    const classArray: number[] = [];
    for (let i = 0; i < rawInput.length; i++) {
      classArray.push(rawInput.charCodeAt(i));
    }

    if (classArray[classArray.length - 1] === 0x03) {
      classArray.push(0x04);
    } else if (classArray[classArray.length - 1] !== 0x04) {
      classArray.push(0x03);
      classArray.push(0x04);
    }

    const messageArray: number[] = [...brcHeader, ...classArray];

    const lenHex = messageArray.length.toString(16).padStart(4, "0");
    for (let i = 0; i < 4; i++) {
      messageArray[2 + i] = lenHex.charCodeAt(i);
    }

    const checksum = messageArray.reduce((a, b) => a ^ b);
    const checksumHex = checksum.toString(16).padStart(2, "0");
    messageArray.push(checksumHex.charCodeAt(0));
    messageArray.push(checksumHex.charCodeAt(1));
    messageArray.push(10);

    try {
      await runtime.connection.buffer.sendRawDataToGrid(
        new Uint8Array(messageArray),
        { dx: target.dx, dy: target.dy },
      );
    } catch (e) {
      console.warn("Failed to send raw packet:", e);
    }
  }
</script>

<Block>
  <BlockRow>
    <div class="flex-grow">
      <MoltenInput bind:target={rawInput} placeholder="Enter raw command..." />
    </div>
    <MoltenPushButton click={handleSendRawClicked} text="Send" />
  </BlockRow>
</Block>
