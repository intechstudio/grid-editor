<script>

  import {appSettings} from '../../stores/app-settings.store'

  let selectedTab = '';

  function changeTab(tab){
    selectedTab = tab;
    appSettings.update(store => {
      store.tab = tab;
      return store;
    })
  };

  let openPref = false;
  function openPreferences(){
    openPref = ! openPref;
    appSettings.update(store => {
      store.preferences = openPref;
      return store;
    })
  }

</script>

<nav-tab class=" flex px-1 flex-col items-center justify-between bg-primary h-full">
  <div class="flex flex-col">
    <div 
      class:bg-secondary={selectedTab == 'virtual-modules'} 
      on:click={()=>{changeTab('virtual-modules')}} 
      class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
      <svg 
        class:text-white={selectedTab == 'virtual-modules'} 
        class="fill-current text-black group-hover:text-white" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21 2H4C2.89543 2 2 2.89543 2 4V21C2 22.1046 2.89543 23 4 23H21C22.1046 23 23 22.1046 23 21V4C23 2.89543 22.1046 2 21 2ZM4 0C1.79086 0 0 1.79086 0 4V21C0 23.2091 1.79086 25 4 25H21C23.2091 25 25 23.2091 25 21V4C25 1.79086 23.2091 0 21 0H4Z"/>
        <path d="M12.4863 14.5869L13.8604 9.60352H15.9248L13.4297 17H11.543L9.04785 9.60352H11.1123L12.4863 14.5869Z" />
      </svg>
    </div>

    <div 
      class:bg-secondary={selectedTab == 'global-settings'} 
      on:click={()=>{changeTab('global-settings')}}  
      class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
      <svg 
        class:text-white={selectedTab == 'global-settings'} 
        class="stroke-current text-black group-hover:text-white" width="30" height="36" viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="11.651" y="1.37989" width="19.1952" height="19.1952" rx="3" transform="rotate(32.3504 11.651 1.37989)"  stroke-width="2"/>
        <rect x="12.4044" y="7.31455" width="19.1952" height="19.1952" rx="3" transform="rotate(32.3504 12.4044 7.31455)"  stroke-width="2"/>
      </svg>
    </div>

    <div 
      class:bg-secondary={selectedTab == 'local-settings'} 
      on:click={()=>{changeTab('local-settings')}}  
      class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
      <svg 
        class:text-white={selectedTab == 'local-settings'}
        class="stroke-current text-black group-hover:text-white" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.6772" cy="12.6777" r="11.5"  stroke-width="2"/>
        <rect x="1.17725" y="12.1777" width="10" height="1" fill="black" />
      </svg>
    </div>

    <div 
      class:bg-secondary={selectedTab == 'profiles'}
      on:click={()=>{changeTab('profiles')}}  
      class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
      <svg 
        class:text-white={selectedTab == 'profiles'}
        class="stroke-current text-black group-hover:text-white" width="27" height="22" viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5.5L1.00028 19C1.0003 20.1046 1.89573 21 3.00028 21H24C25.1046 21 26 20.1046 26 19V7.5C26 6.39543 25.1046 5.5 24 5.5H11.0002M1 5.5V3C1 1.89543 1.89543 1 3 1H9.00019C10.1048 1 11.0002 1.89543 11.0002 3V5.5M1 5.5H11.0002"  stroke-width="2"/>
      </svg>
    </div>
  </div>
  
  <div 
    class:bg-secondary={selectedTab == 'preferences'} 
    on:click={()=>{openPreferences()}}  
    class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
    <svg 
      class:text-white={selectedTab == 'preferences'}
      class="fill-current text-black group-hover:text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2183 0.254654L13.5394 0.254654V3.74186C14.6186 3.96094 15.6218 4.38934 16.5048 4.98285L19.0189 2.46874L21.3673 4.81712L18.8372 7.34721C19.3982 8.20699 19.8043 9.17715 20.0155 10.218H23.5027V13.5391H20.0155C19.7965 14.6184 19.3681 15.6216 18.7745 16.5046L21.2887 19.0187L18.9403 21.3671L16.4102 18.837C15.5504 19.398 14.5802 19.804 13.5394 20.0153L13.5394 23.5026H10.2183L10.2183 20.0153C9.17739 19.804 8.20724 19.398 7.34746 18.837L4.81735 21.3671L2.46897 19.0187L4.98309 16.5046C4.38958 15.6216 3.96117 14.6184 3.74209 13.5391H0.254883L0.254883 10.218H3.74209C3.95338 9.17715 4.35938 8.20699 4.92042 7.34721L2.39033 4.81712L4.73872 2.46874L7.25284 4.98285C8.13581 4.38934 9.13902 3.96094 10.2183 3.74186V0.254654ZM11.8788 5.78986C11.3031 5.78986 10.7461 5.86975 10.2183 6.01905C9.73878 6.15467 9.28335 6.34754 8.85982 6.58983C7.88231 7.14903 7.07473 7.97142 6.53364 8.96043C6.31769 9.35513 6.1442 9.77638 6.01928 10.218C5.86998 10.7459 5.79009 11.3029 5.79009 11.8786C5.79009 12.4543 5.86998 13.0113 6.01928 13.5391C6.1549 14.0186 6.34778 14.4741 6.59007 14.8976C7.14927 15.8751 7.97167 16.6827 8.96068 17.2238C9.35538 17.4397 9.77662 17.6132 10.2183 17.7381C10.7461 17.8874 11.3031 17.9673 11.8788 17.9673C12.4545 17.9673 13.0115 17.8874 13.5394 17.7381C13.981 17.6132 14.4023 17.4397 14.797 17.2238C15.786 16.6827 16.6084 15.8751 17.1676 14.8976C17.4099 14.4741 17.6027 14.0186 17.7383 13.5391C17.8876 13.0113 17.9675 12.4543 17.9675 11.8786C17.9675 11.3029 17.8876 10.7459 17.7383 10.218C17.6134 9.77638 17.4399 9.35513 17.224 8.96043C16.6829 7.97142 15.8753 7.14903 14.8978 6.58983C14.4743 6.34754 14.0189 6.15467 13.5394 6.01905C13.0115 5.86975 12.4545 5.78986 11.8788 5.78986Z" />
    </svg>
  </div>

</nav-tab>