<script lang="ts">
  import { ModuleType } from "@intechstudio/grid-protocol";

  enum ModuleArchetype {
    EF44,
    PBF4,
    TEK1,
    VSNX,
    XX16,
  }

  export let type: ModuleType;

  const createGrid = (rows: number, value: [number, number]) =>
    Array(rows).fill(value);

  const representationMap = new Map<ModuleArchetype, [number, number][]>([
    [
      ModuleArchetype.EF44,
      [...createGrid(4, [1, 1]), ...createGrid(4, [1, 3])],
    ],
    [
      ModuleArchetype.PBF4,
      [
        ...createGrid(4, [1, 1]),
        ...createGrid(4, [1, 2]),
        ...createGrid(4, [1, 1]),
      ],
    ],
    [ModuleArchetype.XX16, createGrid(16, [1, 1])],
    [
      ModuleArchetype.TEK1,
      [...createGrid(2, [2, 2]), ...createGrid(8, [1, 1])],
    ],
  ]);

  function getRepresentation(type: ModuleType) {
    switch (type) {
      case ModuleType.EN16:
      case ModuleType.PO16:
      case ModuleType.BU16:
        return representationMap.get(ModuleArchetype.XX16);
      case ModuleType.PB44:
      case ModuleType.EF44:
        return representationMap.get(ModuleArchetype.EF44);
      case ModuleType.PBF4:
        return representationMap.get(ModuleArchetype.PBF4);
      case ModuleType.TEK2:
      case ModuleType.TEK1:
        return representationMap.get(ModuleArchetype.TEK1);
      case ModuleType.VSN0:
      case ModuleType.VSN1:
      case ModuleType.VSN1R:
      case ModuleType.VSN2:
        return representationMap.get(ModuleArchetype.VSNX);
    }
  }
</script>

<container>
  <div class="flex flex-col text-white">
    <div class="block text-sm">{type}</div>
    <div
      class="grid grid-cols-4 gap-2 h-24 w-24 p-2 border-2 border-white/25 bg-primary rounded"
    >
      {#each getRepresentation(type) as element}
        <div
          class={`row-span-${element[1]} col-span-${element[0]} bg-white/25 rounded-sm`}
        />
      {/each}
    </div>
  </div>
</container>
