export interface IPluginController{
    sendMessageToRuntime(payload : any) : void;
    pluginListChanged(plugins: {id: string, name: string, isLoaded: boolean}[]) : void;
}