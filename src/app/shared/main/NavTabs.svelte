<script>

  import {appSettings} from '../../main/_stores/app-helper.store.js';

  let selectedTab = 'Configuration';

  let selectedLeftTab = 'Debug';

  function changeTab(tab){
    selectedTab = tab;
    appSettings.update(store => {
      store.activePanel = tab;
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

  function changeLeftTab(tab){

    if(selectedLeftTab === tab){
      tab = '';
    }

    selectedLeftTab = tab;

    console.log(tab);

    appSettings.update(store => {
      store.leftPanel = tab;
      return store;
    })
  }

</script>

<nav-tab style="background-color:rgb(25, 26, 32)" class=" flex px-1 flex-col items-center justify-between  h-full">
  <div class="flex flex-col">
    <!--
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
      on:click={()=>{changeTab('Profiles')}}  
      class="cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedTab == 'Profiles' ? 'bg-opacity-100' : 'bg-opacity-40'} bg-secondary ">
      <svg 
        class="stroke-current text-white" width="27" height="22" viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5.5L1.00028 19C1.0003 20.1046 1.89573 21 3.00028 21H24C25.1046 21 26 20.1046 26 19V7.5C26 6.39543 25.1046 5.5 24 5.5H11.0002M1 5.5V3C1 1.89543 1.89543 1 3 1H9.00019C10.1048 1 11.0002 1.89543 11.0002 3V5.5M1 5.5H11.0002"  stroke-width="2"/>
      </svg>
      <div class="left-0 -ml-1 absolute transition-all  {selectedTab == 'Profiles' ? 'h-8' : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"></div>
    </div>

    <div 
      on:click={()=>{changeTab('MIDI Monitor')}}  
      class="cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedTab == 'MIDI Monitor' ? 'bg-opacity-100 ' : 'bg-opacity-40 '} bg-secondary">
      <svg 
        class="fill-current text-white"  width="28"   viewBox="0 0 32 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M28 2H4C2.89543 2 2 2.89543 2 4V21C2 22.1046 2.89543 23 4 23H28C29.1046 23 30 22.1046 30 21V4C30 2.89543 29.1046 2 28 2ZM4 0C1.79086 0 0 1.79086 0 4V21C0 23.2091 1.79086 25 4 25H28C30.2091 25 32 23.2091 32 21V4C32 1.79086 30.2091 0 28 0H4Z" />
          <path d="M6.7666 10.1885L6.81494 10.8384C7.22673 10.3335 7.78353 10.0811 8.48535 10.0811C9.23372 10.0811 9.74756 10.3765 10.0269 10.9673C10.4351 10.3765 11.0169 10.0811 11.7725 10.0811C12.4027 10.0811 12.8717 10.2655 13.1797 10.6343C13.4876 10.9995 13.6416 11.5509 13.6416 12.2886V16H12.084V12.2939C12.084 11.9645 12.0195 11.7246 11.8906 11.5742C11.7617 11.4202 11.5343 11.3433 11.2085 11.3433C10.743 11.3433 10.4207 11.5653 10.2417 12.0093L10.2471 16H8.69482V12.2993C8.69482 11.9627 8.62858 11.7192 8.49609 11.5688C8.36361 11.4185 8.13802 11.3433 7.81934 11.3433C7.37891 11.3433 7.06022 11.5259 6.86328 11.8911V16H5.31104V10.1885H6.7666Z" />
          <path d="M16.4775 16H14.9199V10.1885H16.4775V16ZM14.8286 8.68457C14.8286 8.45182 14.9056 8.26025 15.0596 8.10986C15.2171 7.95947 15.4302 7.88428 15.6987 7.88428C15.9637 7.88428 16.175 7.95947 16.3325 8.10986C16.4901 8.26025 16.5688 8.45182 16.5688 8.68457C16.5688 8.9209 16.4883 9.11426 16.3271 9.26465C16.1696 9.41504 15.9601 9.49023 15.6987 9.49023C15.4373 9.49023 15.2261 9.41504 15.0649 9.26465C14.9074 9.11426 14.8286 8.9209 14.8286 8.68457Z" />
          <path d="M17.5195 13.0513C17.5195 12.1453 17.7218 11.4238 18.1265 10.8867C18.5347 10.3496 19.0915 10.0811 19.7969 10.0811C20.3626 10.0811 20.8299 10.2923 21.1987 10.7148V7.75H22.7563V16H21.3545L21.2793 15.3823C20.8926 15.8657 20.3949 16.1074 19.7861 16.1074C19.1022 16.1074 18.5526 15.8389 18.1372 15.3018C17.7254 14.7611 17.5195 14.0109 17.5195 13.0513ZM19.0718 13.1641C19.0718 13.7083 19.1667 14.1255 19.3564 14.4155C19.5462 14.7056 19.8219 14.8506 20.1836 14.8506C20.6634 14.8506 21.0018 14.6483 21.1987 14.2437V11.9502C21.0054 11.5456 20.6706 11.3433 20.1943 11.3433C19.446 11.3433 19.0718 11.9502 19.0718 13.1641Z"/>
          <path d="M25.5977 16H24.04V10.1885H25.5977V16ZM23.9487 8.68457C23.9487 8.45182 24.0257 8.26025 24.1797 8.10986C24.3372 7.95947 24.5503 7.88428 24.8188 7.88428C25.0838 7.88428 25.2951 7.95947 25.4526 8.10986C25.6102 8.26025 25.689 8.45182 25.689 8.68457C25.689 8.9209 25.6084 9.11426 25.4473 9.26465C25.2897 9.41504 25.0802 9.49023 24.8188 9.49023C24.5575 9.49023 24.3462 9.41504 24.1851 9.26465C24.0275 9.11426 23.9487 8.9209 23.9487 8.68457Z" />
      </svg>
      <div class="left-0 -ml-1 absolute transition-all  {selectedTab == 'MIDI Monitor' ? 'h-8' : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"></div>
    </div>
    -->
    <div 
      on:click={()=>{changeTab('Configuration')}}  
      class="cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedTab == 'Configuration' ? 'bg-opacity-100' : 'bg-opacity-40'} bg-secondary ">
      <svg 
        class="stroke-current text-white" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.6772" cy="12.6777" r="11.5"  stroke-width="2"/>
        <rect x="1.17725" y="12.1777" width="10" height="1" fill="black" />
      </svg>
      <div class="left-0 -ml-1 absolute transition-all  {selectedTab == 'Configuration' ? 'h-8' : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"></div>

    </div>




    <div 
      on:click={()=>{changeTab('Preferences')}}  
      class="cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedTab == 'Preferences' ? 'bg-opacity-100 ' : 'bg-opacity-40 '} bg-secondary">
      <svg 
        class=" fill-current text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2183 0.254654L13.5394 0.254654V3.74186C14.6186 3.96094 15.6218 4.38934 16.5048 4.98285L19.0189 2.46874L21.3673 4.81712L18.8372 7.34721C19.3982 8.20699 19.8043 9.17715 20.0155 10.218H23.5027V13.5391H20.0155C19.7965 14.6184 19.3681 15.6216 18.7745 16.5046L21.2887 19.0187L18.9403 21.3671L16.4102 18.837C15.5504 19.398 14.5802 19.804 13.5394 20.0153L13.5394 23.5026H10.2183L10.2183 20.0153C9.17739 19.804 8.20724 19.398 7.34746 18.837L4.81735 21.3671L2.46897 19.0187L4.98309 16.5046C4.38958 15.6216 3.96117 14.6184 3.74209 13.5391H0.254883L0.254883 10.218H3.74209C3.95338 9.17715 4.35938 8.20699 4.92042 7.34721L2.39033 4.81712L4.73872 2.46874L7.25284 4.98285C8.13581 4.38934 9.13902 3.96094 10.2183 3.74186V0.254654ZM11.8788 5.78986C11.3031 5.78986 10.7461 5.86975 10.2183 6.01905C9.73878 6.15467 9.28335 6.34754 8.85982 6.58983C7.88231 7.14903 7.07473 7.97142 6.53364 8.96043C6.31769 9.35513 6.1442 9.77638 6.01928 10.218C5.86998 10.7459 5.79009 11.3029 5.79009 11.8786C5.79009 12.4543 5.86998 13.0113 6.01928 13.5391C6.1549 14.0186 6.34778 14.4741 6.59007 14.8976C7.14927 15.8751 7.97167 16.6827 8.96068 17.2238C9.35538 17.4397 9.77662 17.6132 10.2183 17.7381C10.7461 17.8874 11.3031 17.9673 11.8788 17.9673C12.4545 17.9673 13.0115 17.8874 13.5394 17.7381C13.981 17.6132 14.4023 17.4397 14.797 17.2238C15.786 16.6827 16.6084 15.8751 17.1676 14.8976C17.4099 14.4741 17.6027 14.0186 17.7383 13.5391C17.8876 13.0113 17.9675 12.4543 17.9675 11.8786C17.9675 11.3029 17.8876 10.7459 17.7383 10.218C17.6134 9.77638 17.4399 9.35513 17.224 8.96043C16.6829 7.97142 15.8753 7.14903 14.8978 6.58983C14.4743 6.34754 14.0189 6.15467 13.5394 6.01905C13.0115 5.86975 12.4545 5.78986 11.8788 5.78986Z" />
      </svg>
      <div class="left-0 -ml-1 absolute transition-all  {selectedTab == 'Preferences' ? 'h-8' : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"></div>

    </div>

  </div>

  
  <div class="flex flex-col">
    <div 
      on:click={()=>{changeLeftTab('Debug')}}  
      class="cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab == 'Debug' ? 'bg-opacity-100' : 'bg-opacity-40'} bg-secondary ">
      <span class="text-white">Debug</span>
      <div class="left-0 -ml-1 absolute transition-all  {selectedLeftTab == 'Debug' ? 'h-8' : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"></div>
    </div>
  </div>
 

</nav-tab>