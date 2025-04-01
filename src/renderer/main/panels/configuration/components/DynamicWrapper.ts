export namespace DynamicWrapper {
  export namespace Event {
    export enum Type {
      UPDATE_ACTION = "update-action",
    }

    export class UpdateAction {
      public type: Type;
      constructor(
        public short: string,
        public script: string,
        public validationError: boolean,
      ) {
        this.type = Type.UPDATE_ACTION;
      }

      get data() {
        return {
          short: this.short,
          script: this.script,
          validationError: this.validationError,
        };
      }
    }
  }
}
