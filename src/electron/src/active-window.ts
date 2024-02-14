// import activeWindow from 'active-win'; // package should be revisited and properly tested on windows 7 and older mac os versions, should do with new package architecture

export async function getActiveWindow() {
  return undefined;
  //return await activeWindow(); activeWindow is a package, which can cause incompaitibility issues on windows 7 and older mac os versions.
}
