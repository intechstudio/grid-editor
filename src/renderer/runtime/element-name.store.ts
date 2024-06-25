import { writable, get } from "svelte/store";
import { runtime, user_input } from "./runtime.store";

export const elementNameStore = writable({});

export function update_elementNameStore(descr: any) {
  let ens = get(elementNameStore);

  if (ens[descr.brc_parameters.SX] === undefined) {
    ens[descr.brc_parameters.SX] = {};
  }
  if (ens[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }
  if (
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] === undefined
  ) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] = -1;
  }

  ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.NUM
  ] = descr.class_parameters.NAME;

  elementNameStore.set(ens);
}

export function getElementName(
  dx: number,
  dy: number,
  page: number,
  element: number
) {
  console.log(dx, dy, page, element);
  const _element = get(runtime)
    ?.find((e: any) => e.dx === dx && e.dy === dy)
    ?.pages.find((e: any) => e.pageNumber === page)
    ?.control_elements.find((e: any) => e.elementIndex === element);

  const index = _element.elementIndex;
  try {
    const { dx, dy } = get(user_input);
    const obj = get(elementNameStore)[dx][dy];
    const name = obj[index];
    if (name === "") {
      return undefined;
    }

    return `${name} (${
      _element.type[0].toUpperCase() + _element.type.slice(1).toLowerCase()
    })`;
  } catch (e) {
    return undefined;
  }
}

export function getElementDefaultName(
  dx: number,
  dy: number,
  page: number,
  element: number
) {
  const _elements = get(runtime)
    ?.find((e: any) => e.dx === dx && e.dy === dy)
    ?.pages.find((e: any) => e.pageNumber === page)?.control_elements;

  const _element = _elements.find((e: any) => e.elementIndex === element);

  return `Element ${element < 255 ? element : _elements.length - 1} (${
    _element.type[0].toUpperCase() + _element.type.slice(1).toLowerCase()
  })`;
}
