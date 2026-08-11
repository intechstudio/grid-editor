import type { Component, SvelteComponent } from "svelte";
import { mount, unmount } from "svelte";
import {
  writable,
  type Readable,
  type Writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  get,
} from "svelte/store";
import { TargetManager as _TargetManager } from "../../runtime/string-table";

export namespace Modal {
  export enum Snap {
    Full = "Full",
    GridLayout = "GridLayout",
  }

  export class TargetManager {
    private targets = new Map<Snap, HTMLElement>();
    private static instance: TargetManager;

    private constructor() {}

    public static getInstance(): TargetManager {
      if (!TargetManager.instance) {
        TargetManager.instance = new TargetManager();
      }
      return TargetManager.instance;
    }

    public static registerAs(node: HTMLElement, value: Snap): void {
      this.getInstance().targets.set(value, node);
    }

    public get(value: Snap): HTMLElement | undefined {
      return this.targets.get(value);
    }
  }

  export type WindowProps = {
    disableEscapeClose?: boolean;
    disableClickOutside?: boolean;
    showAsUnique?: boolean;
  };

  // Strict type to enforce component must accept `data` prop.
  export type ComponentWithData<TData, TExtraProps = {}> = Component<
    SvelteComponent<{ data: Window<TData, TExtraProps> } & TExtraProps>
  >;

  export type Instance = Window<any, any>;

  export class Window<TData, TExtraProps = {}> {
    private readonly defaultProps: WindowProps = {
      disableEscapeClose: false,
      disableClickOutside: false,
    };

    private instance: SvelteComponent<any> | null = null;
    private targetNode: HTMLElement | null = null;
    private previouslyFocused: HTMLElement | null = null;

    constructor(
      private componentType: ComponentWithData<TData, TExtraProps>,
      public target: Snap = Snap.Full,
      public props?: WindowProps,
    ) {
      this.props = { ...this.defaultProps, ...props };
    }

    public show(extraProps?: TExtraProps) {
      if (this.instance) {
        console.warn(_TargetManager.ErrorText.ALREADY_SHOWN);
        return { close: this.close.bind(this) };
      }

      if (this.props.showAsUnique) {
        const manager = get(modalManager);
        const found = manager.windows.find(
          (e: any) => e.componentType === this.componentType,
        );
        if (found) {
          return;
        }
      }

      this.previouslyFocused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      this.targetNode = document.createElement("div");

      if (this.target === Snap.Full) {
        document.body.appendChild(this.targetNode);
      } else if (this.target === Snap.GridLayout) {
        const instance = TargetManager.getInstance();
        const targetElement = instance.get(Snap.GridLayout);

        if (!targetElement) {
          throw _TargetManager.ErrorText.UNKNOWN_TARGET;
        }

        targetElement.appendChild(this.targetNode);
      }

      this.instance = mount(this.componentType, {
        target: this.targetNode,
        props: {
          ...(extraProps as TExtraProps),
          data: this,
        },
      }) as SvelteComponent<any>;

      modalManager.add(this);
    }

    public close(): void {
      if (this.instance) {
        unmount(this.instance);
        this.instance = null;
      }

      if (this.targetNode) {
        this.targetNode.remove();
        this.targetNode = null;
        modalManager.remove(this);
      } else {
        console.warn("Modal target node already removed or never created.");
      }

      if (this.previouslyFocused?.isConnected) {
        this.previouslyFocused.focus();
      }
      this.previouslyFocused = null;
    }
  }

  export type ManagerData = {
    windows: Window<any, any>[];
  };

  export class Manager implements Readable<ManagerData> {
    protected _internal: Writable<ManagerData> = writable({ windows: [] });

    public subscribe(
      run: Subscriber<ManagerData>,
      invalidate?: (value?: ManagerData) => void,
    ): Unsubscriber {
      return this._internal.subscribe(run, invalidate);
    }

    public set(value: ManagerData) {
      this._internal.set(value);
    }

    public update(updater: Updater<ManagerData>) {
      this._internal.update(updater);
    }

    public add(modal: Window<any, any>) {
      this.update((s) => ({
        ...s,
        windows: [...s.windows, modal],
      }));
    }

    public remove(modal: Window<any, any>) {
      this.update((s) => ({
        ...s,
        windows: s.windows.filter((e) => e !== modal),
      }));
    }

    public closeAll() {
      const data = get(this._internal);
      for (const window of data.windows) {
        window.close();
      }
    }

    public getTop() {
      const { windows } = get(this._internal);
      return windows.length > 0 ? windows[windows.length - 1] : undefined;
    }
  }
}

export const modalManager = new Modal.Manager();
