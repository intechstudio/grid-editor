import menu_profile_cloud from "../assets/menu/menu_profile_cloud.svg?raw";
import menu_debug_monitor from "../assets/menu/menu_debug_monitor.svg?raw";
import menu_midi_monitor from "../assets/menu/menu_midi_monitor.svg?raw";
import menu_websocket_monitor from "../assets/menu/menu_websocket_monitor.svg?raw";
import menu_package_general from "../assets/menu/menu_package_general.svg?raw";
import menu_preferences from "../assets/menu/menu_preferences.svg?raw";
import menu_packages from "../assets/menu/menu_packages.svg?raw";
import menu_file_manager from "../assets/menu/menu_file_manager.svg?raw";

type MenuIconMap = {
  [key: string]: string;
};

const menuIconMap: MenuIconMap = {
  menu_profile_cloud,
  menu_debug_monitor,
  menu_midi_monitor,
  menu_websocket_monitor,
  menu_package_general,
  menu_preferences,
  menu_packages,
  menu_file_manager,
};

export default menuIconMap;
